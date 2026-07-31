import { useNavigate } from 'react-router-dom';

export default function StickyProCTA() {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block md:hidden">
      <div className="mx-auto max-w-6xl px-4 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => navigate('/join')}
          className="w-full rounded-2xl border border-amber-300 bg-amber-400 py-4 font-black text-black shadow-[0_14px_35px_rgba(0,0,0,.28)] transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-300/40"
        >
          Get Jobs Near Me
        </button>
      </div>
    </div>
  );
}
