import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { SearchModal } from './SearchModal';
import '../styles/ui.css';
import './AppShell.css';

/**
 * Sidebar + top bar frame shared by every signed-in screen.
 *
 * `topbarLead` renders after the collapse toggle, for page-level controls
 * such as the customer detail screen's "Back to Customers" button.
 * `topbarActions` replaces the default search / notification buttons, which
 * the invoice builder swaps for its own save controls.
 */
export const AppShell = ({ topbarLead, topbarActions, children }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="app-shell">
      {!collapsed && (
        <div
          className="app-shell__overlay"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onMobileSelect={() => setCollapsed(true)}
      />

      <main className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-lead">
            <button
              type="button"
              className="icon-button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen size={22} strokeWidth={2} />
              ) : (
                <PanelLeftClose size={22} strokeWidth={2} />
              )}
            </button>
            {topbarLead}
          </div>

          <div className="app-shell__topbar-actions">
            {topbarActions ?? (
              <>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <Search size={22} strokeWidth={2} />
                </button>
                <button type="button" className="icon-button" aria-label="Notifications">
                  <Bell size={22} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </header>

        {children}
      </main>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onSelect={(item) => item.to && navigate(item.to)}
        />
      )}
    </div>
  );
};
