import "server-only";

import type { PrecipitationType } from "@/lib/outfit";

export type KmaBaseTime = {
  baseDate: string;
  baseTime: string;
  label: string;
};

export type CurrentWeather = {
  observedAt: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationType: PrecipitationType;
  precipitationLabel: string;
};

export type HourlyWeather = {
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

export type DailyWeather = {
  forecastDate: string;
  displayDate: string;
  temperature: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationAmount: string | null;
  precipitationProbability: number | null;
  precipitationType: PrecipitationType;
  precipitationLabel: string;
  sky: string | null;
};

export type WeatherBundle = {
  baseTimes: {
    current: KmaBaseTime;
    ultraForecast: KmaBaseTime;
    villageForecast: KmaBaseTime;
  };
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
};

type FetchWeatherParams = {
  serviceKey: string;
  nx: number;
  ny: number;
  currentDateTime: string;
};

type KmaEndpoint = "getUltraSrtNcst" | "getUltraSrtFcst" | "getVilageFcst";

type KmaRequestLogContext = {
  endpoint: KmaEndpoint;
  params: Record<string, string>;
  url: string;
};

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
};

type KmaApiResponse = {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaItem[] | KmaItem;
      };
    };
  };
};

type KstParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type HourlyGroup = {
  forecastDate: string;
  forecastTime: string;
  values: Map<string, string>;
};

type DailyGroup = {
  forecastDate: string;
  temperatures: number[];
  minTemperature: number | null;
  maxTemperature: number | null;
  humidity: number[];
  windSpeed: number[];
  precipitationProbability: number[];
  precipitationType: PrecipitationType;
  precipitationAmount: string | null;
  sky: string | null;
};

export class KmaApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "KmaApiError";
    this.status = status;
  }
}

const KMA_BASE_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const VILLAGE_FORECAST_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];

export async function fetchWeatherBundle({
  serviceKey,
  nx,
  ny,
  currentDateTime,
}: FetchWeatherParams): Promise<WeatherBundle> {
  const currentBase = calculateHourlyBaseTime(currentDateTime, {
    baseMinute: 0,
    availabilityMinute: 40,
  });
  const ultraForecastBase = calculateHourlyBaseTime(currentDateTime, {
    baseMinute: 30,
    availabilityMinute: 45,
  });
  const villageForecastBase = calculateVillageForecastBaseTime(currentDateTime);

  const [currentItems, ultraForecastItems, villageForecastItems] =
    await Promise.all([
      requestKmaItems("getUltraSrtNcst", serviceKey, {
        base_date: currentBase.baseDate,
        base_time: currentBase.baseTime,
        nx: String(nx),
        ny: String(ny),
        numOfRows: "100",
      }),
      requestKmaItems("getUltraSrtFcst", serviceKey, {
        base_date: ultraForecastBase.baseDate,
        base_time: ultraForecastBase.baseTime,
        nx: String(nx),
        ny: String(ny),
        numOfRows: "1000",
      }),
      requestKmaItems("getVilageFcst", serviceKey, {
        base_date: villageForecastBase.baseDate,
        base_time: villageForecastBase.baseTime,
        nx: String(nx),
        ny: String(ny),
        numOfRows: "1000",
      }).catch(() => []),
    ]);

  const todayDate = formatKmaDate(new Date(currentDateTime));
  const popByTime = parsePrecipitationProbability(villageForecastItems);
  const allHourly = parseHourlyForecast(ultraForecastItems, todayDate, popByTime);
  const daily = parseDailyForecast(villageForecastItems);
  const todayHourly = allHourly.filter((item) => item.forecastDate === todayDate);

  return {
    baseTimes: {
      current: currentBase,
      ultraForecast: ultraForecastBase,
      villageForecast: villageForecastBase,
    },
    current: parseCurrentWeather(currentItems, currentBase),
    hourly: todayHourly.length > 0 ? todayHourly : allHourly.slice(0, 6),
    daily,
  };
}

function calculateHourlyBaseTime(
  currentDateTime: string,
  options: { baseMinute: number; availabilityMinute: number },
): KmaBaseTime {
  const current = parseDateTime(currentDateTime);
  const parts = getKstParts(current);
  let baseDate = createDateFromKstParts({
    ...parts,
    minute: options.baseMinute,
  });

  if (parts.minute < options.availabilityMinute) {
    baseDate = new Date(baseDate.getTime() - HOUR_MS);
  }

  return createBaseTime(baseDate);
}

