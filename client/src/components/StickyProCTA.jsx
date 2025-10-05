import { useNavigate } from "react-router-dom";

export default function StickyProCTA() {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block md:hidden">
      <div className="mx-auto max-w-6xl px-4 pb-3">
        <button
          onClick={() => navigate("/join")}
          className="w-full rounded-2xl bg-emerald-600 text-white font-semibold py-3 shadow"
        >
          Get Unlimited Leads – $59/mo
        </button>
      </div>
    </div>
  );
}