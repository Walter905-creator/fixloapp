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
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
      <h3 className="font-semibold mb-2 text-gray-700">💼 Recent Activity</h3>
      <p className="text-sm text-gray-600 mb-2">Example of the types of services requested on our platform:</p>
      <ul className="text-sm text-gray-600">
        {feed.slice(0, 3).map((job, idx) => (
          <li key={idx} className="opacity-75">• {job.replace(/– \d+ min ago|– just now/, '– Example')}</li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-2 italic">* Sample data for demonstration purposes</p>
    </div>
  );
}