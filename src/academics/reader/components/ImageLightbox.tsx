// =============================================================================
// reader/components/ImageLightbox.tsx
// =============================================================================

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, caption, onClose }: ImageLightboxProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center
                 bg-black/85 p-4 animate-[fadeIn_150ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10
                   text-white hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Caption */}
      {caption && (
        <p
          className="mt-3 text-white/70 text-sm italic text-center max-w-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
