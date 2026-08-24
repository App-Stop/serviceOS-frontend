import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { readImageFile } from './readImageFile';

/**
 * Dashed circular preview beside an upload pill — used for the profile photo
 * and the business logo. `icon` is the placeholder glyph shown while empty.
 */
export const ImageUpload = ({
  value,
  onChange,
  icon: Icon,
  buttonLabel = 'Upload',
  hint,
  alt = '',
}) => {
  const inputRef = useRef(null);

  const handlePick = async (event) => {
    const dataUrl = await readImageFile(event.target.files?.[0]);
    if (dataUrl) onChange(dataUrl);
    /* Allow re-picking the same file after a clear. */
    event.target.value = '';
  };

  return (
    <div className="image-upload">
      <div className={`image-upload__preview${value ? ' image-upload__preview--filled' : ''}`}>
        {value ? (
          <img className="image-upload__image" src={value} alt={alt} />
        ) : (
          Icon && <Icon size={40} strokeWidth={1.5} />
        )}
      </div>

      <button type="button" className="pill-button image-upload__button" onClick={() => inputRef.current?.click()}>
        <Upload size={20} strokeWidth={2} />
        <span className="pill-button__text">{buttonLabel}</span>
      </button>

      {value && (
        <button
          type="button"
          className="image-upload__clear"
          onClick={() => onChange('')}
          aria-label="Remove image"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}

      {hint && <p className="image-upload__hint">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        onChange={handlePick}
      />
    </div>
  );
};
