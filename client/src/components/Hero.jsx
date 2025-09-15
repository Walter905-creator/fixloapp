import React from 'react';

export default function Hero() {
  return (
    <section
      className="w-full min-h-[420px] md:min-h-[60vh] lg:min-h-[720px] bg-center bg-cover bg-no-repeat"
      style={{
        backgroundImage: 'url(/hero-banner.png)'
      }}
      aria-label="Join the Fixlo Pro Team"
    >
      {/* Keep empty (image already has text rendered).
          If you want overlay content later, add here. */}
    </section>
  );
}