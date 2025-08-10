import React, { useMemo } from 'react';

function formatRemaining(until) {
  const diff = new Date(until) - new Date();
  if (diff <= 0) return 'Boost expired';
  
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  
  if (days > 0) {
    return `${days}d ${hours}h left`;
  } else {
    return `${hours}h left`;
  }
}

export default function BoostPill({ boostActiveUntil }) {
  const isActive = boostActiveUntil && new Date(boostActiveUntil) > new Date();
  
  const text = useMemo(() => {
    if (!isActive) return null;
    return formatRemaining(boostActiveUntil);
  }, [boostActiveUntil, isActive]);
  
  if (!isActive) return null;
  
  return (
    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
      <span className="mr-1">🚀</span>
      <span>Boost active — {text}</span>
    </span>
  );
}