import React from 'react';
import Seo from '../components/Seo';

export default function NotFound(){
  return (
    <main style={{maxWidth:720,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        title="Page Not Found | Fixlo"
        description="The page you're looking for could not be found."
        noindex={true}
      />
      <h1>404 – Not Found</h1>
      <p>That page isn't available.</p>
    </main>
  );
}