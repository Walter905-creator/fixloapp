import React from 'react';

export default function EmptyState({ title, message, action }) {
  return (
    <div className="dashboard-empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
