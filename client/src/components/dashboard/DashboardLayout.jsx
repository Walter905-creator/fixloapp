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

function normalizeNavItem(item) {
  if (typeof item === 'string') {
    return {
      key: item,
      label: item,
      logout: item === 'Log Out'
    };
  }

  return {
    key: item.key || item.label,
    label: item.label || item.key,
    logout: item.logout || item.label === 'Log Out',
    onClick: item.onClick
  };
}

export default function DashboardLayout({
  title,
  userName,
  dateRange,
  navItems = defaultNav,
  onLogout,
  onSelectItem,
  activeItem,
  headerAccessory,
  children
}) {
  const items = navItems.map(normalizeNavItem);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Fixlo</div>
        <nav>
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                {item.logout ? (
                  <button type="button" className="sidebar-link" onClick={onLogout}>{item.label}</button>
                ) : onSelectItem || item.onClick ? (
                  <button
                    type="button"
                    className={`sidebar-link${activeItem === item.key ? ' active' : ''}`}
                    onClick={() => (item.onClick || onSelectItem)?.(item.key)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="sidebar-link">{item.label}</span>
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
            {headerAccessory || <span className="dashboard-notification" aria-hidden="true">🔔</span>}
            <span className="dashboard-range">{dateRange}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
