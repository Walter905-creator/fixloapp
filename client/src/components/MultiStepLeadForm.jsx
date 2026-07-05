import React from 'react';
import { API_BASE } from '../utils/config';
import { lookupZipCode } from '../utils/zipLookup';
import { normalizeUSPhone } from '../utils/phoneUtils';
import { trackMetaPixelEvent } from '../utils/metaPixel';

const DEFAULT_SERVICE_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'House Cleaning',
  'Junk Removal',
  'Landscaping',
  'Carpentry',
  'Remodeling'
];

const INITIAL_FORM = {
  serviceType: '',
  zip: '',
  city: '',
  state: '',
  preferredDate: '',
  name: '',
  phone: '',
  email: '',
  smsConsent: false
};

const STEP_LABELS = [
  'Select service',
  'Set location',
  'Choose date',
  'Share details',
  'Confirm consent'
];

function LoadingSpinner() {
  return (
    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
  );
}

export default function MultiStepLeadForm({
  title = 'Tell us about your project',
  serviceOptions = DEFAULT_SERVICE_OPTIONS,
  submitLabel = 'Get matched now',
  successTitle = 'You are all set',
  successMessage = 'Your request has been sent to Fixlo. A verified professional will reach out soon.',
  className = ''
}) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLocatingZip, setIsLocatingZip] = React.useState(false);
  const [zipLookupError, setZipLookupError] = React.useState('');
  const [submitError, setSubmitError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setSubmitError('');
  };

  const getStepErrors = (currentStep, draft = form) => {
    const nextErrors = {};

    if (currentStep === 1 && !draft.serviceType) {
      nextErrors.serviceType = 'Please choose a service type.';
    }

    if (currentStep === 2) {
      if (!/^\d{5}$/.test(draft.zip)) {
        nextErrors.zip = 'Enter a valid 5-digit ZIP code.';
      }
      if (!draft.city) {
        nextErrors.city = 'City is required.';
      }
      if (!draft.state) {
        nextErrors.state = 'State is required.';
      }
    }

    if (currentStep === 3 && !draft.preferredDate) {
      nextErrors.preferredDate = 'Please choose your preferred date.';
    }

    if (currentStep === 4) {
      if (!draft.name.trim()) {
        nextErrors.name = 'Name is required.';
      }
      if (!normalizeUSPhone(draft.phone)) {
        nextErrors.phone = 'Enter a valid U.S. phone number.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
        nextErrors.email = 'Enter a valid email address.';
      }
    }

    if (currentStep === 5 && !draft.smsConsent) {
      nextErrors.smsConsent = 'SMS consent is required to continue.';
    }

    return nextErrors;
  };

  const validateStep = (currentStep, draft = form) => {
    const nextErrors = getStepErrors(currentStep, draft);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = (draft = form) => {
    const nextErrors = {};

    for (let currentStep = 1; currentStep <= STEP_LABELS.length; currentStep += 1) {
      Object.assign(nextErrors, getStepErrors(currentStep, draft));
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const hydrateZipLocation = async () => {
    if (!/^\d{5}$/.test(form.zip)) {
      return { ok: false, draft: form };
    }

    if (form.city && form.state) {
      return { ok: true, draft: form };
    }

    setIsLocatingZip(true);
    setZipLookupError('');

    try {
      const location = await lookupZipCode(form.zip);
      const nextDraft = {
        ...form,
        zip: location.zip,
        city: form.city || location.city,
        state: form.state || location.state
      };
      setForm((current) => ({
        ...current,
        zip: location.zip,
        city: current.city || location.city,
        state: current.state || location.state
      }));
      return { ok: true, draft: nextDraft };
    } catch (error) {
      setZipLookupError(error.message || 'We could not verify that ZIP code yet.');
      return { ok: false, draft: form };
    } finally {
      setIsLocatingZip(false);
    }
  };

  const nextStep = async () => {
    let draft = form;

    if (step === 2) {
      const locationResult = await hydrateZipLocation();
      draft = locationResult.draft;
      if (!locationResult.ok && (!draft.city || !draft.state)) {
        setErrors((current) => ({
          ...current,
          city: current.city || 'Enter your city to continue.',
          state: current.state || 'Enter your state to continue.'
        }));
      }
    }

    if (!validateStep(step, draft)) {
      return;
    }

    setStep((current) => Math.min(current + 1, STEP_LABELS.length));
  };

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const locationResult = await hydrateZipLocation();
    const draft = locationResult.draft;

    if (!locationResult.ok && (!draft.city || !draft.state)) {
      setErrors((current) => ({
        ...current,
        city: current.city || 'Enter your city to continue.',
        state: current.state || 'Enter your state to continue.'
      }));
    }

    if (!validateAllSteps(draft)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const normalizedPhone = normalizeUSPhone(draft.phone);
      const response = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: draft.serviceType,
          fullName: draft.name.trim(),
          phone: normalizedPhone,
          email: draft.email.trim(),
          city: draft.city.trim(),
          state: draft.state.trim(),
          zipCode: draft.zip,
          preferredTime: draft.preferredDate,
          smsConsent: draft.smsConsent,
          details: 'Requested from homeowners funnel.'
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (!data.ok && !data.success)) {
        throw new Error(data.error || data.message || 'We could not submit your request.');
      }

      trackMetaPixelEvent('Lead', {
        content_name: 'Homeowner Funnel Request',
        content_category: draft.serviceType
      });

      setSuccess(true);
      setStep(STEP_LABELS.length);
    } catch (error) {
      setSubmitError(
        error instanceof TypeError
          ? 'We could not reach Fixlo right now. Please check your connection and try again.'
          : (error.message || 'We could not submit your request.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / STEP_LABELS.length) * 100;

  if (success) {
    return (
      <div className={`rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl ${className}`}>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
        <h3 className="mt-5 text-2xl font-extrabold text-slate-950">{successTitle}</h3>
        <p className="mt-3 text-sm text-slate-600">{successMessage}</p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">What happens next</p>
          <ul className="mt-3 space-y-2">
            <li>• Fixlo routes your request through the existing lead system.</li>
            <li>• Eligible homeowners receive SMS updates through the current notification workflow.</li>
            <li>• Verified professionals can respond with quotes.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Fast quote request</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{title}</h2>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          Step {step} / {STEP_LABELS.length}
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">{STEP_LABELS[step - 1]}</p>
      </div>

      <div className="mt-6 min-h-[320px] overflow-hidden rounded-2xl bg-slate-50 p-5">
        <div key={step} className="animate-[fadeIn_.25s_ease]">
          {step === 1 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-900">What do you need help with?</label>
              <select
                value={form.serviceType}
                onChange={(event) => updateField('serviceType', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select a service</option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.serviceType ? <p className="text-sm text-red-600">{errors.serviceType}</p> : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900">ZIP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.zip}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 5);
                    setZipLookupError('');
                    setForm((current) => ({ ...current, zip: value, city: '', state: '' }));
                    setErrors((current) => ({ ...current, zip: '', city: '', state: '' }));
                  }}
                  onBlur={hydrateZipLocation}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="e.g. 28202"
                />
                {errors.zip ? <p className="mt-2 text-sm text-red-600">{errors.zip}</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Location preview</p>
                  {isLocatingZip ? <span className="text-xs font-semibold text-emerald-600">Checking ZIP…</span> : null}
                </div>
                {form.city && form.state ? (
                  <p className="mt-2 text-sm text-slate-600">{form.city}, {form.state}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">We will match your ZIP code to the right local market.</p>
                )}
              </div>

              {zipLookupError ? <p className="text-sm text-amber-700">{zipLookupError}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Charlotte"
                  />
                  {errors.city ? <p className="mt-2 text-sm text-red-600">{errors.city}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900">State</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value.toUpperCase().slice(0, 2))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="NC"
                  />
                  {errors.state ? <p className="mt-2 text-sm text-red-600">{errors.state}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-900">Preferred date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.preferredDate}
                onChange={(event) => updateField('preferredDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              {errors.preferredDate ? <p className="text-sm text-red-600">{errors.preferredDate}</p> : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Your name"
                />
                {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="(555) 123-4567"
                />
                {errors.phone ? <p className="mt-2 text-sm text-red-600">{errors.phone}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="you@example.com"
                />
                {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Review your request</p>
                <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-900">Service</dt>
                    <dd>{form.serviceType}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Location</dt>
                    <dd>{form.city}, {form.state} {form.zip}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Preferred date</dt>
                    <dd>{form.preferredDate}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Contact</dt>
                    <dd>{form.name}</dd>
                  </div>
                </dl>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={form.smsConsent}
                  onChange={(event) => updateField('smsConsent', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                <span className="text-sm text-slate-700">
                  I agree to receive SMS notifications related to my request. Reply STOP to unsubscribe.
                </span>
              </label>
              {errors.smsConsent ? <p className="text-sm text-red-600">{errors.smsConsent}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 1 || isSubmitting}
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {step < STEP_LABELS.length ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={isLocatingZip}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocatingZip ? <LoadingSpinner /> : 'Continue'}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoadingSpinner /> : null}
            {isSubmitting ? 'Submitting…' : submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
