import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title = "Fixlo - Connect with Trusted Home Improvement Professionals",
  description = "Find verified professionals for plumbing, electrical, HVAC, landscaping, and more. Instant SMS notifications, AI assistant, and secure payments. Get your home projects done right.",
  keywords = "home improvement, professionals, plumbing, electrical, HVAC, landscaping, handyman, contractors, home repair, maintenance",
  image = "/cover.png",
  url = "https://www.fixloapp.com"
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Fixlo" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      
      {/* Business Info */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Fixlo",
          "description": description,
          "url": url,
          "logo": image,
          "serviceType": [
            "Home Improvement",
            "Plumbing",
            "Electrical",
            "HVAC",
            "Landscaping",
            "Cleaning",
            "Handyman Services"
          ],
          "areaServed": {
            "@type": "Country",
            "name": "United States"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "150"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;