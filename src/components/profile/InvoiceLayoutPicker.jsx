import React from 'react';

/**
 * Miniature invoice wireframe. Drawn from plain blocks rather than a bitmap
 * so the thumbnails stay crisp and follow the surrounding surface colors.
 */
const LayoutPreview = ({ preview }) => (
  <div className={`layout-preview layout-preview--${preview}`}>
    <div className="layout-preview__head">
      <span className="layout-preview__mark" />
      <span className="layout-preview__title" />
    </div>
    <div className="layout-preview__meta">
      <span />
      <span />
    </div>
    <div className="layout-preview__rule" />
    <div className="layout-preview__lines">
      <span />
      <span />
      <span />
    </div>
    <div className="layout-preview__total">
      <span />
    </div>
  </div>
);

export const InvoiceLayoutPicker = ({ layouts, value, onChange }) => (
  <div className="layout-picker" role="radiogroup" aria-label="Invoice layout">
    {layouts.map((layout) => {
      const selected = layout.id === value;

      return (
        <button
          key={layout.id}
          type="button"
          role="radio"
          aria-checked={selected}
          className={`layout-picker__option${selected ? ' layout-picker__option--selected' : ''}`}
          onClick={() => onChange(layout.id)}
        >
          <span className="layout-picker__thumb">
            <LayoutPreview preview={layout.preview} />
          </span>
          <span className="layout-picker__body">
            <span className="layout-picker__name">{layout.name}</span>
            <span className="layout-picker__description">{layout.description}</span>
          </span>
        </button>
      );
    })}
  </div>
);
