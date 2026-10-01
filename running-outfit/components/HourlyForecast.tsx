type HourlyForecastItem = {
  forecastDate: string;
  forecastTime: string;
  displayTime: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationProbability: number | null;
  precipitationLabel: string;
  sky: string | null;
};

type HourlyForecastProps = {
  items: HourlyForecastItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

export default function HourlyForecast({
  items,
  selectedKey,
  onSelect,
}: HourlyForecastProps) {
  return (
    <section className="rounded-lg border border-white/70 bg-white p-5 text-slate-950 shadow-xl shadow-black/20">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">오늘</p>
          <h2 className="mt-1 text-xl font-bold tracking-normal">
            시간별 예보
          </h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          {items.length}개 시간대
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          표시할 시간별 예보가 없습니다.
        </p>
      ) : (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <button
              key={`${item.forecastDate}-${item.forecastTime}`}
              type="button"
              onClick={() => onSelect(`${item.forecastDate}-${item.forecastTime}`)}
              aria-pressed={selectedKey === `${item.forecastDate}-${item.forecastTime}`}
              className={`min-w-[144px] rounded-lg border p-4 text-left transition ${
                selectedKey === `${item.forecastDate}-${item.forecastTime}`
                  ? "border-lime-500 bg-lime-50 shadow-md shadow-lime-200/60"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <p className="text-sm font-bold text-slate-950">
                {item.displayTime}
              </p>
              <p className="mt-2 text-3xl font-black tracking-normal text-slate-950">
                {formatTemperature(item.temperature)}
              </p>
              <p className="mt-1 min-h-5 text-sm font-medium text-slate-500">
                {item.sky ?? item.precipitationLabel}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <ForecastRow label="습도" value={formatPercent(item.humidity)} />
                <ForecastRow label="풍속" value={formatWind(item.windSpeed)} />
                <ForecastRow
                  label="강수확률"
                  value={formatPercent(item.precipitationProbability)}
                />
                <ForecastRow
                  label="강수량"
                  value={item.precipitationAmount ?? "없음"}
                />
              </dl>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ForecastRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatTemperature(value: number | null): string {
  return value === null ? "--" : `${Math.round(value)}°`;
}

function formatPercent(value: number | null): string {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function formatWind(value: number | null): string {
  return value === null ? "--" : `${value.toFixed(1)}m/s`;
}
