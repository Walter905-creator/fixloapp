import React from "react";
import { useParams } from "react-router-dom";
import Seo from "../components/Seo";

export default function ServiceCityPage() {
  const { service, city } = useParams();

  const prettyService = (service || "").replace(/-/g, " ");
  const prettyCity = (city || "").replace(/-/g, " ");

  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <Seo
        path={`/services/${service}/${city}`}
        title={`${prettyService} in ${prettyCity} | Fixlo`}
        description={`Book trusted ${prettyService} pros in ${prettyCity}. Fixlo connects homeowners with vetted local professionals.`}
      />
      <h1>{prettyService} in {prettyCity}</h1>
      <p>Find trusted {prettyService.toLowerCase()} professionals in {prettyCity}.</p>
      
      <div style={{marginTop: 32}}>
        <h2>Local {prettyService} Services</h2>
        <p>Connect with verified {prettyService.toLowerCase()} professionals in {prettyCity} for:</p>
        <ul>
          <li>Fast and reliable service</li>
          <li>Licensed and insured professionals</li>
          <li>Transparent pricing</li>
          <li>Customer satisfaction guarantee</li>
        </ul>
        
        <button 
          style={{
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            marginTop: '16px',
            cursor: 'pointer'
          }}
        >
          Request {prettyService} Service in {prettyCity}
        </button>
      </div>
    </main>
  );
}