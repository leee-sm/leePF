import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { convertLatLonToGrid } from "@/lib/grid";
import { geocodeAddress, KakaoLocalApiError } from "@/lib/kakao";
import {
  fetchWeatherBundle,
  KmaApiError,
  type WeatherBundle,
} from "@/lib/weather";
import {
  getOutfitRecommendation,
  isPrecipitating,
  type PrecipitationType,
  type RunningWeatherInput,
} from "@/lib/outfit";

export const runtime = "nodejs";

type WeatherRequestBody = {
  address?: unknown;
  currentDateTime?: unknown;
};

type EnvKeys = {
  kmaServiceKey: string;
  kakaoRestApiKey: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WeatherRequestBody;
    const address = readRequiredString(body.address, "address");
    const currentDateTime = readRequiredString(
      body.currentDateTime,
      "currentDateTime",
    );
    const parsedDate = new Date(currentDateTime);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error:
            "currentDateTime은 ISO 날짜 문자열이어야 합니다. 예: 2026-06-08T15:30:00+09:00",
        },
        { status: 400 },
      );
    }

    const env = readEnvKeys();
    const geocoded = await geocodeAddress(address, env.kakaoRestApiKey);
    const grid = convertLatLonToGrid(geocoded.latitude, geocoded.longitude);
    const weather = await fetchWeatherBundle({
      serviceKey: env.kmaServiceKey,
      nx: grid.nx,
      ny: grid.ny,
      currentDateTime,
    });
    const outfit = getOutfitRecommendation(createRecommendationInput(weather));

    return NextResponse.json({
      location: {
        addressName: geocoded.addressName,
        roadAddressName: geocoded.roadAddressName,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        nx: grid.nx,
        ny: grid.ny,
      },
      baseTimes: weather.baseTimes,
      current: weather.current,
      hourly: weather.hourly,
      outfit,
    });
  } catch (error) {
    console.error("[weather-api] 요청 처리 실패", formatErrorForLog(error));
    return createErrorResponse(error);
  }
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RequestValidationError(`${fieldName} 값을 입력해 주세요.`);
  }

  return value.trim();
}

function readEnvKeys(): EnvKeys {
  const missing: string[] = [];
  const kmaServiceKey = readEnvValue(
    process.env.KMA_SERVICE_KEY,
    "KMA_SERVICE_KEY",
    missing,
  );
  const kakaoRestApiKey = readEnvValue(
    process.env.KAKAO_REST_API_KEY,
    "KAKAO_REST_API_KEY",
    missing,
  );

  if (missing.length > 0) {
    throw new RequestValidationError(
      `${missing.join(
        ", ",
      )}가 설정되어 있지 않습니다. 프로젝트 루트의 .env.local에 실제 API 키를 추가한 뒤 개발 서버를 다시 시작해 주세요.`,
      500,
    );
  }

  logKmaServiceKeyDiagnostics(kmaServiceKey);

  return {
    kmaServiceKey,
    kakaoRestApiKey,
  };
}

function readEnvValue(
  value: string | undefined,
  name: string,
  missing: string[],
): string {
  const trimmed = value?.trim() ?? "";

  if (!isUsableEnvValue(trimmed)) {
    missing.push(name);
  }

  return trimmed;
}

function isUsableEnvValue(value?: string): value is string {
  return Boolean(value && value.trim() && !value.startsWith("YOUR_"));
}

function createRecommendationInput(weather: WeatherBundle): RunningWeatherInput {
  const firstTemperature = weather.hourly.find(
    (item) => item.temperature !== null,
  )?.temperature;
  const temperature = weather.current.temperature ?? firstTemperature;

  if (temperature === null || temperature === undefined) {
    throw new KmaApiError(
      "기상청 응답에서 기온 값을 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  const forecastWindSpeeds = weather.hourly
    .map((item) => item.windSpeed)
    .filter((value): value is number => value !== null);
  const currentWindSpeed = weather.current.windSpeed;
  const maxWindSpeed =
    forecastWindSpeeds.length > 0
      ? Math.max(...forecastWindSpeeds, currentWindSpeed ?? 0)
      : currentWindSpeed;
  const precipitationType = selectPrecipitationType(weather);
  const precipitationProbabilities = weather.hourly
    .map((item) => item.precipitationProbability)
    .filter((value): value is number => value !== null);

  return {
    temperature,
    humidity:
      weather.current.humidity ??
      weather.hourly.find((item) => item.humidity !== null)?.humidity,
    windSpeed: maxWindSpeed,
    precipitationType,
    precipitationProbability:
      precipitationProbabilities.length > 0
        ? Math.max(...precipitationProbabilities)
        : null,
  };
}

function selectPrecipitationType(weather: WeatherBundle): PrecipitationType {
  if (isPrecipitating(weather.current.precipitationType)) {
    return weather.current.precipitationType;
  }

  return (
    weather.hourly.find((item) => isPrecipitating(item.precipitationType))
      ?.precipitationType ?? "none"
  );
}

function createErrorResponse(error: unknown) {
  if (error instanceof RequestValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof KakaoLocalApiError || error instanceof KmaApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { error: "날씨 정보를 가져오는 중 알 수 없는 오류가 발생했습니다." },
    { status: 500 },
  );
}

function logKmaServiceKeyDiagnostics(value: string): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const normalized = normalizeServiceKeyForDiagnostics(value);

  console.info("[weather-api] KMA_SERVICE_KEY 진단", {
    rawLength: value.length,
    rawHasPercent: value.includes("%"),
    normalizedLength: normalized.length,
    normalizedHasPlus: normalized.includes("+"),
    normalizedHasSlash: normalized.includes("/"),
    normalizedHasEquals: normalized.includes("="),
    fingerprint: createHash("sha256").update(normalized).digest("hex").slice(0, 12),
  });
}

function normalizeServiceKeyForDiagnostics(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: "status" in error ? error.status : undefined,
    };
  }

  return { value: String(error) };
}

class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}
