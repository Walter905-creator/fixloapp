import React, { useState } from 'react';
import ServiceIntakeModal from './ServiceIntakeModal';

export default function ServiceIntakeButton({ city, service }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cityName = city ? city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Charlotte';
  const serviceName = service ? service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home Service';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
      >
        Request {serviceName} in {cityName}
      </button>
      
      <ServiceIntakeModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        defaultCity={city}
        defaultService={service}
      />
    </>
  );
}
