import React from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../../data';

export const InvoicePipelineCard = ({ pipeline = [], recentInvoices = [] }) => (
  <div className="reports__card">
    <div className="reports__card-header">
      <h2 className="reports__card-title">Invoice Pipeline</h2>
      <Link className="pill-button" to="/invoices">
        <span className="pill-button__text">View all invoices</span>
      </Link>
    </div>

    <div className="reports__pipeline">
      {pipeline.map((entry) => (
        <div className="reports__pipeline-tile" key={entry.status}>
          <span className={`invoice-chip invoice-chip--${entry.status}`}>
            {entry.label}
          </span>
          <div className="reports__pipeline-figures">
            <span className="reports__pipeline-count">{entry.count}</span>
            <span className="reports__pipeline-amount">{entry.amount}</span>
          </div>
        </div>
      ))}
    </div>

    <h3 className="reports__card-title">Recent Invoices</h3>

    <div className="reports__table-wrap">
      <table className="reports__table">
        <colgroup>
          <col className="reports__col--number" />
          <col className="reports__col--customer" />
          <col className="reports__col--stamp" />
          <col className="reports__col--stamp" />
          <col className="reports__col--status" />
          <col className="reports__col--amount" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Invoice #</th>
            <th scope="col">Customer</th>
            <th scope="col">Created</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {recentInvoices.map((invoice, index) => (
            <tr key={`${invoice.customer}-${index}`}>
              <td className="reports__cell--center">{index + 1}</td>
              <td>
                <span className="reports__person">
                  <span className="avatar-initials avatar-initials--sm">
                    {initials(invoice.customer)}
                  </span>
                  {invoice.customer}
                </span>
              </td>
              <td>
                <span className="reports__stamp">
                  {invoice.created}
                  <span className="reports__stamp-time">{invoice.createdTime}</span>
                </span>
              </td>
              <td>
                <span className="reports__stamp">
                  {invoice.due}
                  <span className="reports__stamp-time">{invoice.dueTime}</span>
                </span>
              </td>
              <td>
                <span className={`invoice-chip invoice-chip--${invoice.status}`}>
                  {invoice.status[0].toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td>{invoice.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
