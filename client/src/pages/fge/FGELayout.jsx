/**
 * FGE Layout — shared shell for all Growth Engine pages.
 * Provides sidebar navigation and top bar.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Growth Dashboard',    path: '/dashboard/admin/fge',                icon: '📈' },
  { label: 'AI Marketing Center', path: '/dashboard/admin/fge/marketing',       icon: '🤖' },
  { label: 'SEO Engine',          path: '/dashboard/admin/fge/seo',             icon: '🔍' },
  { label: 'Blog Engine',         path: '/dashboard/admin/fge/blog',            icon: '✍️'  },
  { label: 'Email Automation',    path: '/dashboard/admin/fge/email',           icon: '📧' },
  { label: 'SMS Automation',      path: '/dashboard/admin/fge/sms',             icon: '💬' },
  { label: 'Referral System',     path: '/dashboard/admin/fge/referral',        icon: '🔗' },
  { label: 'Analytics',           path: '/dashboard/admin/fge/analytics',       icon: '📊' },
  { label: 'AI Insights',         path: '/dashboard/admin/fge/insights',        icon: '💡' },
  { label: 'Reviews',             path: '/dashboard/admin/fge/reviews',         icon: '⭐' },
  { label: 'Seasonal Campaigns',  path: '/dashboard/admin/fge/seasonal',        icon: '🌤️'  },
  { label: 'Queue Monitor',       path: '/dashboard/admin/fge/queue',           icon: '⚙️'  },
  { label: 'FGE Settings',        path: '/dashboard/admin/fge/settings',        icon: '🔑' },
];

export default function FGELayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-200 flex flex-col`}
      >
        {/* Logo / toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          {sidebarOpen && (
            <span className="text-lg font-bold text-blue-400 whitespace-nowrap">
              ⚡ FGE
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto text-gray-400 hover:text-white"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg mx-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={item.label}
              >
                <span className="text-base">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Back to admin */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800">
            <Link
              to="/dashboard/admin"
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
            >
              ← Back to Admin
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-semibold text-white">
            Fixlo Growth Engine
          </h1>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">
            FGE v1.0
          </span>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
