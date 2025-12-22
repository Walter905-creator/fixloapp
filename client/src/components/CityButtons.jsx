import React from 'react';
import { Link } from 'react-router-dom';
import { getActiveCities } from '../config/cities';

export default function CityButtons({ service }) {
  const cities = getActiveCities();
  
  if (!service) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">
        Select Your City
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cities.map(city => (
          <Link
            key={city.id}
            to={`/services/${service}/${city.slug}`}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-center hover:border-blue-600 hover:bg-blue-50 transition-all font-medium text-slate-900"
          >
            {city.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
