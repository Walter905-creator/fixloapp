import React, { useState } from 'react';
import ServiceRequestModal from './ServiceRequestModal';

const services = [
  { name: 'Plumbing', emoji: '🚰' },
  { name: 'Electrical', emoji: '💡' },
  { name: 'Carpentry', emoji: '🪚' },
  { name: 'Painting', emoji: '🎨' },
  { name: 'HVAC', emoji: '❄️' },
  { name: 'Roofing', emoji: '🏠' },
  { name: 'House Cleaning', emoji: '🧹' },
  { name: 'Junk Removal', emoji: '🗑️' },
  { name: 'Landscaping', emoji: '🌿' },
];

export default function ServiceSelector() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map(service => (
          <button
            key={service.name}
            onClick={() => setSelectedService(service)}
            className="border border-gray-300 p-4 rounded-lg text-center hover:bg-blue-100 transition"
          >
            <div className="text-3xl mb-2">{service.emoji}</div>
            <div className="font-medium">{service.name}</div>
          </button>
        ))}
      </div>

      {selectedService && (
        <ServiceRequestModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
