import { useEffect } from 'react';

function Modal({
  title,
  onClose,
  children,
  size = 'medium',
  onBack = null,
  backLabel = 'Back to previous screen',
  modalClassName = ''
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="app-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        className={`app-modal app-modal-${size} ${modalClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="app-modal-header">
          <h2>{title}</h2>

          <div className="app-modal-header-actions">
            {typeof onBack === 'function' && (
              <button
                type="button"
                className="app-modal-header-back-button"
                onClick={onBack}
                aria-label={backLabel}
                title={backLabel}
              >
                &larr;
              </button>
            )}

            <button
              type="button"
              className="app-modal-close-button"
              onClick={onClose}
              aria-label={`Close ${title}`}
            >
              &times;
            </button>
          </div>
        </header>

        <div className="app-modal-content">{children}</div>
      </section>
    </div>
  );
}

export default Modal;