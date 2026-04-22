import React, { useEffect } from 'react';

const Lightbox = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onNext, onPrev]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="lightbox-close" onClick={onClose}>
          ✕
        </button>
        
        {/* Botón anterior */}
        {images.length > 1 && (
          <button className="lightbox-prev" onClick={onPrev}>
            ‹
          </button>
        )}
        
        {/* Imagen actual */}
        <div className="lightbox-image-container">
          <img 
            src={currentImage.url || currentImage.url_foto} 
            alt={currentImage.descripcion || `Foto ${currentIndex + 1}`}
            className="lightbox-image"
          />
          {currentImage.descripcion && (
            <div className="lightbox-caption">
              {currentImage.descripcion}
            </div>
          )}
          <div className="lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
        
        {/* Botón siguiente */}
        {images.length > 1 && (
          <button className="lightbox-next" onClick={onNext}>
            ›
          </button>
        )}
        
        {/* Miniaturas */}
        {images.length > 1 && (
          <div className="lightbox-thumbnails">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`lightbox-thumbnail ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => onPrev(idx - currentIndex)}
              >
                <img src={img.url || img.url_foto} alt={`Miniatura ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lightbox;