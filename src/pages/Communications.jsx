import React, { useMemo, useState } from 'react';
import { Search, Send, Phone, Mail } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { SendMessageModal } from '../components/SendMessageModal';
import { PreviewMessageModal } from '../components/PreviewMessageModal';
import { useMessages, useAutoAlerts, toggleAutoAlert } from '../data';
import glow from '../assets/button-glow.svg';
import './Communications.css';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
];

const Communications = () => {
  const messages = useMessages();
  const autoAlerts = useAutoAlerts();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sms' | 'email'
  const [query, setQuery] = useState('');

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const filteredMessages = useMemo(() => {
    const term = query.trim().toLowerCase();

    return messages.filter((item) => {
      if (activeTab !== 'all' && item.type !== activeTab) {
        return false;
      }

      if (!term) return true;

      return (
        item.recipientName.toLowerCase().includes(term) ||
        item.recipientContact.toLowerCase().includes(term) ||
        item.job.toLowerCase().includes(term) ||
        item.subject.toLowerCase().includes(term)
      );
    });
  }, [messages, activeTab, query]);

  return (
    <AppShell>
      <div className="app-shell__content comm__body">
        <div className="page-title">
          <h1 className="page-title__heading">Communications</h1>
          <p className="page-title__subheading">
            {messages.length} messages sent today
          </p>
        </div>

        <div className="comm__toolbar">
          <div className="comm__toolbar-lead">
            <div className="comm__search">
              <Search className="comm__search-icon" size={20} strokeWidth={2} />
              <input
                type="text"
                className="comm__search-input"
                placeholder="Search customer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="comm__filters">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`pill-button pill-button--lg${
                    activeTab === tab.id ? ' pill-button--selected' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="pill-button__text">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="cta-button"
            onClick={() => setSendModalOpen(true)}
          >
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            <Send size={18} strokeWidth={2} />
            <span className="cta-button__label">Send New Message</span>
          </button>
        </div>

        <div className="comm__split">
          <div className="comm__table-wrap">
            <table className="comm__table">
              <colgroup>
                <col className="comm__col--type" />
                <col className="comm__col--recipient" />
                <col className="comm__col--job" />
                <col className="comm__col--subject" />
                <col className="comm__col--sent" />
                <col className="comm__col--status" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="text-center">
                    Type
                  </th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Job</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Sent</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((item) => (
                  <tr
                    key={item.id}
                    className="comm__row"
                    onClick={() => setSelectedMessage(item)}
                  >
                    <td className="text-center">
                      <div className="comm__type-icon">
                        {item.type === 'sms' ? (
                          <Phone size={18} strokeWidth={2} />
                        ) : (
                          <Mail size={18} strokeWidth={2} />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="comm__recipient">
                        <span className="comm__recipient-name">
                          {item.recipientName}
                        </span>
                        <span className="comm__recipient-contact">
                          {item.recipientContact}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="comm__job-title">{item.job}</span>
                    </td>
                    <td>
                      <span className="comm__subject-text">{item.subject}</span>
                    </td>
                    <td>
                      <div className="comm__timestamp">
                        <span>{item.sentAt}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          item.status === 'sent' ? 'chip--success' : 'chip--neutral'
                        }`}
                      >
                        {item.status === 'sent' ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredMessages.length === 0 && (
                  <tr>
                    <td className="comm__empty" colSpan={6}>
                      No messages match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="comm__alerts-panel">
            <div className="comm__alerts-header">
              <h2 className="comm__alerts-title">Auto Alerts</h2>
              <p className="comm__alerts-subtitle">
                Automatically notify customers when status changes
              </p>
            </div>

            <div className="comm__alerts-list">
              {autoAlerts.map((alert) => (
                <div key={alert.id} className="comm__alert-item">
                  <div className="comm__alert-info">
                    <span className="comm__alert-label">{alert.label}</span>
                    <span className="comm__alert-channel">{alert.type}</span>
                  </div>

                  <button
                    type="button"
                    className={`comm__toggle ${
                      alert.enabled ? 'comm__toggle--on' : 'comm__toggle--off'
                    }`}
                    onClick={() => toggleAutoAlert(alert.id)}
                    aria-label={`Toggle ${alert.label}`}
                  >
                    <div className="comm__toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sendModalOpen && (
        <SendMessageModal
          onClose={() => setSendModalOpen(false)}
          onSend={(msg) => setSelectedMessage(msg)}
        />
      )}

      {selectedMessage && (
        <PreviewMessageModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </AppShell>
  );
};

export default Communications;
