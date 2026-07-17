import React, { useMemo, useState } from 'react';

const RATING_FIELDS = [
  { key: 'overall', label: 'Overall' },
  { key: 'communication', label: 'Communication' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'quality', label: 'Quality' },
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'value', label: 'Value' }
];

function getDefaultName() {
  try {
    const raw = localStorage.getItem('fixlo_user');
    if (!raw) return '';
    const user = JSON.parse(raw);
    return user?.name || '';
  } catch (error) {
    return '';
  }
}

export default function ReviewForm({ proId, jobId, proName, onSubmit, onCancel }) {
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    professionalism: 0,
    quality: 0,
    timeliness: 0,
    value: 0
  });
  const [review, setReview] = useState('');
  const [recommend, setRecommend] = useState('yes');
  const [name, setName] = useState(() => getDefaultName());
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const charsRemaining = useMemo(() => 500 - review.length, [review.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ratings.overall) {
      setError('Please select an overall rating.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit?.({
        proId,
        jobId,
        proName,
        ratings,
        review,
        recommend: recommend === 'yes',
        name,
        city
      });
      setSuccess(true);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-3xl">⭐</div>
        <h3 className="mt-3 text-lg font-bold text-emerald-900">Review submitted</h3>
        <p className="mt-1 text-sm text-emerald-700">Thank you for sharing your experience with {proName || 'your pro'}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <p className="text-sm font-semibold text-slate-500">Leave a review</p>
        <h3 className="text-xl font-bold text-slate-900">{proName || 'Professional'}</h3>
      </div>

      <div className="mt-5 space-y-5">
        {RATING_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-slate-700">{field.label}</label>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatings((current) => ({ ...current, [field.key]: value }))}
                  className={`text-2xl transition ${value <= ratings[field.key] ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                  aria-label={`${field.label} ${value} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label htmlFor="review-text" className="block text-sm font-semibold text-slate-700">Review</label>
          <textarea
            id="review-text"
            value={review}
            onChange={(event) => setReview(event.target.value.slice(0, 500))}
            rows={5}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            placeholder="Tell other homeowners about your experience."
          />
          <p className="mt-1 text-right text-xs text-slate-400">{charsRemaining} characters remaining</p>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Would you recommend this pro?</legend>
          <div className="mt-2 flex gap-4">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ].map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="recommend"
                  value={option.value}
                  checked={recommend === option.value}
                  onChange={(event) => setRecommend(event.target.value)}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="reviewer-name" className="block text-sm font-semibold text-slate-700">Name</label>
            <input
              id="reviewer-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="reviewer-city" className="block text-sm font-semibold text-slate-700">City</label>
            <input
              id="reviewer-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              placeholder="Your city"
            />
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </form>
  );
}