function calculateVillageForecastBaseTime(currentDateTime: string): KmaBaseTime {
  const current = parseDateTime(currentDateTime);
  const parts = getKstParts(current);
  let baseHour: number | null = null;

  for (const hour of VILLAGE_FORECAST_BASE_HOURS) {
    if (parts.hour > hour || (parts.hour === hour && parts.minute >= 10)) {
      baseHour = hour;
    }
  }

  let baseDate: Date;

  if (baseHour === null) {
    baseDate = new Date(
      createDateFromKstParts({
        ...parts,
        hour: 23,
        minute: 0,
      }).getTime() -
        24 * HOUR_MS,
    );
  } else {
    baseDate = createDateFromKstParts({
      ...parts,
      hour: baseHour,
      minute: 0,
    });
  }

  return createBaseTime(baseDate);
}

function createBaseTime(date: Date): KmaBaseTime {
  const parts = getKstParts(date);
  const baseDate = formatDateParts(parts);
  const baseTime = `${pad(parts.hour)}${pad(parts.minute)}`;

  return {
    baseDate,
    baseTime,
    label: formatDisplayDateTime(baseDate, baseTime),
  };
}

async function requestKmaItems(
  endpoint: KmaEndpoint,
  serviceKey: string,
  params: Record<string, string>,
): Promise<KmaItem[]> {
  const url = new URL(`${KMA_BASE_URL}/${endpoint}`);
  url.searchParams.set("serviceKey", normalizeServiceKey(serviceKey));
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("dataType", "JSON");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const logContext: KmaRequestLogContext = {
    endpoint,
    params: {
      pageNo: "1",
      dataType: "JSON",
      ...params,
    },
    url: createRedactedUrl(url),
  };

  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    console.error("[weather-api] 기상청 fetch 실패", {
      ...logContext,
      error: formatErrorForLog(error),
    });
    throw error;
  }

  const data = await readKmaResponse(response, logContext);
  const header = data.response?.header;

  if (!response.ok) {
    console.error("[weather-api] 기상청 HTTP 오류", {
      ...logContext,
      status: response.status,
      statusText: response.statusText,
      resultCode: header?.resultCode,
      resultMsg: header?.resultMsg,
    });
    throw new KmaApiError(
      `기상청 API 호출에 실패했습니다. HTTP ${response.status}`,
      response.status,
    );
  }

  if (header?.resultCode !== "00") {
    console.error("[weather-api] 기상청 응답 오류", {
      ...logContext,
      status: response.status,
      statusText: response.statusText,
      resultCode: header?.resultCode,
      resultMsg: header?.resultMsg,
    });
    throw new KmaApiError(
      `기상청 API 응답 오류: ${header?.resultMsg ?? "알 수 없는 오류"}`,
      502,
    );
  }

  const item = data.response?.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

async function readKmaResponse(
  response: Response,
  context: KmaRequestLogContext,
): Promise<KmaApiResponse> {
  const text = await response.text();

  try {
    return JSON.parse(text) as KmaApiResponse;
  } catch {
    const bodyPreview = text.slice(0, 500);

    console.error("[weather-api] 기상청 응답 JSON 파싱 실패", {
      ...context,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      bodyPreview,
    });

    if (response.status === 403) {
      throw new KmaApiError(
        "기상청 API가 403 Forbidden을 반환했습니다. KMA_SERVICE_KEY가 기상청 단기예보 조회서비스(VilageFcstInfoService_2.0)에 승인된 키인지 확인해 주세요.",
        response.status,
      );
    }

    throw new KmaApiError(
      `기상청 응답을 JSON으로 해석하지 못했습니다. ${text.slice(0, 120)}`,
      response.ok ? 502 : response.status,
    );
  }
}

function createRedactedUrl(url: URL): string {
  const redactedUrl = new URL(url);
  redactedUrl.searchParams.set("serviceKey", "[redacted]");
  return redactedUrl.toString();
}

function formatErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: String(error) };
}

function parseCurrentWeather(
  items: KmaItem[],
  baseTime: KmaBaseTime,
): CurrentWeather {
  const values = toCategoryMap(items, "obsrValue");
  const precipitation = mapPrecipitationType(values.get("PTY"));

  return {
    observedAt: baseTime.label,
    temperature: parseNumber(values.get("T1H")),
    humidity: parseNumber(values.get("REH")),
    windSpeed: parseNumber(values.get("WSD")),
    precipitationAmount: normalizeAmount(values.get("RN1")),
    precipitationType: precipitation.type,
    precipitationLabel: precipitation.label,
  };
}

