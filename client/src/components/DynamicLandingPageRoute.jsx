import React from 'react';
import { useParams } from 'react-router-dom';
import DynamicLandingPage from './DynamicLandingPage';

export default function DynamicLandingPageRoute() {
  const { service, city } = useParams();
  
  return <DynamicLandingPage service={service} city={city} />;
}