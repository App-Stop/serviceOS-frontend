import React from 'react';

const customers = [
  { id: 1, name: 'Mickael Larry', added: 'Added Today', jobs: '2 Jobs', value: '~$3,123' },
  { id: 2, name: 'Sarah Connor', added: 'Added Yesterday', jobs: '5 Jobs', value: '~$7,890' },
  { id: 3, name: 'John Doe', added: 'Last Week', jobs: '3 Jobs', value: '~$2,450' },
  { id: 4, name: 'Emily Zhang', added: 'This Month', jobs: '4 Jobs', value: '~$4,750' },
];

export const NewCustomers = () => {
  return (
    <div className="card card--fill">
      <div className="card__header">
        <span className="card__title">New Customers</span>
        <button type="button" className="pill-button">
          <span className="pill-button__text">View All</span>
        </button>
      </div>
      <div className="list-rows">
        {customers.map((customer) => (
          <div key={customer.id} className="list-row">
            <div className="list-row__lead">
              <span className="list-row__primary">{customer.name}</span>
              <span className="list-row__secondary">{customer.added}</span>
            </div>
            <div className="list-row__trail">
              <span className="list-row__primary">{customer.jobs}</span>
              <span className="list-row__secondary">{customer.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
