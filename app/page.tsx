"use client";

import { useMemo, useState } from "react";

import OutfitExperience from "@/components/OutfitExperience";
import MarathonSearch from "@/components/MarathonSearch";

type ViewMode = "home" | "outfit" | "marathon";

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("home");
  const currentKoreaTime = useMemo(() => formatKoreaDateTime(new Date()), []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 py-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-300">
              Run Weather
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">
              오늘 달리기 복장
            </h1>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm font-semibold text-slate-300 sm:items-end">
            <p>한국 시간 {currentKoreaTime}</p>
            <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
              {mode === "home"
                ? "메인"
                : mode === "outfit"
                  ? "러닝 복장"
                  : "마라톤 대회"}
            </p>
          </div>
        </header>

        {mode === "home" && (
          <ModeChooser
            onOpenOutfit={() => setMode("outfit")}
            onOpenMarathon={() => setMode("marathon")}
          />
        )}

        {mode !== "home" && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode("home")}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              메인 화면
            </button>
            <div className="flex gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              <button
                type="button"
                onClick={() => setMode("outfit")}
                className={`rounded-full px-3 py-2 transition ${
                  mode === "outfit"
                    ? "bg-lime-300 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                러닝 복장
              </button>
              <button
                type="button"
                onClick={() => setMode("marathon")}
                className={`rounded-full px-3 py-2 transition ${
                  mode === "marathon"
                    ? "bg-sky-300 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                마라톤 대회
              </button>
            </div>
          </div>
        )}

        {mode === "outfit" && (
          <section className="space-y-5">
            <OutfitExperience />
          </section>
        )}

        {mode === "marathon" && (
          <section className="space-y-5">
            <MarathonSearch />
          </section>
        )}
      </div>
    </main>
  );
}

function formatKoreaDateTime(date: Date): string {
  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${koreaDate.toISOString().slice(0, 19)}+09:00`;
}

function ModeChooser({
  onOpenOutfit,
  onOpenMarathon,
}: {
  onOpenOutfit: () => void;
  onOpenMarathon: () => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <button
        type="button"
        onClick={onOpenOutfit}
        className="group flex min-h-64 flex-col justify-between rounded-lg border border-lime-200 bg-lime-100 p-6 text-left text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30"
      >
        <div>
          <p className="text-sm font-black text-lime-800">러닝 복장</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal">
            시간별 예보에 맞는 복장
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-700">
            주소를 넣고 예보 시간을 클릭하면 그 시간 기준으로 반팔, 반바지,
            방풍 레이어를 바로 추천합니다.
          </p>
        </div>
        <p className="text-sm font-bold text-lime-800 transition group-hover:translate-x-1">
          클릭해서 열기
        </p>
      </button>

      <button
        type="button"
        onClick={onOpenMarathon}
        className="group flex min-h-64 flex-col justify-between rounded-lg border border-sky-200 bg-sky-100 p-6 text-left text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30"
      >
        <div>
          <p className="text-sm font-black text-sky-800">마라톤 대회</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal">
            주간 갱신 대회 검색
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-700">
            공공데이터 CSV를 주 1회 갱신해서 대회명, 지역, 날짜, 종목으로
            검색할 수 있습니다.
          </p>
        </div>
        <p className="text-sm font-bold text-sky-800 transition group-hover:translate-x-1">
          클릭해서 열기
        </p>
      </button>
    </section>
  );
}
