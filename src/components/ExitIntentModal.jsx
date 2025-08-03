// src/components/ExitIntentModal.jsx
import React, { useEffect, useState } from 'react';

export default function ExitIntentModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY < 50) {
        setShow(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">⚠️ Leaving already?</h2>
        <p className="mb-4">
          Homeowners are waiting. Sign up now and start earning with Fixlo.
        </p>
        <a
          href="/signup"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🚀 Sign Up & Start Earning
        </a>
        <button
          onClick={() => setShow(false)}
          className="mt-4 text-sm text-gray-500"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}