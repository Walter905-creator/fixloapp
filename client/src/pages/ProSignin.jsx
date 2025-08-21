import React, { useEffect } from "react";

export default function ProSignin() {
  useEffect(() => {
    // Redirect to new pro login route
    window.location.href = '/pro/login';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirecting to sign in...</p>
      </div>
    </div>
  );
}