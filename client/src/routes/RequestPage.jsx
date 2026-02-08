import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceIntakeModal from '../components/ServiceIntakeModal';
import HelmetSEO from '../seo/HelmetSEO';

/**
 * RequestPage - Full-page service request form for ad campaigns
 * 
 * Supports query parameters:
 * - city: Pre-fills the city field (e.g., charlotte-nc)
 * - service: Pre-fills the service type (e.g., plumbing)
 * 
 * Examples:
 * - /request
 * - /request?city=charlotte-nc
 * - /request?city=charlotte-nc&service=plumbing
 */
export default function RequestPage() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [heading, setHeading] = useState('Home Service Request');

  useEffect(() => {
    // Extract and process query parameters
    const cityParam = searchParams.get('city');
    const serviceParam = searchParams.get('service');

    if (cityParam) {
      setCity(cityParam);
      
      // Generate dynamic heading based on city
      // Convert "charlotte-nc" to "Charlotte"
      const cityName = cityParam.split('-')[0];
      const formattedCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);
      setHeading(`${formattedCity} Home Service Request`);
    }

    if (serviceParam) {
      setService(serviceParam);
    }
  }, [searchParams]);

  // Page never closes the modal - it's the main content
  const handleClose = () => {
    // No-op: This is a dedicated page, not a modal overlay
  };

  return (
    <>
      <HelmetSEO 
        title={heading} 
        description={`Request ${service || 'home services'} in ${city || 'your area'}. Get matched with verified local professionals.`}
        canonicalPathname="/request"
      />
      
      {/* Full-page wrapper with custom heading */}
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container-xl">
          <ServiceIntakeModal
            open={true}
            onClose={handleClose}
            defaultCity={city}
            defaultService={service}
            customHeading={heading}
          />
        </div>
      </div>
    </>
  );
}
