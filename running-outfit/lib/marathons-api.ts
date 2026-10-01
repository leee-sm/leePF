import "server-only";

import { buildDataPortalUrl } from "@/lib/data-portal";

export type MarathonEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  categories: string;
  organizer: string;
  keywords: string;
  registrationStart: string;
  registrationEnd: string;
  month: number | null;
};

export type MarathonSchedule = {
  events: MarathonEvent[];
  sourceUrl: string;
  fetchedAt: string;
  nextRefreshAt: string;
  totalEvents?: number;
  filteredEvents?: number;
  currentMonth?: number;
};

type MarathonCache = {
  schedule: MarathonSchedule;
  refreshAfter: number;
};

type OpenApiResponse = {
  page?: number;
  perPage?: number;
  totalCount?: number;
  currentCount?: number;
  matchCount?: number;
  data?: Array<Record<string, unknown>>;
};

const DATA_PAGE_URL =
  "https://www.data.go.kr/data/15138980/fileData.do#tab-layer-openapi";
const OPENAPI_PATH = "15138980/v1/uddi:eedc77c5-a56b-4e77-9c1d-9396fa9cc1d3";
const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONDAY = 1;
const REFRESH_HOUR = 9;

let cache: MarathonCache | null = null;

export class MarathonDataError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "MarathonDataError";
    this.status = status;
  }
}

export async function getMarathonSchedule(
  now = new Date(),
): Promise<MarathonSchedule> {
  const nowTime = now.getTime();

  if (cache && nowTime < cache.refreshAfter) {
    return cache.schedule;
  }

  const response = await fetchMarathonOpenApi();
  const events = parseMarathonOpenApiResponse(response);
  const nextRefresh = getNextMondayNineKst(now);
  const schedule: MarathonSchedule = {
    events,
    sourceUrl: DATA_PAGE_URL,
    fetchedAt: now.toISOString(),
    nextRefreshAt: nextRefresh.toISOString(),
  };

  cache = {
    schedule,
    refreshAfter: nextRefresh.getTime(),
  };

  return schedule;
}

async function fetchMarathonOpenApi(): Promise<OpenApiResponse> {
  const url = buildDataPortalUrl(OPENAPI_PATH, {
    page: 1,
    perPage: 1000,
    returnType: "JSON",
  });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json,*/*",
      "User-Agent": "running-outfit/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MarathonDataError(
      `마라톤 오픈API 호출에 실패했습니다. HTTP ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as OpenApiResponse;
}

function parseMarathonOpenApiResponse(response: OpenApiResponse): MarathonEvent[] {
  const rows = Array.isArray(response.data) ? response.data : [];

  return rows.map((row, index) => {
    const name = pickValue(row, ["대회명", "대회명칭", "행사명"]);
    const dateText = pickValue(row, ["대회일시", "대회일", "일자", "날짜", "개최일"]);
    const location = pickValue(row, ["대회장소", "장소", "지역", "개최지", "시도"]);
    const categories = pickValue(row, ["종목", "거리", "코스", "구분"]);
    const organizer = pickValue(row, ["주최", "주관", "주최/주관", "주최기관"]);
    const registrationRange = extractRegistrationRange(
      pickValue(row, ["접수기간", "접수일자", "접수기간/일자", "접수"]),
    );

    return {
      id: `${index}-${name || dateText || location || JSON.stringify(row).slice(0, 48)}`,
      name,
      date: dateText,
      location,
      categories,
      organizer,
      keywords: Object.values(row)
        .map((value) => formatCell(value))
        .filter(Boolean)
        .join(" "),
      registrationStart: registrationRange.start,
      registrationEnd: registrationRange.end,
      month: extractMonth(dateText),
    };
  });
}

function pickValue(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = formatCell(row[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "";
}

function extractRegistrationRange(value: string): { start: string; end: string } {
  const cleaned = value.trim();

  if (!cleaned) {
    return { start: "", end: "" };
  }

  const separators = ["~", "-", "∼", "〜", "–", "—"];
  for (const separator of separators) {
    if (cleaned.includes(separator)) {
      const [start = "", end = ""] = cleaned.split(separator);
      return { start: start.trim(), end: end.trim() };
    }
  }

  return { start: cleaned, end: cleaned };
}

function extractMonth(value: string): number | null {
  const match = value.match(/(?:^|[^0-9])(1[0-2]|0?[1-9])(?:[^0-9]|$)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNextMondayNineKst(now: Date): Date {
  const kstNow = new Date(now.getTime() + KOREA_OFFSET_MS);
  const day = kstNow.getUTCDay();
  const hour = kstNow.getUTCHours();
  let daysUntilMonday = (MONDAY - day + 7) % 7;

  if (daysUntilMonday === 0 && hour >= REFRESH_HOUR) {
    daysUntilMonday = 7;
  }

  const kstRefresh = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
    REFRESH_HOUR,
    0,
    0,
    0,
  ) + daysUntilMonday * DAY_MS;

  return new Date(kstRefresh - KOREA_OFFSET_MS);
}
