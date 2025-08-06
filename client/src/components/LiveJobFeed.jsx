import { useEffect, useState } from 'react';

const sampleJobs = [
  '🛠️ Plumbing Request in Miami – 2 min ago',
  '🏡 Roofing Job in Atlanta – just now',
  '🔧 HVAC Lead in Denver – 5 min ago',
  '🪚 Carpentry Request in Dallas – 3 min ago',
  '🎨 Painting Job in Phoenix – 1 min ago',
  '🔌 Electrical Work in Seattle – 4 min ago',
  '🚿 Bathroom Repair in Boston – just now',
  '🪟 Window Installation in Chicago – 6 min ago'
];

export default function LiveJobFeed() {
  // Initialize with first job to avoid loading state
  const [feed, setFeed] = useState([sampleJobs[0]]);

  useEffect(() => {
    let i = 1; // Start from second job since first is already shown
    const interval = setInterval(() => {
      setFeed(prev => [sampleJobs[i % sampleJobs.length], ...prev.slice(0, 4)]);
      i++;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
      <h3 className="font-bold mb-2">🔴 Live Job Feed</h3>
      <ul className="text-sm text-gray-700">
        {feed.map((job, idx) => (
          <li key={idx} className="animate-pulse">• {job}</li>
        ))}
      </ul>
      {feed.length === 0 && (
        <p className="text-sm text-gray-500">Loading recent job requests...</p>
      )}
    </div>
  );
}