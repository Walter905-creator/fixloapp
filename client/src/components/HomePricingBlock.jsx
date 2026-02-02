// HomePricingBlock.jsx
import useSWR from 'swr';
import { API_BASE } from '../utils/config';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function HomePricingBlock() {
  const { data, error } = useSWR(`${API_BASE}/api/pricing-status`, fetcher);

  if (!data || !data.success) return null;

  const { earlyAccessAvailable, currentPrice, earlyAccessSpotsRemaining } = data.data;

  return (
    <section className="bg-white py-12 px-6 rounded-md shadow-md text-center">
      {earlyAccessAvailable ? (
        <>
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            🚀 Early Access – Just ${currentPrice}!
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            Get unlimited job leads with no per-lead charges.  
            Only {earlyAccessSpotsRemaining} spots left before price increases to $179.99.
          </p>
          <ul className="text-left max-w-md mx-auto mb-6 text-gray-600">
            <li>✅ Unlimited leads</li>
            <li>✅ No per-lead charges</li>
            <li>✅ Local matching (30-mile radius)</li>
            <li>✅ No bidding wars</li>
            <li>✅ Direct connections to homeowners</li>
          </ul>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-semibold">
            Join Fixlo Pro for ${currentPrice}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Join Fixlo Pro – ${currentPrice}
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            Get unlimited job leads with no per-lead charges. Join our network of verified professionals today.
          </p>
          <ul className="text-left max-w-md mx-auto mb-6 text-gray-600">
            <li>✅ Unlimited leads</li>
            <li>✅ No per-lead charges</li>
            <li>✅ Local matching</li>
            <li>✅ No bidding wars</li>
            <li>✅ Direct connections</li>
          </ul>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-semibold">
            Join Fixlo Pro
          </button>
        </>
      )}
    </section>
  );
}
