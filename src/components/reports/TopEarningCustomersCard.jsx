import React from 'react';
import { UsersRound } from 'lucide-react';

export const TopEarningCustomersCard = ({ customers = [] }) => (
  <div className="reports__card">
    <div className="reports__card-header">
      <h2 className="reports__card-title">Top Earning Customers</h2>
      <span className="reports__card-icon">
        <UsersRound size={20} strokeWidth={2} />
      </span>
    </div>

    <div className="reports__list">
      {customers.map((customer) => (
        <div className="reports__list-row" key={customer.name}>
          <div className="reports__list-main">
            <span className="reports__list-title">{customer.name}</span>
            <span className="reports__list-meta">
              {customer.invoices} {customer.invoices === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>

          <div className="reports__list-side">
            <span className="reports__list-amount">{customer.amount}</span>
            <span className="reports__list-meta">
              {customer.jobs} {customer.jobs === 1 ? 'Job' : 'Jobs'}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
