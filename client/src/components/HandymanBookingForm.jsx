import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { csrfFetch } from '../utils/csrf';

const INITIAL = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  preferredDate: '',
  preferredTime: '',
  details: '',
  smsConsent: false,
  pricingAccepted: false
};

export default function HandymanBookingForm() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const checkout = searchParams.get('checkout');
    if (checkout !== 'success' || !sessionId) return;

    let cancelled = false;
    fetch(`${API_BASE}/api/subscribe/handyman-checkout/verify?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: 'include'
    })
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (ok && body.verified) {
          setPaymentComplete(true);
          setMessage('Payment received. Your handyman request is confirmed and Fixlo will contact you with scheduling details.');
        } else {
          setMessage(body.message || 'We could not verify the payment. Please contact Fixlo support.');
        }
      })
      .catch(() => {
        if (!cancelled) setMessage('We could not verify the payment. Please contact Fixlo support.');
      });

    return () => { cancelled = true; };
  }, [searchParams]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!form.pricingAccepted) {
      setMessage('Please confirm the $120 hourly labor rate and materials policy.');
      return;
    }
    if (form.details.trim().length < 20) {
      setMessage('Please provide at least 20 characters describing the work.');
      return;
    }

    setLoading(true);
    try {
      const response = await csrfFetch(`${API_BASE}/api/subscribe/handyman-checkout`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Unable to start secure checkout.');
      }
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error.message || 'Unable to start secure checkout.');
      setLoading(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-300 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-3xl">✓</div>
        <h1 className="mt-5 text-3xl font-black text-black">Handyman booked</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <p className="mt-5 text-sm text-slate-500">The $120 checkout covers the first labor hour. Additional labor and materials are billed separately with your approval.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-amber-300 bg-white shadow-2xl">
      <div className="bg-black px-6 py-7 text-white md:px-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">Direct handyman booking</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Get a Handyman</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Tell us what you need, confirm the address, and securely reserve the first hour through Stripe.</p>
      </div>

      <form onSubmit={submit} className="grid gap-5 p-6 md:grid-cols-2 md:p-10">
        <label className="block text-sm font-bold text-slate-800">Full name
          <input required name="fullName" value={form.fullName} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block text-sm font-bold text-slate-800">Email
          <input required type="email" name="email" value={form.email} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block text-sm font-bold text-slate-800">Phone
          <input required name="phone" value={form.phone} onChange={update} placeholder="(555) 555-5555" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block text-sm font-bold text-slate-800">Street address
          <input required name="address" value={form.address} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block text-sm font-bold text-slate-800">City
          <input required name="city" value={form.city} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold text-slate-800">State
            <input required name="state" value={form.state} onChange={update} maxLength="2" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase" />
          </label>
          <label className="block text-sm font-bold text-slate-800">ZIP code
            <input required name="zipCode" value={form.zipCode} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <label className="block text-sm font-bold text-slate-800">Preferred date
          <div className="mt-2 flex w-full min-w-0 rounded-xl border border-slate-300 px-4 py-3">
            <input type="date" name="preferredDate" value={form.preferredDate} onChange={update} className="block w-full min-w-0 border-0 bg-transparent p-0" />
          </div>
        </label>
        <label className="block text-sm font-bold text-slate-800">Preferred time
          <select name="preferredTime" value={form.preferredTime} onChange={update} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">
            <option value="">Select a time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
            <option>Flexible</option>
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-800 md:col-span-2">Describe the work
          <textarea required name="details" value={form.details} onChange={update} rows="5" maxLength="1000" placeholder="Describe the repairs, installation, measurements, access details, and anything the handyman should know." className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 md:col-span-2">
          <p className="text-xl font-black text-black">$120 per labor hour + materials</p>
          <p className="mt-2 text-sm text-slate-700">Stripe checkout charges $120 to reserve and cover the first labor hour. Additional time is billed at $120 per hour. Materials and approved purchases are additional. Scheduling is confirmed after payment and availability review.</p>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-700 md:col-span-2">
          <input required type="checkbox" name="pricingAccepted" checked={form.pricingAccepted} onChange={update} className="mt-1" />
          <span>I understand and accept the $120 hourly labor rate, the first-hour Stripe charge, and that materials and additional labor are charged separately.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700 md:col-span-2">
          <input type="checkbox" name="smsConsent" checked={form.smsConsent} onChange={update} className="mt-1" />
          <span>I agree to receive SMS updates about this booking. Message and data rates may apply. Reply STOP to unsubscribe.</span>
        </label>

        {message && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">{message}</div>}

        <button disabled={loading} className="rounded-xl bg-amber-400 px-6 py-4 text-lg font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2">
          {loading ? 'Opening secure checkout…' : 'Reserve a Handyman — Pay $120'}
        </button>
        <p className="text-center text-xs text-slate-500 md:col-span-2">Secure payment processed by Stripe.</p>
      </form>
    </div>
  );
}
