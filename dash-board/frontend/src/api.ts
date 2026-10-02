import type { Option } from "./types";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");
  }
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? body?.message ?? body?.detail ?? `요청을 처리하지 못했습니다. (${response.status})`;
    const error = new Error(message) as Error & { status: number; code?: string };
    error.status = response.status;
    error.code = body?.error?.code ?? body?.code;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function loadFilterOptions(id: string, revision: number, filterId: string, manufacturers: string[] = [], signal?: AbortSignal): Promise<Option[]> {
  const all: Option[] = [];
  let cursor = "";
  do {
    const params = new URLSearchParams({ revision: String(revision), filter_id: filterId, cursor });
    if (filterId === "model") manufacturers.forEach(value => params.append("manufacturer", value));
    const page = await api<{ options: Option[]; next_cursor: string | null }>(`/api/dashboards/${id}/filter-options?${params}`, { signal });
    all.push(...page.options);
    cursor = page.next_cursor ?? "";
  } while (cursor);
  return all;
}
