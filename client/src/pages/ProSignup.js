import React from 'react';

export default function ProSignup() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Professional signup submitted (demo)');
  };

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Professional Signup</h1>
      <p className="text-gray-600 mb-6">Join our network of trusted home service professionals.</p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <input 
          type="text" 
          placeholder="Business Name" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input 
          type="text" 
          placeholder="Trade (e.g., plumbing, electrical)" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input 
          type="tel" 
          placeholder="Phone Number" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <button 
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Professional Account
        </button>
      </form>
    </div>
  );
}