function parseHourlyForecast(
  items: KmaItem[],
  todayDate: string,
  popByTime: Map<string, number>,
): HourlyWeather[] {
  const groups = new Map<string, HourlyGroup>();

  for (const item of items) {
    if (!item.fcstDate || !item.fcstTime || !item.category) {
      continue;
    }

    const key = `${item.fcstDate}${item.fcstTime}`;
    const group =
      groups.get(key) ??
      ({
        forecastDate: item.fcstDate,
        forecastTime: item.fcstTime,
        values: new Map<string, string>(),
      } satisfies HourlyGroup);

    if (item.fcstValue !== undefined) {
      group.values.set(item.category, item.fcstValue);
    }

    groups.set(key, group);
  }

  return Array.from(groups.values())
    .sort((a, b) =>
      `${a.forecastDate}${a.forecastTime}`.localeCompare(
        `${b.forecastDate}${b.forecastTime}`,
      ),
    )
    .map((group) => {
      const precipitation = mapPrecipitationType(group.values.get("PTY"));
      const key = `${group.forecastDate}${group.forecastTime}`;

      return {
        forecastDate: group.forecastDate,
        forecastTime: group.forecastTime,
        displayTime:
          group.forecastDate === todayDate
            ? `${group.forecastTime.slice(0, 2)}:${group.forecastTime.slice(2)}`
            : formatDisplayDateTime(group.forecastDate, group.forecastTime),
        temperature: parseNumber(group.values.get("T1H")),
        humidity: parseNumber(group.values.get("REH")),
        windSpeed: parseNumber(group.values.get("WSD")),
        precipitationAmount: normalizeAmount(group.values.get("RN1")),
        precipitationProbability: popByTime.get(key) ?? null,
        precipitationType: precipitation.type,
        precipitationLabel: precipitation.label,
        sky: mapSky(group.values.get("SKY")),
      };
    });
}

function parsePrecipitationProbability(items: KmaItem[]): Map<string, number> {
  const popByTime = new Map<string, number>();

  for (const item of items) {
    if (
      item.category !== "POP" ||
      !item.fcstDate ||
      !item.fcstTime ||
      item.fcstValue === undefined
    ) {
      continue;
    }

    const value = parseNumber(item.fcstValue);

    if (value !== null) {
      popByTime.set(`${item.fcstDate}${item.fcstTime}`, value);
    }
  }

  return popByTime;
}

function parseDailyForecast(items: KmaItem[]): DailyWeather[] {
  const groups = new Map<string, DailyGroup>();

  for (const item of items) {
    if (!item.fcstDate || !item.category || item.fcstValue === undefined) {
      continue;
    }

    const group =
      groups.get(item.fcstDate) ??
      createDailyGroup(item.fcstDate);

    applyDailyItem(group, item);
    groups.set(item.fcstDate, group);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate))
    .map((group) => {
      const minTemperature = group.minTemperature;
      const maxTemperature = group.maxTemperature;
      const representativeTemperature =
        minTemperature !== null && maxTemperature !== null
          ? (minTemperature + maxTemperature) / 2
          : maxTemperature ?? minTemperature ?? null;

      return {
        forecastDate: group.forecastDate,
        displayDate: formatDailyDate(group.forecastDate),
        temperature: representativeTemperature,
        minTemperature,
        maxTemperature,
        humidity:
          group.humidity.length > 0
            ? Math.max(...group.humidity)
            : null,
        windSpeed:
          group.windSpeed.length > 0
            ? Math.max(...group.windSpeed)
            : null,
        precipitationAmount: group.precipitationAmount,
        precipitationProbability:
          group.precipitationProbability.length > 0
            ? Math.max(...group.precipitationProbability)
            : null,
        precipitationType: group.precipitationType,
        precipitationLabel: mapPrecipitationType(
          precipitationTypeToCode(group.precipitationType),
        ).label,
        sky: group.sky,
      };
    });
}

function createDailyGroup(forecastDate: string): DailyGroup {
  return {
    forecastDate,
    temperatures: [],
    minTemperature: null,
    maxTemperature: null,
    humidity: [],
    windSpeed: [],
    precipitationProbability: [],
    precipitationType: "none" as PrecipitationType,
    precipitationAmount: null as string | null,
    sky: null as string | null,
  };
}

