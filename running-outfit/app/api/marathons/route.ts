import { NextResponse } from "next/server";

import {
  getMarathonSchedule,
  MarathonDataError,
  type MarathonEvent,
} from "@/lib/marathons";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schedule = await getMarathonSchedule();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const filteredEvents = schedule.events.filter((event) =>
      isOpenThisMonth(event, now, currentMonth),
    );

    return NextResponse.json({
      ...schedule,
      events: filteredEvents,
      totalEvents: schedule.events.length,
      filteredEvents: filteredEvents.length,
      currentMonth,
    });
  } catch (error) {
    console.error("[marathons-api] 마라톤 데이터 갱신 실패", formatErrorForLog(error));

    if (error instanceof MarathonDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "마라톤 대회 정보를 가져오는 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

function isOpenThisMonth(
  event: MarathonEvent,
  now: Date,
  currentMonth: number,
): boolean {
  if (event.month !== null && event.month !== currentMonth) {
    return false;
  }

  const end = parseDateLike(event.registrationEnd);
  if (!end) {
    return true;
  }

  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(23, 59, 59, 999);
  return normalizedEnd.getTime() >= now.getTime();
}

function parseDateLike(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\./g, "-").replace(/\//g, "-");
  const parts = normalized.match(/(\d{2,4})-(\d{1,2})-(\d{1,2})/);
  if (!parts) {
    return null;
  }

  const year = parts[1].length === 2 ? Number(`20${parts[1]}`) : Number(parts[1]);
  const month = Number(parts[2]) - 1;
  const day = Number(parts[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
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
