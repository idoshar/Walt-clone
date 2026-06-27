const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function isValidCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function hasValidCoordinates(coordinates) {
  return Boolean(
    coordinates &&
      isValidCoordinate(coordinates.latitude) &&
      isValidCoordinate(coordinates.longitude)
  );
}

export function calculateDistanceInKm(from, to) {
  if (!hasValidCoordinates(from) || !hasValidCoordinates(to)) {
    return null;
  }

  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);

  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return EARTH_RADIUS_KM * centralAngle;
}

export function sortRestaurantsByDistance(restaurants, userCoordinates) {
  if (!Array.isArray(restaurants)) {
    return [];
  }

  return restaurants
    .map((restaurant) => {
      const restaurantCoordinates = {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      };

      return {
        ...restaurant,
        distanceKm: calculateDistanceInKm(
          userCoordinates,
          restaurantCoordinates
        ),
      };
    })
    .sort((firstRestaurant, secondRestaurant) => {
      if (
        firstRestaurant.distanceKm === null &&
        secondRestaurant.distanceKm === null
      ) {
        return 0;
      }

      if (firstRestaurant.distanceKm === null) {
        return 1;
      }

      if (secondRestaurant.distanceKm === null) {
        return -1;
      }

      return firstRestaurant.distanceKm - secondRestaurant.distanceKm;
    });
}