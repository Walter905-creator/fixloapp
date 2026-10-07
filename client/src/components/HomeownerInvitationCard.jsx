import React, { useEffect, useState } from 'react';

export default function HomeownerInvitationCard({ authFetch, onRequestQuote }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  useEffect(() => {
    let active = true;
    authFetch('/api/homeowner-referrals').then(value => { if (active) setData(value); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [authFetch]);

  async function verifyPhone(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await authFetch('/api/homeowner-referrals/phone/verify', { method: 'POST', body: JSON.stringify({ code }) });
      setData(result); setSent(false); setCode('');
      setNotice('Phone verified. Your invitation benefits have been updated.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function sendCode() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await authFetch('/api/homeowner-referrals/phone/send', { method: 'POST', body: JSON.stringify({ verificationConsent: consent }) });
      if (result.alreadyVerified) setData(await authFetch('/api/homeowner-referrals'));
      else { setSent(true); setNotice('Verification text sent. Enter the six-digit code below.'); }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function shareInvitation() {
    setError(''); setNotice('');
    const text = `Join Fixlo with my invitation and get 10% off one project total after verifying your phone. Request a free quote.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Your Fixlo invitation', text, url: data.link });
      else { await navigator.clipboard.writeText(`${text} ${data.link}`); setNotice('Invitation copied. Paste it into your message.'); }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Select and copy the invitation link below to share it.');
    }
  }

  const messages = {
    available: 'Your 10% welcome discount is available for one project total. It is used once payment succeeds.',
    verify_phone: 'Verify your phone to activate your one-time 10% welcome discount.',
    used: 'Your welcome discount has been used. You can still share your invitation with other homeowners.',
    reserved: 'Your 10% discount is reserved for a project payment. It cannot be applied to another project.',
    unavailable: 'This phone has already claimed a welcome discount on another account. You can still share your invitation.',
    not_invited: 'Share your invitation to give new homeowners a one-time 10% discount.'
  };

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Welcome discount and invitations">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Your welcome discount & invitations</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{data ? messages[data.status] : error ? 'Invitation details could not be loaded.' : 'Loading your invitation…'}</p>
        </div>
        <button type="button" onClick={onRequestQuote} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Request a Free Quote</button>
      </div>
      {data?.status === 'verify_phone' && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
            I agree to receive a phone verification text. Message and data rates may apply. Reply STOP to opt out. This does not subscribe me to promotional texts.
          </label>
          <button type="button" disabled={busy || !consent} onClick={sendCode} className="mt-3 rounded-xl border border-emerald-300 px-4 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50">{busy ? 'Please wait…' : sent ? 'Send another code' : 'Verify my phone'}</button>
          {sent && <form onSubmit={verifyPhone} className="mt-3 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="homeowner-phone-code">Six-digit verification code</label>
            <input id="homeowner-phone-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required placeholder="Six-digit code" className="rounded-xl border border-slate-300 px-3 py-2" />
            <button disabled={busy || code.length !== 6} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Activate discount</button>
          </form>}
        </div>
      )}
      {data?.link && <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-900">Your invitation for friends: {data.code}</p>
        <p className="mt-1 text-xs text-slate-500">Friends receive their own discount and invitation after signing up. Sharing does not renew your personal discount.</p>
        <label className="sr-only" htmlFor="homeowner-invitation-link">Your invitation link</label>
        <input id="homeowner-invitation-link" readOnly value={data.link} onFocus={e => e.target.select()} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700" />
        <button type="button" onClick={shareInvitation} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Share invitation</button>
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    </section>
  );
}
