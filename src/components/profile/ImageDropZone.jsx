import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { readImageFile } from './readImageFile';

/** Full-width dashed drop target used for the invoice header cover. */
export const ImageDropZone = ({
  value,
  onChange,
  title = 'Drop image or click to upload',
  hint = 'PNG, JPG Max 2MB.',
  alt = '',
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const accept = async (file) => {
    const dataUrl = await readImageFile(file);
    if (dataUrl) onChange(dataUrl);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragging(false);
    await accept(event.dataTransfer.files?.[0]);
  };

  const handlePick = async (event) => {
    await accept(event.target.files?.[0]);
    event.target.value = '';
  };

  return (
    <div
      className={`drop-zone${dragging ? ' drop-zone--active' : ''}${
        value ? ' drop-zone--filled' : ''
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      {value ? (
        <>
          <img className="drop-zone__image" src={value} alt={alt} />
          <button
            type="button"
            className="drop-zone__clear"
            onClick={(event) => {
              event.stopPropagation();
              onChange('');
            }}
            aria-label="Remove image"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </>
      ) : (
        <>
          <Upload size={32} strokeWidth={1.5} />
          <p className="drop-zone__title">{title}</p>
          <p className="drop-zone__hint">{hint}</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={handlePick}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};
