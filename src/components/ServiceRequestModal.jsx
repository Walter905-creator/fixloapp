import React, { useState } from 'react';

export default function ServiceRequestModal({ service, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!optIn) {
      alert("Please opt in to receive SMS updates.");
      return;
    }

    try {
      const res = await fetch('https://fixloapp.onrender.com/api/homeowner-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service: service.name })
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Request {service.name}</h2>

        {submitted ? (
          <p className="text-green-600 text-center">
            ✅ Thanks! We received your {service.name} request.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <input
              type="tel"
              placeholder="Your Phone Number"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <textarea
              placeholder="What do you need?"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <label className="text-sm flex items-center space-x-2">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              <span>
                I agree to receive SMS updates about my request. Reply STOP to unsubscribe.
              </span>
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Submit Request
            </button>
          </form>
        )}

        <button
          onClick={onClose}
          className="text-sm text-gray-600 mt-4 block mx-auto"
        >
          Close
        </button>
      </div>
    </div>
  );
}
