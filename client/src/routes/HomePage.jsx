import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import Schema from '../seo/Schema';
import HeroSection from '../components/HeroSection';
import HomeownerExperienceSections from '../components/HomeownerExperienceSections';
import { IS_HOLIDAY_SEASON } from '../utils/config';

const pageTitle = IS_HOLIDAY_SEASON
  ? 'Fixlo – Book Holiday Home Services Near You'
  : 'Fixlo – Book Trusted Home Services Near You';

export default function HomePage() {
  return (
    <>
      <HelmetSEO title={pageTitle} canonicalPathname="/" />
      <Schema />
      <HeroSection />
      <HomeownerExperienceSections />
    </>
  );
}
