import type { OutfitRecommendation as Recommendation } from "@/lib/outfit";

type OutfitRecommendationProps = {
  recommendation: Recommendation;
  contextLabel?: string;
};

export default function OutfitRecommendation({
  recommendation,
  contextLabel,
}: OutfitRecommendationProps) {
  return (
    <section className="rounded-lg border border-lime-200 bg-lime-100 p-5 text-slate-950 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-lime-800">
            {recommendation.temperatureBand}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-normal">
            {recommendation.title}
          </h2>
          {contextLabel && (
            <p className="mt-1 text-sm font-semibold text-lime-800">
              {contextLabel}
            </p>
          )}
        </div>
        <p className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">
          러닝 복장
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">
        {recommendation.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {recommendation.items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-lime-300 bg-white px-3 py-2 text-sm font-bold text-slate-950"
          >
            {item}
          </span>
        ))}
      </div>

      {recommendation.alerts.length > 0 && (
        <ul className="mt-5 space-y-2">
          {recommendation.alerts.map((alert) => (
            <li
              key={alert}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950"
            >
              {alert}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
