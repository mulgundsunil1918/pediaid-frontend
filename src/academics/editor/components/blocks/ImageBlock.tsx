// =============================================================================
// blocks/ImageBlock.tsx
// =============================================================================

import { useRef, useState } from 'react';
import { Upload, Link2, X, AlertCircle } from 'lucide-react';
import { useUploadImage } from '../../hooks/useChapterEditor';
import type { ImageBlock as IImageBlock } from '../../types/editor.types';

interface ImageBlockProps {
  block: IImageBlock;
  onUpdate: (updates: Partial<IImageBlock>) => void;
}

const MAX_SIZE_MB = 5;

export function ImageBlock({ block, onUpdate }: ImageBlockProps) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [sizeError, setSizeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadImage();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError('');

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setSizeError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync(file);
      onUpdate({ src: result.url });
    } catch {
      setSizeError('Upload failed. Try pasting a URL instead.');
    }
  }

  function handleUseUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onUpdate({ src: trimmed });
    setUrlInput('');
    setShowUrlInput(false);
  }

  // ── No image yet ──────────────────────────────────────────────────────────
  if (!block.src) {
    return (
      <div className="py-2">
        {/* Drop / click zone */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl
                     p-8 flex flex-col items-center gap-2 text-ink-muted
                     hover:border-accent hover:text-accent hover:bg-blue-50/30
                     transition-colors cursor-pointer"
          aria-label="Upload image"
        >
          <Upload size={28} aria-hidden="true" />
          <span className="text-sm font-medium">Click to upload</span>
          <span className="text-xs">JPG, PNG — max {MAX_SIZE_MB} MB</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
        />

        {uploadMutation.isPending && (
          <p className="text-xs text-ink-muted mt-2 text-center animate-pulse">
            Uploading…
          </p>
        )}

        {sizeError && (
          <p className="mt-2 text-xs text-danger flex items-center gap-1">
            <AlertCircle size={12} aria-hidden="true" />
            {sizeError}
          </p>
        )}

        {/* URL alternative */}
        <div className="mt-3">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted
                         hover:text-accent transition-colors"
            >
              <Link2 size={12} aria-hidden="true" />
              Or paste an image URL
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUseUrl()}
                placeholder="https://…"
                className="flex-1 text-xs border border-border rounded-lg px-3 py-2
                           outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleUseUrl}
                className="px-3 py-2 text-xs font-semibold text-white rounded-lg
                           transition-colors"
                style={{ backgroundColor: '#3182ce' }}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="p-2 text-ink-muted hover:text-ink rounded-lg
                           hover:bg-gray-100 transition-colors"
                aria-label="Cancel URL input"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Image loaded ──────────────────────────────────────────────────────────
  return (
    <div className="py-2 space-y-3">
      {/* Preview */}
      <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-border">
        <img
          src={block.src}
          alt={block.alt || 'Chapter image'}
          className="w-full object-contain"
          style={{ maxHeight: '400px' }}
        />
        <button
          type="button"
          onClick={() => onUpdate({ src: '', alt: '', caption: '' })}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow
                     text-ink-muted hover:text-danger transition-colors"
          aria-label="Change image"
        >
          <X size={14} />
        </button>
      </div>

      {/* Alt text (required) */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1">
          Alt text{' '}
          <span className="text-danger" aria-label="required">
            *
          </span>{' '}
          <span className="font-normal">(required for accessibility)</span>
        </label>
        <input
          type="text"
          value={block.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Describe the image for screen readers…"
          className="w-full text-sm border border-border rounded-lg px-3 py-2
                     outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Caption (optional) */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1">
          Caption{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Add a caption…"
          className="w-full text-sm border border-border rounded-lg px-3 py-2
                     outline-none focus:border-accent transition-colors italic
                     text-ink-muted"
        />
      </div>
    </div>
  );
}
