import React from 'react';
import '../FormModal.css';

/**
 * Small confirmation dialog for the Danger Zone actions, built on the shared
 * form-modal shell so it matches the app's other dialogs.
 */
export const ConfirmDialog = ({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <div className="form-modal__overlay" role="dialog" aria-modal="true" onClick={onCancel}>
    <div className="form-modal" onClick={(event) => event.stopPropagation()}>
      <header className="form-modal__header">
        <h2 className="form-modal__title">{title}</h2>
        <p className="form-modal__subtitle">{description}</p>
      </header>

      <div className="form-modal__actions justify-end">
        <button type="button" className="ghost-button" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="danger-button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
