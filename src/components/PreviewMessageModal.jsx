import React from 'react';
import { X } from 'lucide-react';
import { initials } from '../data';
import './FormModal.css';

export const PreviewMessageModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      className="form-modal__overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="form-modal max-w-[420px] rounded-[30px] p-4 flex flex-col gap-5 bg-white shadow-modal-low"
        role="dialog"
        aria-modal="true"
        aria-label="Preview Message"
      >
        <div className="flex items-center justify-between w-full h-8">
          <h2 className="text-base font-semibold text-neutral-900">Preview Message</h2>
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full text-black-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 w-full bg-neutral-50 p-3.5 rounded-[20px] border border-neutral-200">
          <span className="text-xs font-normal text-black-200">Message</span>
          <p className="text-sm font-medium text-neutral-900 leading-relaxed">
            {message.message || message.subject}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal text-black-200">Type</span>
            <span className="text-sm font-medium text-neutral-900 uppercase">
              {message.type}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal text-black-200">Sent On</span>
            <span className="text-sm font-medium text-neutral-900">
              {message.sentOnFull || message.sentAt}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal text-black-200">Sent by</span>
            <span className="text-sm font-medium text-neutral-900">
              {message.sentBy || 'Automated'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal text-black-200">Recipient</span>
            <div className="flex items-center gap-1.5">
              <span className="avatar-initials avatar-initials--sm shrink-0 size-5 text-[10px]">
                {initials(message.recipientName)}
              </span>
              <span className="text-sm font-medium text-neutral-900 truncate">
                {message.recipientName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end w-full pt-2">
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
