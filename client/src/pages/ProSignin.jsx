import React from 'react';
import ProSignin from '../components/ProSignin';
import Seo from '../components/Seo';

export default function ProSigninPage() {
  return (
    <>
      <Seo 
        path="/pro/signin"
        title="Professional Sign In | Fixlo"
        description="Sign in to your Fixlo professional account to manage your business, view leads, and connect with customers."
      />
      <ProSignin />
    </>
  );
}