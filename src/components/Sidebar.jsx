import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  House,
  UsersRound,
  CalendarRange,
  BriefcaseBusiness,
  ReceiptText,
  MessagesSquare,
  HardHat,
  UserStar,
  ChartColumn,
  UserRound,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { name: 'Home', path: '/dashboard', icon: House },
  { name: 'Customers', path: '/customers', icon: UsersRound },
  { name: 'Schedule', path: '/schedule', icon: CalendarRange },
  { name: 'Jobs', path: '/jobs', icon: BriefcaseBusiness },
  { name: 'Invoices', path: '/invoices', icon: ReceiptText },
  { name: 'Communication', path: '/communication', icon: MessagesSquare },
  { name: 'Team', path: '/team', icon: HardHat },
  { name: 'Reviews', path: '/reviews', icon: UserStar },
  { name: 'Report', path: '/reports', icon: ChartColumn },
];

export const Sidebar = ({ collapsed = false, onMobileSelect }) => {
  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">{collapsed ? 'S' : 'ServiceOS'}</span>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={name}
              to={path}
              end={path === '/'}
              title={collapsed ? name : undefined}
              onClick={() => onMobileSelect?.()}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <Icon className="sidebar__icon" size={20} strokeWidth={2} />
              <span className="sidebar__label">{name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <a className="sidebar__profile" href="#profile">
        <span className="sidebar__avatar">
          <UserRound size={20} strokeWidth={2} />
        </span>
        <span className="sidebar__profile-meta">
          <span className="sidebar__profile-name">John Doe</span>
          <span className="sidebar__profile-role">Super Admin</span>
        </span>
      </a>
    </aside>
  );
};
