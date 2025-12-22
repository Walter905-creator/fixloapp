import React, { useState } from 'react';
import ServiceIntakeModal from './ServiceIntakeModal';

export default function ServiceIntakeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
      >
        Charlotte Home Service Request
      </button>
      
      <ServiceIntakeModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
