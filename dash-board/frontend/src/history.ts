import { useCallback, useEffect, useState } from "react";
import type { AppHistoryEntry, AppLocation, DashboardViewState } from "./types";

const historyKey = "__axDistribution" as const;

function appPath(path: string) {
  const normalized = path.replace(/\/$/, "") || "/";
  return normalized === "/" ? "/dashboards" : normalized;
}

export function readAppHistoryEntry(value: unknown = window.history.state): AppHistoryEntry | null {
  if (!value || typeof value !== "object" || (value as Record<string, unknown>)[historyKey] !== true) return null;
  const entry = value as AppHistoryEntry;
  return entry.kind === "route" || entry.kind === "overlay" ? entry : null;
}

function locationFromEntry(entry: AppHistoryEntry): AppLocation {
  return { path: entry.path, entryKey: entry.kind === "overlay" ? entry.parentEntryKey ?? entry.entryKey : entry.entryKey, overlay: entry.kind === "overlay" ? entry.overlay ?? null : null };
}

function initializeAppHistory(): AppHistoryEntry {
  const currentPath = appPath(window.location.pathname);
  const current = readAppHistoryEntry();
  if (current && current.path === currentPath) return current;

  const root: AppHistoryEntry = { __axDistribution: true, kind: "route", entryKey: crypto.randomUUID(), path: currentPath, fallbackOnBack: currentPath !== "/dashboards", scrollY: 0 };
  window.history.replaceState(root, "", currentPath);
  if (!root.fallbackOnBack) return root;

  // A duplicate entry lets the first Back from a directly opened detail route
  // fall back inside the app. The root is then replaced, so subsequent Back
  // presses can leave the app instead of being intercepted forever.
  const guard: AppHistoryEntry = { ...root, entryKey: crypto.randomUUID(), fallbackOnBack: false };
  window.history.pushState(guard, "", currentPath);
  return guard;
}

function restoreScrollPosition(scrollY: number) {
  let attempts = 0;
  const restore = () => {
    window.scrollTo(0, scrollY);
    if (window.scrollY >= scrollY || attempts >= 30) return;
    attempts += 1;
    window.setTimeout(restore, 50);
  };
  window.requestAnimationFrame(restore);
}

export function usePath() {
  const [location, setLocation] = useState<AppLocation>(() => locationFromEntry(initializeAppHistory()));

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onPop = (event: PopStateEvent) => {
      const entry = readAppHistoryEntry(event.state);
      if (!entry) {
        const safe: AppHistoryEntry = { __axDistribution: true, kind: "route", entryKey: crypto.randomUUID(), path: "/dashboards", fallbackOnBack: false, scrollY: 0 };
        window.history.replaceState(safe, "", "/dashboards");
        setLocation(locationFromEntry(safe));
        window.scrollTo(0, 0);
        return;
      }
      if (entry.kind === "route" && entry.fallbackOnBack) {
        const safe: AppHistoryEntry = { ...entry, path: "/dashboards", fallbackOnBack: false, scrollY: 0, view: undefined };
        window.history.replaceState(safe, "", "/dashboards");
        setLocation(locationFromEntry(safe));
        window.scrollTo(0, 0);
        return;
      }
      setLocation(locationFromEntry(entry));
      restoreScrollPosition(entry.scrollY ?? 0);
    };
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const entry = readAppHistoryEntry();
        if (entry?.kind === "route") window.history.replaceState({ ...entry, scrollY: window.scrollY }, "", window.location.href);
      });
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  const go = useCallback((to: string) => {
    const current = readAppHistoryEntry();
    if (current?.kind === "overlay") return;
    const nextPath = appPath(new URL(to, window.location.origin).pathname);
    if (current?.kind === "route") window.history.replaceState({ ...current, scrollY: window.scrollY }, "", window.location.href);
    const next: AppHistoryEntry = { __axDistribution: true, kind: "route", entryKey: crypto.randomUUID(), path: nextPath, scrollY: 0 };
    window.history.pushState(next, "", nextPath);
    setLocation(locationFromEntry(next));
    window.scrollTo(0, 0);
  }, []);

  const openOverlay = useCallback((overlay: string) => {
    const current = readAppHistoryEntry();
    if (!current || current.kind !== "route" || location.overlay) return;
    const next: AppHistoryEntry = { ...current, kind: "overlay", entryKey: crypto.randomUUID(), parentEntryKey: current.entryKey, overlay, scrollY: window.scrollY };
    window.history.pushState(next, "", window.location.href);
    setLocation(locationFromEntry(next));
  }, [location.overlay]);

  const closeOverlay = useCallback(() => {
    const current = readAppHistoryEntry();
    if (current?.kind === "overlay") window.history.back();
  }, []);

  const saveView = useCallback((entryKey: string, view: DashboardViewState) => {
    const current = readAppHistoryEntry();
    if (!current || (current.entryKey !== entryKey && current.parentEntryKey !== entryKey)) return;
    window.history.replaceState({ ...current, view }, "", window.location.href);
  }, []);

  const pushView = useCallback((view: DashboardViewState) => {
    const current = readAppHistoryEntry();
    if (!current || current.kind !== "route") return;
    const scrollY = window.scrollY;
    window.history.replaceState({ ...current, scrollY }, "", window.location.href);
    const next: AppHistoryEntry = { __axDistribution: true, kind: "route", entryKey: crypto.randomUUID(), path: current.path, scrollY, view };
    window.history.pushState(next, "", window.location.href);
    setLocation(locationFromEntry(next));
    restoreScrollPosition(scrollY);
  }, []);

  return { ...location, go, openOverlay, closeOverlay, saveView, pushView };
}
