import { useEffect, useState } from 'react';

export default function GeoHeader() {
  const [city, setCity] = useState(null);

  useEffect(() => {
    fetch('/api/ipinfo')
      .then(res => res.json())
      .then(data => setCity(data.city))
      .catch(() => setCity('Your Area')); // Fallback if geolocation fails
  }, []);

  return (
    <h1 className="text-3xl font-bold">
      {city ? `Homeowners in ${city} need your help` : 'Find Jobs Near You'}
    </h1>
  );
}
