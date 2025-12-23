import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { STRIPE_PUBLISHABLE_KEY, API_BASE } from '../utils/config';

// Initialize Stripe with validated key
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('❌ STRIPE_PUBLISHABLE_KEY is not configured');
  throw new Error('Stripe publishable key is required');
}

// Runtime validation for Live Mode in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
    console.error('❌ SECURITY ERROR: Stripe LIVE publishable key required');
    throw new Error('Stripe LIVE publishable key required in production');
  }
}

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

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

function PaymentForm({ formData, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get client secret from backend
      const response = await fetch(`${API_URL}/api/service-intake/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Enhanced error handling for 401 and other errors
        if (response.status === 401) {
          throw new Error('Payment authentication failed. Please contact support.');
        }
        throw new Error(data.message || 'Failed to initialize payment');
      }

      // Confirm the setup intent with the card
      const { error, setupIntent } = await stripe.confirmCardSetup(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: {
                line1: formData.address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.zip
              }
            }
          }
        }
      );

      if (error) {
        console.error('Stripe confirmCardSetup error:', error);
        throw new Error(error.message);
      }

      // Success - payment method saved
      onSuccess({
        stripeCustomerId: data.customerId,
        stripePaymentMethodId: setupIntent.payment_method
      });

    } catch (err) {
      console.error('Payment setup error:', err);
      onError(err.message || 'Payment setup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-200 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b',
                '::placeholder': {
                  color: '#94a3b8',
                },
              },
            },
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Authorize Payment & Submit Request'}
      </button>
    </form>
  );
}

export default function ServiceIntakeModal({ open, onClose, defaultCity, defaultService }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: defaultService ? defaultService.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
    otherServiceType: '',
    description: '',
    address: '',
    city: defaultCity ? defaultCity.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
    state: 'NC',
    zip: '',
    urgency: 'Flexible',
    photos: [],
    name: '',
    email: '',
    phone: '',
    termsAccepted: false,
    smsConsent: false,
    stripeCustomerId: '',
    stripePaymentMethodId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 8;

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
      // Validate Charlotte, NC area
      if (formData.city && !formData.city.toLowerCase().includes('charlotte')) {
        newErrors.city = 'Service is only available in Charlotte, NC area';
      }
      if (formData.state && formData.state.toUpperCase() !== 'NC') {
        newErrors.state = 'Service is only available in North Carolina';
      }
    }

    if (step === 6) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the pricing terms';
      }
    }

    if (step === 7) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Valid email is required';
      }
      if (!formData.phone || !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Valid phone number is required';
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

  const handlePaymentSuccess = async (paymentData) => {
    setFormData(prev => ({ ...prev, ...paymentData }));
    
    // Submit the form
    await submitForm({ ...formData, ...paymentData });
  };

  const handlePaymentError = (error) => {
    setErrors({ payment: error });
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
      submitData.append('email', data.email);
      submitData.append('phone', data.phone);
      submitData.append('termsAccepted', data.termsAccepted);
      submitData.append('smsConsent', data.smsConsent || false);
      submitData.append('stripeCustomerId', data.stripeCustomerId);
      submitData.append('stripePaymentMethodId', data.stripePaymentMethodId);

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
            <h3 className="text-xl font-bold text-slate-900">Service address (Charlotte, NC area)</h3>
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
            <h3 className="text-xl font-bold text-slate-900">Service Pricing & Terms</h3>
            <div className="bg-slate-50 p-6 rounded-lg space-y-3 text-slate-800">
              <p className="font-semibold text-lg">Please review and accept:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>On-site estimate visit:</strong> $150</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>This $150 visit fee will be <strong>fully waived</strong> if you approve and move forward with the repair or project</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Approved work is billed at <strong>$150 per hour + materials</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>2-hour minimum</strong> labor charge applies</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Materials are billed separately and itemized on the invoice</span>
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
                I understand and agree to the pricing terms above
              </span>
            </label>
            {errors.termsAccepted && <p className="text-red-600 text-sm">{errors.termsAccepted}</p>}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Contact Information</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input w-full"
              required
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="input w-full"
              required
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input w-full"
              required
            />
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
          </div>
        );

      case 8:
        if (submitSuccess) {
          return (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Request Submitted Successfully!</h3>
              <p className="text-slate-600">
                Thank you for your service request. We'll contact you shortly to schedule your on-site estimate visit.
              </p>
              <p className="text-sm text-slate-500">
                You'll receive a confirmation email at {formData.email}
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
            <h3 className="text-xl font-bold text-slate-900">Payment Authorization</h3>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm text-slate-800">
              <p className="font-semibold">Important:</p>
              <ul className="space-y-1 ml-4">
                <li>• Your card will <strong>not be charged now</strong></li>
                <li>• The $150 visit fee is authorized only and will be <strong>waived if you approve the job</strong></li>
                <li>• Final charges are calculated after work is completed</li>
              </ul>
            </div>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                formData={formData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
            
            {errors.payment && <p className="text-red-600 text-sm">{errors.payment}</p>}
            {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
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
            <h2 className="text-2xl font-bold text-slate-900">Charlotte Home Service Request</h2>
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
                {currentStep === 7 ? 'Continue to Payment' : 'Next →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
