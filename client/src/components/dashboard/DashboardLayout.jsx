import React from 'react';

const defaultNav = [
  'Overview',
  'Referrals or Leads',
  'Commissions or Earnings',
  'Payouts / Billing',
  'Profile',
  'Settings',
  'Support',
  'Log Out'
];

export default function DashboardLayout({ title, userName, dateRange, navItems = defaultNav, onLogout, children }) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Fixlo</div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item}>
                {item === 'Log Out' ? (
                  <button type="button" className="sidebar-link" onClick={onLogout}>{item}</button>
                ) : (
                  <span className="sidebar-link">{item}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{title}</h1>
            <p className="dashboard-user">{userName || 'Fixlo User'}</p>
          </div>
          <div className="dashboard-header-right">
            <span className="dashboard-notification" aria-hidden="true">🔔</span>
            <span className="dashboard-range">{dateRange}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
