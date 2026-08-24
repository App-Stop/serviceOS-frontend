import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { useCustomers, sendMessage } from '../data';
import glow from '../assets/button-glow.svg';
import './FormModal.css';

export const SendMessageModal = ({ onClose, onSend }) => {
  const customers = useCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customers[0]?.id ? String(customers[0].id) : '',
  );
  const [type, setType] = useState('Email'); // 'Email' | 'SMS'
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  const customerOptions = useMemo(
    () => customers.map((c) => ({ id: String(c.id), label: c.name })),
    [customers],
  );

  const typeOptions = [
    { id: 'Email', label: 'Email' },
    { id: 'SMS', label: 'SMS' },
  ];

  const selectedCustomer =
    customers.find((c) => String(c.id) === selectedCustomerId) || customers[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const created = sendMessage({
      type: type.toLowerCase(),
      recipientName: selectedCustomer?.name || 'Customer',
      recipientContact:
        type === 'SMS'
          ? selectedCustomer?.phone || '(555) 201-1014'
          : selectedCustomer?.email || 'customer@email.com',
      job: 'General Request',
      subject: subject.trim() || `${type} Message`,
      message: messageText.trim(),
    });

    onSend?.(created);
    onClose();
  };

  return (
    <div
      className="form-modal__overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="form-modal max-w-[480px] rounded-[30px] p-4 flex flex-col gap-5 bg-white shadow-modal-low"
        role="dialog"
        aria-modal="true"
        aria-label="Send Message"
      >
        <div className="flex items-center justify-between w-full h-8">
          <h2 className="text-base font-semibold text-neutral-900">Send Message</h2>
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full text-black-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-neutral-900">Customer</label>
            <FilterDropdown
              label="Select customer"
              value={selectedCustomerId}
              options={customerOptions}
              onChange={(id) => setSelectedCustomerId(id)}
              fullWidth
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-neutral-900">Type</label>
            <FilterDropdown
              label="Select type"
              value={type}
              options={typeOptions}
              onChange={(id) => setType(id)}
              fullWidth
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-neutral-900">Subject</label>
            <input
              type="text"
              className="w-full h-11 px-3.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
              placeholder="Message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-neutral-900">Message</label>
            <textarea
              className="w-full h-24 p-3.5 rounded-[20px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 resize-none"
              placeholder="Write your message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 w-full pt-2">
            <button
              type="button"
              className="ghost-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cta-button"
              disabled={!messageText.trim()}
            >
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <span className="cta-button__label">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
