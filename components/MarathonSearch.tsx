"use client";

import { useEffect, useMemo, useState } from "react";

type MarathonEvent = {
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

type MarathonSchedule = {
  events: MarathonEvent[];
  sourceUrl: string;
  fetchedAt: string;
  nextRefreshAt: string;
  totalEvents?: number;
  filteredEvents?: number;
  currentMonth?: number;
};

type MarathonErrorResponse = {
  error?: string;
};

export default function MarathonSearch() {
  const [schedule, setSchedule] = useState<MarathonSchedule | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/marathons", { cache: "no-store" });
        const data = (await response.json()) as MarathonSchedule | MarathonErrorResponse;

        if (!response.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "마라톤 대회 정보를 가져오지 못했습니다.",
          );
        }

        if (!cancelled) {
          setSchedule(data as MarathonSchedule);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSchedule(null);
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "마라톤 대회 정보를 가져오는 중 오류가 발생했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!schedule) {
      return [];
    }

    if (!normalizedQuery) {
      return schedule.events;
    }

    return schedule.events.filter((event) => {
      const haystack = [
        event.name,
        event.date,
        event.location,
        event.categories,
        event.organizer,
        event.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, schedule]);

  return (
    <section className="space-y-4 rounded-lg border border-white/70 bg-white p-5 text-slate-950 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">마라톤 대회</p>
          <h2 className="mt-1 text-xl font-bold tracking-normal">
            이번 달 접수 가능 대회
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            매주 월요일 오전 9시 기준으로 갱신되는 오픈API를 조회합니다.
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          {schedule ? (
            <>
              <p>
                대회 {schedule.filteredEvents ?? schedule.events.length}건
                {schedule.totalEvents ? ` / 전체 ${schedule.totalEvents}건` : ""}
              </p>
              <p>다음 갱신 {formatDateTime(schedule.nextRefreshAt)}</p>
            </>
          ) : (
            <p>대회 목록을 불러오는 중</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="대회명, 지역, 접수일자, 종목으로 검색"
          className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-lime-500 focus:ring-4 focus:ring-lime-200"
        />
        {schedule && (
          <a
            href={schedule.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            원본 보기
          </a>
        )}
      </div>

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          대회 데이터를 불러오는 중입니다.
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950">
          {error}
        </div>
      )}

      {!isLoading && !error && filteredEvents.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          검색 결과가 없습니다.
        </div>
      )}

      {!isLoading && !error && filteredEvents.length > 0 && (
        <div className="grid gap-3">
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    {formatRegion(event.location)} {event.name || "대회명 없음"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    접수일자 {formatRegistrationRange(event.registrationStart, event.registrationEnd)}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {event.date || "대회일 정보 없음"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {renderTag(event.categories || "종목 정보 없음")}
                {renderTag(event.organizer || "주최 정보 없음")}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function renderTag(label: string) {
  return (
    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700">
      {label}
    </span>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRegion(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const firstToken = trimmed.split(/\s+/)[0] ?? "";
  return firstToken ? `(${firstToken})` : "";
}

function formatRegistrationRange(start: string, end: string): string {
  const normalizedStart = formatShortDate(start);
  const normalizedEnd = formatShortDate(end);

  if (!normalizedStart && !normalizedEnd) {
    return "정보 없음";
  }

  if (normalizedStart && normalizedEnd) {
    return `${normalizedStart}~${normalizedEnd}`;
  }

  return normalizedStart || normalizedEnd;
}

function formatShortDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.replace(/\./g, ".").replace(/\//g, ".");
  const match = normalized.match(/(\d{2,4})[.\-](\d{1,2})[.\-](\d{1,2})/);
  if (!match) {
    return trimmed;
  }

  const year = match[1].length === 2 ? match[1] : match[1].slice(-2);
  const month = match[2].padStart(2, "0");
  const day = match[3].padStart(2, "0");
  return `${year}.${month}.${day}`;
}
