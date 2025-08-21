import React from 'react';

export default function ProGallery() {
  const sampleProjects = [
    {
      id: 1,
      title: "Kitchen Renovation",
      description: "Complete kitchen remodel with new cabinets and countertops",
      image: "🏠",
      trade: "General Contractor"
    },
    {
      id: 2,
      title: "Bathroom Plumbing",
      description: "Fixed leaky pipes and installed new fixtures",
      image: "🔧",
      trade: "Plumbing"
    },
    {
      id: 3,
      title: "Electrical Wiring",
      description: "Updated electrical panel and installed new outlets",
      image: "⚡",
      trade: "Electrical"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Professional Gallery</h1>
      <p className="text-gray-600 mb-8">Showcase of recent work by our professional network.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleProjects.map((project) => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4 text-center">
              {project.image}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {project.title}
            </h3>
            <p className="text-gray-600 mb-3">
              {project.description}
            </p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {project.trade}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}