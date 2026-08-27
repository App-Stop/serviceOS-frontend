import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  DollarSign,
  Pencil,
  Plus,
  ReceiptText,
  UserStar,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { useCustomer, updateCustomer, initials, formatCurrency } from '../data/customers';
import patrik from '../assets/avatars/patrik.png';
import mike from '../assets/avatars/mike.png';
import glow from '../assets/button-glow.svg';
import './CustomerDetail.css';

const chipAvatars = { patrik, mike };

const BackButton = () => (
  <Link className="ghost-button" to="/customers">
    <ArrowLeft size={20} strokeWidth={2} />
    Back to Customers
  </Link>
);

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = useCustomer(id);
  const [editing, setEditing] = useState(false);

  if (!customer) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="customer-detail__missing">
            <h1 className="page-title__heading">Customer not found</h1>
            <p className="page-title__subheading">
              This record may have been removed from the prototype store.
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/customers')}>
              Back to Customers
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell topbarLead={<BackButton />}>
      <div className="app-shell__content">
        <div className="customer-detail__header">
          <div className="customer-detail__identity">
            <span className="avatar-initials avatar-initials--xl">{initials(customer.name)}</span>
            <h1 className="page-title__heading">{customer.name}</h1>
            <p className="page-title__subheading">Customer since {customer.since}</p>
          </div>

          
        </div>

        <div className="customer-detail__grid">
          <div className="customer-detail__row customer-detail__row--stats">
            <StatCard
              icon={DollarSign}
              value={formatCurrency(customer.totalBilled)}
              label="Total Billed"
            />
            <StatCard
              icon={BriefcaseBusiness}
              value={customer.activeJobs}
              label={customer.activeJobs === 1 ? 'Active Job' : 'Active Jobs'}
            />
            <StatCard icon={ReceiptText} value={customer.invoices} label="Total Invoices" />
            <StatCard icon={UserStar} value={customer.rating} label="Rated" showStar />
          </div>

          <div className="customer-detail__row">
            {/* Job history */}
            <div className="card card--fill">
              <div className="card__header card__header--tall">
                <span className="customer-detail__section-title">Job History</span>
              </div>
              <div className="list-rows">
                {customer.jobs.map((job) => (
                  <div key={job.id} className="list-row">
                    <div className="list-row__lead">
                      <span className="list-row__title-line">
                        <span className="customer-detail__job-title">{job.title}</span>
                        {job.status && <span className="chip chip--danger">{job.status}</span>}
                      </span>
                      <span className="customer-detail__job-assignee">
                        <img className="chip__avatar" src={mike} alt="" />
                        <span className="list-row__secondary">{job.assignee}</span>
                      </span>
                    </div>
                    <div className="list-row__trail">
                      <span className="list-row__primary">{job.date}</span>
                      <span className="list-row__secondary">{job.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="customer-detail__column">
              {/* Customer information */}
              <div className="card">
                <div className="card__header card__header--tall">
                  <span className="customer-detail__section-title">Customer Information</span>
                  <button type="button" className="pill-button" onClick={() => setEditing(true)}>
                    <Pencil size={16} strokeWidth={2} />
                    <span className="pill-button__text">Edit</span>
                  </button>
                </div>

                <div className="field-list">
                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">Phone</span>
                      <span className="field-list__value">{customer.phone || '—'}</span>
                    </div>
                    <div className="field-list__item">
                      <span className="field-list__label">Email</span>
                      <span className="field-list__value">{customer.email || '—'}</span>
                    </div>
                  </div>

                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">Locations</span>
                      <span className="field-list__values">
                        {customer.locations.length > 0 ? (
                          customer.locations.map((location) => (
                            <span key={location} className="field-list__value">
                              {location}
                            </span>
                          ))
                        ) : (
                          <span className="field-list__value">—</span>
                        )}
                      </span>
                    </div>
                    <div className="field-list__item">
                      <span className="field-list__label">Notes</span>
                      <span className="field-list__value">{customer.notes || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="card customer-detail__column-filler">
                <div className="card__header card__header--tall">
                  <span className="customer-detail__section-title">Recent Activity</span>
                </div>
                <div className="activity__list">
                  {customer.activity.map((entry) => (
                    <div key={entry.id} className="activity__item">
                      <span className="avatar-initials avatar-initials--lg">
                        {initials(customer.name)}
                      </span>
                      <div className="activity__body">
                        <div className="activity__line">
                          <span className="activity__actor">{entry.actor}</span>
                          <span className="activity__verb">{entry.verb}</span>
                          <span className="activity__target">{entry.target}</span>
                          {entry.connector && (
                            <span className="activity__verb">{entry.connector}</span>
                          )}
                          {entry.chip && (
                            <span className={`chip chip--${entry.chip.variant}`}>
                              {entry.chip.avatar && (
                                <img
                                  className="chip__avatar"
                                  src={chipAvatars[entry.chip.avatar]}
                                  alt=""
                                />
                              )}
                              {entry.chip.label}
                            </span>
                          )}
                        </div>
                        <span className="activity__time">{entry.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <CustomerFormModal
          customer={customer}
          onClose={() => setEditing(false)}
          onSave={(values) => {
            updateCustomer(customer.id, values);
            setEditing(false);
          }}
        />
      )}
    </AppShell>
  );
};

export default CustomerDetail;