function applyDailyItem(
  group: ReturnType<typeof createDailyGroup>,
  item: KmaItem,
): void {
  switch (item.category) {
    case "TMN": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.minTemperature = value;
      }
      break;
    }
    case "TMX": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.maxTemperature = value;
      }
      break;
    }
    case "T3H":
    case "T1H": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.temperatures.push(value);
      }
      break;
    }
    case "REH": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.humidity.push(value);
      }
      break;
    }
    case "WSD": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.windSpeed.push(value);
      }
      break;
    }
    case "POP": {
      const value = parseNumber(item.fcstValue);
      if (value !== null) {
        group.precipitationProbability.push(value);
      }
      break;
    }
    case "PTY": {
      group.precipitationType = mapPrecipitationType(item.fcstValue).type;
      break;
    }
    case "PCP": {
      if (item.fcstValue && item.fcstValue !== "강수없음" && item.fcstValue !== "0") {
        group.precipitationAmount = item.fcstValue;
      }
      break;
    }
    case "SKY": {
      group.sky = mapSky(item.fcstValue);
      break;
    }
  }
}

function precipitationTypeToCode(type: PrecipitationType): string | undefined {
  switch (type) {
    case "none":
      return "0";
    case "rain":
      return "1";
    case "rain_snow":
      return "2";
    case "snow":
      return "3";
    case "shower":
      return "4";
    case "drizzle":
      return "5";
    case "flurry":
      return "7";
    case "unknown":
    default:
      return undefined;
  }
}

function toCategoryMap(
  items: KmaItem[],
  valueKey: "obsrValue" | "fcstValue",
): Map<string, string> {
  const values = new Map<string, string>();

  for (const item of items) {
    const value = item[valueKey];

    if (item.category && value !== undefined) {
      values.set(item.category, value);
    }
  }

  return values;
}

function parseNumber(value?: string): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAmount(value?: string): string | null {
  if (!value || value === "강수없음" || value === "0") {
    return null;
  }

  return value;
}

function mapPrecipitationType(value?: string): {
  type: PrecipitationType;
  label: string;
} {
  switch (value) {
    case "0":
      return { type: "none", label: "강수 없음" };
    case "1":
      return { type: "rain", label: "비" };
    case "2":
      return { type: "rain_snow", label: "비 또는 눈" };
    case "3":
      return { type: "snow", label: "눈" };
    case "4":
      return { type: "shower", label: "소나기" };
    case "5":
      return { type: "drizzle", label: "빗방울" };
    case "6":
      return { type: "rain_snow", label: "빗방울 또는 눈날림" };
    case "7":
      return { type: "flurry", label: "눈날림" };
    default:
      return { type: "unknown", label: "확인 필요" };
  }
}

function mapSky(value?: string): string | null {
  switch (value) {
    case "1":
      return "맑음";
    case "3":
      return "구름 많음";
    case "4":
      return "흐림";
    default:
      return null;
  }
}

function formatDailyDate(date: string): string {
  return `${date.slice(4, 6)}.${date.slice(6, 8)}`;
}

function normalizeServiceKey(serviceKey: string): string {
  try {
    return decodeURIComponent(serviceKey);
  } catch {
    return serviceKey;
  }
}

function parseDateTime(currentDateTime: string): Date {
  const parsed = new Date(currentDateTime);

  if (Number.isNaN(parsed.getTime())) {
    throw new KmaApiError(
      "currentDateTime 값을 날짜로 해석하지 못했습니다. 예: 2026-06-08T15:30:00+09:00",
      400,
    );
  }

  return parsed;
}

function getKstParts(date: Date): KstParts {
  const kstDate = new Date(date.getTime() + KOREA_OFFSET_MS);

  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1,
    day: kstDate.getUTCDate(),
    hour: kstDate.getUTCHours(),
    minute: kstDate.getUTCMinutes(),
  };
}

function createDateFromKstParts(parts: KstParts): Date {
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) -
      KOREA_OFFSET_MS,
  );
}

function formatKmaDate(date: Date): string {
  return formatDateParts(getKstParts(date));
}

function formatDateParts(parts: KstParts): string {
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}`;
}

function formatDisplayDateTime(date: string, time: string): string {
  return `${Number(date.slice(4, 6))}월 ${Number(date.slice(6, 8))}일 ${time.slice(
    0,
    2,
  )}:${time.slice(2)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
