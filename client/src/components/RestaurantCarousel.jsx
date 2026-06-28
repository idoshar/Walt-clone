import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import RestaurantCard from './RestaurantCard.jsx';

const VIRTUAL_CARD_COUNT = 9;

function modulo(value, length) {
  return ((value % length) + length) % length;
}

function getRestaurantIdentity(restaurants) {
  return restaurants
    .map((restaurant, index) =>
      String(restaurant?.id ?? restaurant?.name ?? index)
    )
    .join('|');
}

function RestaurantCarousel({
  sectionId,
  eyebrow,
  title,
  restaurants = [],
  emptyMessage
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const animationDirectionRef = useRef(0);
  const dragStartXRef = useRef(null);

  const [startIndex, setStartIndex] = useState(0);
  const [cardUnit, setCardUnit] = useState(0);
  const [visualStep, setVisualStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const safeRestaurants = Array.isArray(restaurants)
    ? restaurants.filter(Boolean)
    : [];

  const restaurantIdentity = getRestaurantIdentity(
    safeRestaurants
  );

  const isLooping =
    hasOverflow &&
    safeRestaurants.length > 1;

  const displayedRestaurants = useMemo(() => {
    if (!isLooping) {
      return safeRestaurants.map((restaurant, index) => ({
        restaurant,
        slot: index
      }));
    }

    return Array.from(
      { length: VIRTUAL_CARD_COUNT },
      (_, slot) => ({
        restaurant:
          safeRestaurants[
            modulo(
              startIndex + slot - 1,
              safeRestaurants.length
            )
          ],
        slot
      })
    );
  }, [
    isLooping,
    safeRestaurants,
    startIndex
  ]);

  useEffect(() => {
    setStartIndex(0);
    setVisualStep(1);
    setIsAnimating(false);
    animationDirectionRef.current = 0;
  }, [restaurantIdentity]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return undefined;
    }

    function measureCarousel() {
      const firstSlide = track.querySelector(
        '.restaurant-carousel-slide'
      );

      if (!firstSlide) {
        return;
      }

      const styles = window.getComputedStyle(track);

      const gap =
        Number.parseFloat(styles.columnGap) ||
        Number.parseFloat(styles.gap) ||
        0;

      const nextCardUnit =
        firstSlide.getBoundingClientRect().width + gap;

      const totalRestaurantWidth =
        safeRestaurants.length * nextCardUnit - gap;

      const nextHasOverflow =
        safeRestaurants.length > 1 &&
        totalRestaurantWidth >
          viewport.clientWidth + 2;

      setCardUnit(nextCardUnit);
      setHasOverflow(nextHasOverflow);
    }

    const frameId = window.requestAnimationFrame(
      measureCarousel
    );

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measureCarousel);

    resizeObserver?.observe(viewport);

    window.addEventListener(
      'resize',
      measureCarousel
    );

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener(
        'resize',
        measureCarousel
      );
    };
  }, [
    isLooping,
    restaurantIdentity,
    safeRestaurants.length
  ]);

  function moveCarousel(direction) {
    if (
      !isLooping ||
      isAnimating ||
      cardUnit <= 0
    ) {
      return;
    }

    animationDirectionRef.current = direction;
    setIsAnimating(true);

    /*
     * visualStep 1 = first visible card is slot 1.
     * visualStep 2 moves one card left.
     * visualStep 0 moves one card right.
     */
    setVisualStep(direction > 0 ? 2 : 0);
  }

  function handleTransitionEnd(event) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== 'transform' ||
      !isAnimating
    ) {
      return;
    }

    const direction = animationDirectionRef.current;

    if (direction === 0) {
      return;
    }

    setStartIndex((currentIndex) =>
      modulo(
        currentIndex + direction,
        safeRestaurants.length
      )
    );

    animationDirectionRef.current = 0;
    setIsAnimating(false);
    setVisualStep(1);
  }

  function handleTrackKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveCarousel(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveCarousel(1);
    }
  }

  function handlePointerDown(event) {
    dragStartXRef.current = event.clientX;
  }

  function handlePointerUp(event) {
    const startX = dragStartXRef.current;

    dragStartXRef.current = null;

    if (startX === null) {
      return;
    }

    const distance = event.clientX - startX;

    if (Math.abs(distance) < 40) {
      return;
    }

    moveCarousel(distance < 0 ? 1 : -1);
  }

  function handlePointerCancel() {
    dragStartXRef.current = null;
  }

  const headingId = `${sectionId}-title`;
  const trackId = `${sectionId}-track`;

  const translateX = isLooping
    ? -visualStep * cardUnit
    : 0;

  return (
    <section
      className="restaurant-section restaurant-carousel-section"
      aria-labelledby={headingId}
    >
      <div className="restaurant-section-heading">
        <div>
          {eyebrow && (
            <p className="section-eyebrow">
              {eyebrow}
            </p>
          )}

          <h2 id={headingId}>{title}</h2>
        </div>
      </div>

      {safeRestaurants.length > 0 ? (
        <div
          ref={viewportRef}
          className="restaurant-carousel-viewport"
        >
          <div
            id={trackId}
            ref={trackRef}
            className="restaurant-carousel-track"
            role="list"
            tabIndex="0"
            aria-label={`${title} restaurants`}
            onKeyDown={handleTrackKeyDown}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: isAnimating
                ? 'transform 280ms ease'
                : 'none'
            }}
          >
            {displayedRestaurants.map(
              ({ restaurant, slot }) => (
                <div
                  key={
                    isLooping
                      ? `virtual-slot-${slot}`
                      : restaurant.id ??
                        `${restaurant.name}-${slot}`
                  }
                  className="restaurant-carousel-slide"
                  role="listitem"
                >
                  <RestaurantCard restaurant={restaurant} />
                </div>
              )
            )}
          </div>

          {isLooping && (
            <div
              className="restaurant-carousel-edge-controls"
              aria-label={`${title} navigation`}
            >
              <button
                type="button"
                className="restaurant-carousel-edge-control restaurant-carousel-edge-control-previous"
                onClick={() => moveCarousel(-1)}
                aria-label={`Show previous ${title.toLowerCase()}`}
                aria-controls={trackId}
              >
                <span aria-hidden="true">‹</span>
              </button>

              <button
                type="button"
                className="restaurant-carousel-edge-control restaurant-carousel-edge-control-next"
                onClick={() => moveCarousel(1)}
                aria-label={`Show next ${title.toLowerCase()}`}
                aria-controls={trackId}
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="section-empty-message">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export default RestaurantCarousel;
