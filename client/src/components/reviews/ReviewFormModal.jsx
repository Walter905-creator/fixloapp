import React, { useState } from 'react';
import api from '../../lib/api';

export default function ReviewFormModal({ proId, onClose, onSubmitted, isOpen }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [homeownerName, setName] = useState('');
  const [homeownerCity, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const canSubmit = rating >= 1 && rating <= 5 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    
    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/profiles/${proId}/reviews`, { 
        rating, 
        text, 
        homeownerName, 
        homeownerCity 
      });
      
      onSubmitted?.(data);
      onClose();
      
      // Reset form
      setRating(5);
      setText('');
      setName('');
      setCity('');
    } catch (e) {
      console.error('Review submission error:', e);
      alert('Could not submit review. Please try again.');
    } finally { 
      setSubmitting(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-4">
        <div className="text-lg font-semibold">Leave a review</div>
        
        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Rating</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={rating} 
                onChange={e => setRating(Number(e.target.value))}
                className="flex-1" 
              />
              <div className="text-sm font-medium text-gray-900">{rating} / 5 stars</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Your review</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              rows={5} 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="How was the work quality, communication, punctuality?"
              maxLength={4000}
            />
            <div className="text-xs text-gray-500 mt-1">{text.length}/4000 characters</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Your name (optional)</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={homeownerName} 
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">City (optional)</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={homeownerCity} 
                onChange={e => setCity(e.target.value)}
                placeholder="Your city"
                maxLength={120}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            disabled={!canSubmit} 
            onClick={submit} 
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}