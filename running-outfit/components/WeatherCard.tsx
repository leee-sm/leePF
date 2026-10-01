type CurrentWeather = {
  observedAt: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationLabel: string;
};

type ConditionLevel = "good" | "moderate" | "bad";

type WeatherCardProps = {
  location: {
    addressName: string;
    latitude: number;
    longitude: number;
    nx: number;
    ny: number;
  };
  current: CurrentWeather;
};

export default function WeatherCard({ location, current }: WeatherCardProps) {
  const conditionStatuses = [
    {
      label: "온도",
      value: formatTemperature(current.temperature),
      level: getTemperatureLevel(current.temperature),
    },
    {
      label: "습도",
      value: formatPercent(current.humidity),
      level: getHumidityLevel(current.humidity),
    },
    {
      label: "강수량",
      value: current.precipitationAmount ?? "없음",
      level: getPrecipitationLevel(current.precipitationAmount),
    },
  ];

  return (
    <section className="rounded-lg border border-white/70 bg-white p-5 text-slate-950 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">현재 날씨</p>
          <h2 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
            {location.addressName}
          </h2>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-80">
          {conditionStatuses.map((status) => (
            <ConditionBadge
              key={status.label}
              label={status.label}
              value={status.value}
              level={status.level}
            />
          ))}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <WeatherMetric label="습도" value={formatPercent(current.humidity)} />
        <WeatherMetric label="풍속" value={formatWind(current.windSpeed)} />
        <WeatherMetric label="강수" value={current.precipitationLabel} />
        <WeatherMetric
          label="1시간 강수량"
          value={current.precipitationAmount ?? "없음"}
        />
      </dl>
    </section>
  );
}

function ConditionBadge({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level: ConditionLevel;
}) {
  const style = getConditionStyle(level);

  return (
    <div className={`min-w-0 rounded-lg border px-3 py-3 ${style.card}`}>
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <p className="mt-1 min-h-7 break-keep text-lg font-black tracking-normal text-slate-950">
        {value}
      </p>
      <p
        className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-black ${style.badge}`}
      >
        {getConditionLabel(level)}
      </p>
    </div>
  );
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 min-h-6 text-base font-bold text-slate-950">{value}</dd>
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

function getTemperatureLevel(value: number | null): ConditionLevel {
  if (value === null) {
    return "moderate";
  }

  if (value >= 5 && value <= 20) {
    return "good";
  }

  if ((value >= 0 && value < 5) || (value > 20 && value <= 26)) {
    return "moderate";
  }

  return "bad";
}

function getHumidityLevel(value: number | null): ConditionLevel {
  if (value === null) {
    return "moderate";
  }

  if (value < 60) {
    return "good";
  }

  if (value <= 75) {
    return "moderate";
  }

  return "bad";
}

function getPrecipitationLevel(value: string | null): ConditionLevel {
  const amount = parsePrecipitationAmount(value);

  if (amount === null) {
    return "good";
  }

  if (amount < 1) {
    return "moderate";
  }

  return "bad";
}

function parsePrecipitationAmount(value: string | null): number | null {
  if (!value || value.includes("없음")) {
    return null;
  }

  if (value.includes("미만")) {
    return 0.5;
  }

  const parsed = Number(value.match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) ? parsed : 0.5;
}

function getConditionLabel(level: ConditionLevel): string {
  switch (level) {
    case "good":
      return "좋음";
    case "moderate":
      return "중간";
    case "bad":
      return "나쁨";
  }
}

function getConditionStyle(level: ConditionLevel): {
  card: string;
  badge: string;
} {
  switch (level) {
    case "good":
      return {
        card: "border-emerald-200 bg-emerald-50",
        badge: "bg-emerald-600 text-white",
      };
    case "moderate":
      return {
        card: "border-yellow-200 bg-yellow-50",
        badge: "bg-yellow-400 text-slate-950",
      };
    case "bad":
      return {
        card: "border-red-200 bg-red-50",
        badge: "bg-red-600 text-white",
      };
  }
}
