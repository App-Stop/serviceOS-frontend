/**
 * ServiceOS Central Data Store & Barrel Module.
 *
 * Unifies access across all core data stores:
 * - Customers (`src/data/customers.js`)
 * - Jobs (`src/data/jobs.js`)
 * - Invoices (`src/data/invoices.js`)
 * - Team Members & Crews (`src/data/team.js`)
 *
 * Provides cross-store hooks and query utilities for consistent data flow
 * across the entire application.
 */

import { useMemo } from 'react';
import { useCustomers } from './customers';
import { useJobs } from './jobs';
import { useInvoices, invoiceTotal, formatMoney } from './invoices';
import { useTeamMembers, useCrews } from './team';

export * from './customers';
export * from './team';
export * from './communications';
export * from './reviews';
export * from './reports';
export * from './services';
export * from './schedule';
export * from './profile';

export {
  JOB_STATUSES,
  JOB_PRIORITIES,
  JOB_TIMELINE,
  statusLabel as jobStatusLabel,
  priorityLabel,
  CURRENT_USER,
  relativeTime,
  activityTime,
  addJob,
  updateJob,
  logJobActivity,
  setJobStatus,
  setJobPriority,
  removeJob,
  resetJobs,
  useJobs,
  useJob,
  formatBudget,
} from './jobs';

export {
  TAX_RATE,
  INVOICE_STATUSES,
  INVOICE_TABS,
  INVOICE_SORTS,
  LINE_UNITS,
  PAYMENT_METHODS,
  statusLabel as invoiceStatusLabel,
  ISSUER,
  addInvoice,
  updateInvoice,
  setInvoiceStatus,
  removeInvoice,
  resetInvoices,
  useInvoices,
  useInvoice,
  nextInvoiceNumber,
  blankLineItem,
  isBlankLineItem,
  lineTotal,
  formatMoney,
  invoiceTotal,
  invoiceTotals,
  countByStatus,
} from './invoices';

/**
 * Global search hook that dynamically queries Customers, Jobs, Invoices,
 * and Team Members across the centralized data store.
 */
export const useGlobalSearch = (query = '') => {
  const customers = useCustomers();
  const jobs = useJobs();
  const invoices = useInvoices();
  const team = useTeamMembers();

  return useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const results = [];

    // Search Customers
    customers.forEach((customer) => {
      if (
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      ) {
        results.push({
          id: `c-${customer.id}`,
          group: 'Customers',
          kind: 'person',
          title: customer.name,
          meta: customer.email || customer.phone,
          to: `/customers/${customer.id}`,
        });
      }
    });

    // Search Jobs
    jobs.forEach((job) => {
      if (
        job.title.toLowerCase().includes(term) ||
        job.customer.toLowerCase().includes(term) ||
        job.technician.toLowerCase().includes(term) ||
        (job.type && job.type.toLowerCase().includes(term))
      ) {
        results.push({
          id: `j-${job.id}`,
          group: 'Jobs',
          kind: 'job',
          title: job.title,
          meta: `${job.customer} · ${job.technician}`,
          to: `/jobs/${job.id}`,
        });
      }
    });

    // Search Invoices
    invoices.forEach((invoice) => {
      if (
        invoice.number.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term)
      ) {
        results.push({
          id: `i-${invoice.id}`,
          group: 'Invoices',
          kind: 'invoice',
          title: invoice.number,
          meta: `${invoice.customer} · ${formatMoney(invoiceTotal(invoice))}`,
          to: `/invoices/${invoice.id}`,
        });
      }
    });

    // Search Team
    team.forEach((member) => {
      if (
        member.name.toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term)
      ) {
        results.push({
          id: `t-${member.id}`,
          group: 'Team',
          kind: 'person',
          title: member.name,
          meta: `${member.role} · ${member.crew || 'Solo'}`,
          to: `/team/${member.id}`,
        });
      }
    });

    return results;
  }, [customers, jobs, invoices, team, query]);
};

/**
 * Aggregates live prototype metrics across all stores.
 */
export const useCentralMetrics = () => {
  const customers = useCustomers();
  const jobs = useJobs();
  const invoices = useInvoices();
  const team = useTeamMembers();
  const crews = useCrews();

  return useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0);
    const activeJobsCount = jobs.filter((j) => j.status !== 'completed' && j.status !== 'cancelled').length;
    const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;
    const activeCustomersCount = customers.filter((c) => c.status === 'active').length;

    return {
      customersCount: customers.length,
      activeCustomersCount,
      jobsCount: jobs.length,
      activeJobsCount,
      completedJobsCount,
      invoicesCount: invoices.length,
      totalInvoiced,
      teamMembersCount: team.length,
      crewsCount: crews.length,
    };
  }, [customers, jobs, invoices, team, crews]);
};
