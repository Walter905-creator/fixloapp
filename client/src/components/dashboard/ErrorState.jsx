import React from 'react';

export default function ErrorState({ title = 'Unable to load dashboard', message = 'Please try again.', onRetry }) {
  return (
    <div className="dashboard-error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="dashboard-btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
