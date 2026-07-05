import React, { useState } from 'react';
import { API_BASE } from '../utils/config';
import { normalizeUSPhone } from '../utils/phoneUtils';
import { trackMetaPixelEvent } from '../utils/metaPixel';

const API_URL = API_BASE;

const SERVICE_TYPES = [
  'General Repairs',
  'Electrical',
  'Plumbing',
  'Drywall',
  'Painting',
  'Flooring',
  'Carpentry',
  'Other'
];

const URGENCY_OPTIONS = [
  'Same day',
  'Within 48 hours',
  'This week',
  'Flexible'
];

export default function ServiceIntakeModal({ open, onClose, defaultCity, defaultService, customHeading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: defaultService ? defaultService.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
    otherServiceType: '',
    description: '',
    address: '',
    city: defaultCity ? defaultCity.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
    state: defaultCity && /charlotte/i.test(defaultCity) ? 'NC' : '',
    zip: '',
    urgency: 'Flexible',
    photos: [],
    name: '',
    phone: '',
    termsAccepted: false,
    smsConsent: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 7;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.serviceType) {
        newErrors.serviceType = 'Please select a service type';
      }
      if (formData.serviceType === 'Other' && !formData.otherServiceType) {
        newErrors.otherServiceType = 'Please specify the service type';
      }
    }

    if (step === 2) {
      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      }
    }

    if (step === 3) {
      if (!formData.address) {
        newErrors.address = 'Address is required';
      }
      if (!formData.city) {
        newErrors.city = 'City is required';
      }
      if (!formData.state) {
        newErrors.state = 'State is required';
      }
      if (!formData.zip || !/^\d{5}$/.test(formData.zip)) {
        newErrors.zip = 'Valid 5-digit ZIP code is required';
      }
    }

    if (step === 6) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the terms to continue';
      }
    }

    if (step === 7) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      // Validate phone can be normalized to E.164
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else {
        const normalized = normalizeUSPhone(formData.phone);
        if (!normalized) {
          newErrors.phone = 'Please enter a valid 10-digit U.S. phone number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.photos.length > 5) {
      setErrors({ photos: 'Maximum 5 photos allowed' });
      return;
    }
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitRequest = async () => {
    // Free quote submission — no payment required
    setIsSubmitting(true);
    setErrors({});

    try {
      const normalizedPhone = normalizeUSPhone(formData.phone);
      if (!normalizedPhone) {
        setErrors({ phone: 'Please enter a valid U.S. phone number (10 digits).' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        serviceType: formData.serviceType === 'Other' ? formData.otherServiceType : formData.serviceType,
        fullName: formData.name,
        phone: normalizedPhone,
        city: formData.city,
        state: formData.state,
        smsConsent: formData.smsConsent || false,
        details: formData.description || ''
      };

      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit request');
      }

      const responseData = await res.json();
      if (!responseData.requestId && !responseData.ok) {
        throw new Error(responseData.error || 'Request was not created properly');
      }

      // Track Meta Pixel Lead event
      trackMetaPixelEvent('Lead', {
        content_name: 'Service Request',
        content_category: 'Service Request Submission'
      });

      setSubmitSuccess(true);
      setCurrentStep(totalSteps);

    } catch (err) {
      console.error('❌ Submission error:', err);
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForm = async (data) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      
      submitData.append('serviceType', data.serviceType === 'Other' ? data.otherServiceType : data.serviceType);
      submitData.append('description', data.description);
      submitData.append('address', data.address);
      submitData.append('city', data.city);
      submitData.append('state', data.state);
      submitData.append('zip', data.zip);
      submitData.append('urgency', data.urgency);
      submitData.append('name', data.name);
      submitData.append('phone', data.phone);
      submitData.append('termsAccepted', data.termsAccepted);
      submitData.append('smsConsent', data.smsConsent || false);

      // Add photos
      data.photos.forEach(photo => {
        submitData.append('photos', photo);
      });

      const response = await fetch(`${API_URL}/api/service-intake/submit`, {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit request');
      }

      setSubmitSuccess(true);
      setCurrentStep(totalSteps);

    } catch (err) {
      console.error('Submit error:', err);
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">What type of service do you need?</h3>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleInputChange('serviceType', type)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.serviceType === type
                      ? 'border-brand bg-brand/5 font-semibold'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {formData.serviceType === 'Other' && (
              <input
                type="text"
                placeholder="Please specify..."
                value={formData.otherServiceType}
                onChange={(e) => handleInputChange('otherServiceType', e.target.value)}
                className="input w-full"
              />
            )}
            {errors.serviceType && <p className="text-red-600 text-sm">{errors.serviceType}</p>}
            {errors.otherServiceType && <p className="text-red-600 text-sm">{errors.otherServiceType}</p>}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Briefly describe the issue or project</h3>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide details about what you need help with..."
              rows={6}
              className="input w-full"
              minLength={20}
              required
            />
            <p className="text-sm text-slate-600">
              {formData.description.length}/20 characters minimum
            </p>
            {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Service address</h3>
            <input
              type="text"
              placeholder="Street Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="input w-full"
              required
            />
            {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="input w-full"
                  required
                />
                {errors.city && <p className="text-red-600 text-sm">{errors.city}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="input w-full"
                  maxLength={2}
                  required
                />
                {errors.state && <p className="text-red-600 text-sm">{errors.state}</p>}
              </div>
            </div>
            
            <input
              type="text"
              placeholder="ZIP Code"
              value={formData.zip}
              onChange={(e) => handleInputChange('zip', e.target.value)}
              className="input w-full"
              maxLength={5}
              required
            />
            {errors.zip && <p className="text-red-600 text-sm">{errors.zip}</p>}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">How soon do you need service?</h3>
            <div className="space-y-3">
              {URGENCY_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => handleInputChange('urgency', option)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    formData.urgency === option
                      ? 'border-brand bg-brand/5 font-semibold'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Upload photos (optional but recommended)</h3>
            <p className="text-slate-600">Photos help us better understand your needs. Maximum 5 photos.</p>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="block w-full p-8 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all"
            >
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="mt-2 text-slate-600">Click to upload photos</p>
            </label>
            
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.photos && <p className="text-red-600 text-sm">{errors.photos}</p>}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Free Quote & Terms</h3>
            <div className="bg-emerald-50 p-6 rounded-lg space-y-3 text-slate-800 border border-emerald-200">
              <p className="font-semibold text-lg text-emerald-800">✓ Your quote request is completely free!</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>No upfront fees</strong> — getting a quote costs nothing</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Get matched with verified local professionals for free</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>You will receive a detailed quote before any work begins</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>No work will start without your approval</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Materials (if needed) will be itemized in the final quote</span>
                </li>
              </ul>
            </div>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                className="mt-1 h-5 w-5 text-brand border-slate-300 rounded focus:ring-brand"
              />
              <span className="text-slate-700">
                I understand and agree to the terms. I acknowledge that getting a free quote has no upfront fees or obligations.
              </span>
            </label>
            {errors.termsAccepted && <p className="text-red-600 text-sm">{errors.termsAccepted}</p>}
          </div>
        );

      case 7:
        if (submitSuccess) {
          return (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Free Quote Request Submitted! 🎉</h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-2 text-sm text-slate-800">
                <p className="font-semibold text-green-800">✓ Free quote request created</p>
                <p className="font-semibold text-green-800">✓ Verified professionals notified</p>
                <p className="text-green-700">No upfront fees charged</p>
              </div>
              <p className="text-slate-700 font-medium">
                Your free quote request has been submitted successfully. A professional will contact you soon.
              </p>
              <p className="text-slate-700 font-medium">
                📞 Expect a call or text shortly to discuss your project.
              </p>
              <button
                onClick={onClose}
                className="btn-primary mt-4"
              >
                Close
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Contact Information</h3>
            <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800 border border-emerald-200">
              <strong>Free Quote</strong> — No payment required to submit your request.
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input w-full"
              required
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">+1</span>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input w-full pl-10"
                required
              />
            </div>
            {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
            
            {/* SMS Consent */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={(e) => handleInputChange('smsConsent', e.target.checked)}
                  className="mt-1 h-5 w-5 text-brand border-slate-300 rounded focus:ring-brand"
                />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Receive SMS updates (optional)</p>
                  <p className="text-slate-600">
                    Get text notifications when your service is scheduled, when technician arrives, and when work is complete. Reply STOP to opt out anytime.
                  </p>
                </div>
              </label>
            </div>

            {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (validateStep(7)) {
                  handleSubmitRequest();
                }
              }}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Request Free Quote'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">{customHeading || 'Home Service Request'}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          
          {/* Progress indicator */}
          {!submitSuccess && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-brand h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Footer */}
        {!submitSuccess && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            {currentStep < totalSteps && (
              <button
                onClick={nextStep}
                className="btn-primary"
              >
                {'Next →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
