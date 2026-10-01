"use client";

import { useMemo, useState, type FormEvent } from "react";

import HourlyForecast from "@/components/HourlyForecast";
import OutfitRecommendation from "@/components/OutfitRecommendation";
import WeatherCard from "@/components/WeatherCard";
import {
  getOutfitRecommendation,
  type OutfitRecommendation as OutfitRecommendationType,
  type PrecipitationType,
  type RunningWeatherInput,
} from "@/lib/outfit";

type CurrentWeather = {
  observedAt: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationType: string;
  precipitationLabel: string;
};

type HourlyWeather = {
  forecastDate: string;
  forecastTime: string;
  displayTime: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationProbability: number | null;
  precipitationType: PrecipitationType;
  precipitationLabel: string;
  sky: string | null;
};

type WeatherApiResponse = {
  location: {
    addressName: string;
    roadAddressName: string | null;
    latitude: number;
    longitude: number;
    nx: number;
    ny: number;
  };
  current: CurrentWeather;
  hourly: HourlyWeather[];
  outfit: OutfitRecommendationType;
};

type ErrorResponse = {
  error?: string;
};

export default function OutfitExperience() {
  const [address, setAddress] = useState("서울특별시 강남구 테헤란로");
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHourlyKey, setSelectedHourlyKey] = useState<string | null>(null);
  const currentKoreaTime = useMemo(() => formatKoreaDateTime(new Date()), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      setError("주소를 입력해 주세요.");
      setWeather(null);
      setSelectedHourlyKey(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: trimmedAddress,
          currentDateTime: formatKoreaDateTime(new Date()),
        }),
      });
      const data = (await response.json()) as WeatherApiResponse | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "날씨 정보를 가져오지 못했습니다.",
        );
      }

      const weatherData = data as WeatherApiResponse;
      setWeather(weatherData);
      setSelectedHourlyKey(
        weatherData.hourly.length > 0 ? getHourlyKey(weatherData.hourly[0]) : null,
      );
    } catch (caughtError) {
      setWeather(null);
      setSelectedHourlyKey(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "날씨 정보를 가져오는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedHourly =
    weather?.hourly.find((item) => getHourlyKey(item) === selectedHourlyKey) ??
    weather?.hourly[0] ??
    null;

  const selectedRecommendation = selectedHourly
    ? getOutfitRecommendation(
        createRecommendationInput(selectedHourly, weather?.current.temperature),
      )
    : weather?.outfit ?? null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/70 bg-white p-4 text-slate-950 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">러닝 복장</p>
            <h2 className="mt-1 text-xl font-black tracking-normal">
              주소를 넣고 시간별 예보를 클릭하세요
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            한국 시간 {currentKoreaTime}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="address" className="text-sm font-bold text-slate-700">
            주소
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-lime-500 focus:ring-4 focus:ring-lime-200"
              placeholder="서울특별시 강남구 테헤란로"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:min-w-28"
            >
              {isLoading ? "검색 중" : "검색"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-950 shadow-lg"
        >
          {error}
        </div>
      )}

      {isLoading && <LoadingState />}

      {weather && !isLoading && (
        <div className="space-y-5">
          <WeatherCard location={weather.location} current={weather.current} />
          <HourlyForecast
            items={weather.hourly}
            selectedKey={selectedHourlyKey}
            onSelect={setSelectedHourlyKey}
          />
          {selectedHourly && selectedRecommendation && (
            <OutfitRecommendation
              recommendation={selectedRecommendation}
              contextLabel={`선택한 시간 ${selectedHourly.displayTime}`}
            />
          )}
        </div>
      )}

      {!weather && !isLoading && !error && (
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5 text-slate-200">
          <p className="text-base font-semibold">
            주소를 검색하면 현재 날씨와 시간별 예보에 맞춘 복장을 보여줍니다.
          </p>
        </section>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-64 animate-pulse rounded-lg bg-white/20" />
      <div className="h-72 animate-pulse rounded-lg bg-white/20" />
      <div className="h-80 animate-pulse rounded-lg bg-lime-200/30" />
    </div>
  );
}

function formatKoreaDateTime(date: Date): string {
  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${koreaDate.toISOString().slice(0, 19)}+09:00`;
}

function createRecommendationInput(
  item: HourlyWeather,
  fallbackTemperature?: number | null,
): RunningWeatherInput {
  return {
    temperature: item.temperature ?? fallbackTemperature ?? 0,
    humidity: item.humidity,
    windSpeed: item.windSpeed,
    precipitationProbability: item.precipitationProbability,
    precipitationType: item.precipitationType,
  };
}

function getHourlyKey(item: HourlyWeather): string {
  return `${item.forecastDate}-${item.forecastTime}`;
}
