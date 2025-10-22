import React from 'react';
import { Helmet } from 'react-helmet';

const Privacy = () => {
  return (
    <div className="prose prose-invert">
      <Helmet>
        <title>Privacy Policy - Fixlo</title>
        <meta name="description" content="Privacy policy for Fixlo home services marketplace." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <h1>Privacy Policy</h1>
      <p>Last updated: October 22, 2025</p>

      <h2>Data Collection</h2>
      <p>We collect various types of information in connection with the services we provide, including:</p>
      <ul>
        <li>Personal Information: Name, email address, phone number, etc.</li>
        <li>Usage Data: Information about how our services are accessed and used.</li>
      </ul>

      <h2>Data Usage</h2>
      <p>Your information is used to:</p>
      <ul>
        <li>Provide and maintain our services.</li>
        <li>Notify you about changes to our services.</li>
        <li>Allow you to participate in interactive features of our services when you choose to do so.</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>We may share your information in the following situations:</p>
      <ul>
        <li>With service providers to monitor and analyze the use of our services.</li>
        <li>To comply with a legal obligation.</li>
      </ul>

      <h2>Data Retention</h2>
      <p>We will retain your personal information only for as long as is necessary for the purposes set out in this privacy policy.</p>

      <h2>User Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access, update, or delete the information we have on you.</li>
        <li>Request correction of inaccurate information.</li>
      </ul>

      <h2>Security Measures</h2>
      <p>We take the security of your personal information seriously. We implement various security measures to protect your information from unauthorized access.</p>
    </div>
  );
};

export default Privacy;