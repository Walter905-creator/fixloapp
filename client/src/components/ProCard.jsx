import React from 'react';
import VerificationBadge from './VerificationBadge';

// Example ProCard component showing how to use VerificationBadge
export default function ProCard({ pro }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{pro.name}</h3>
        <VerificationBadge status={pro.verificationStatus} />
      </div>
      <p className="text-gray-600">{pro.trade}</p>
      <p className="text-sm text-gray-500">{pro.location}</p>
      {pro.verificationNotes && (
        <p className="text-xs text-gray-400 mt-2">
          Note: {pro.verificationNotes}
        </p>
      )}
    </div>
  );
}