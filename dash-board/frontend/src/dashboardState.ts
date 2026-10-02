import type { Config, Option, QueryResult, DashboardViewState } from "./types";

export function queryFilters(filters: Record<string, any>) {
  const apiFilters = { ...filters };
  delete apiFilters.as_of_start_date;
  return apiFilters;
}

export function dateRangeError(filters: Record<string, any>, availableDates: string[]) {
  const startDate = filters.as_of_start_date;
  const endDate = filters.as_of_date;
  if (!startDate || !endDate) return "시작일과 종료일을 선택해 주세요.";
  if (!availableDates.includes(startDate) || !availableDates.includes(endDate)) return "현재 조회 가능한 스냅샷 날짜만 선택할 수 있습니다.";
  if (startDate > endDate) return "시작일은 종료일보다 늦을 수 없습니다. 날짜 범위를 확인해 주세요.";
  return "";
}

export function rangeDefaults(config: Config, dates: string[]): Record<string, any> {
  const orderedDates = [...dates].sort();
  const defaults = defaultsFromConfig(config, orderedDates.map(value => ({ value, label: value })));
  return { ...defaults, aging_bucket: "", as_of_start_date: orderedDates[0] ?? "", as_of_date: orderedDates.at(-1) ?? "" };
}

export function restoreRangeFilters(filters: Record<string, any> | undefined, defaults: Record<string, any>, dates: string[]): Record<string, any> {
  const restored = { ...defaults, ...(filters ?? {}) };
  // Older in-browser view state stored only a single as_of_date. Upgrade it to
  // the new full-range default while keeping its manufacturer/model choices.
  if (!filters?.as_of_start_date || !dates.includes(filters.as_of_start_date)) {
    restored.as_of_start_date = defaults.as_of_start_date;
    restored.as_of_date = defaults.as_of_date;
  }
  if (!dates.includes(restored.as_of_date)) restored.as_of_date = defaults.as_of_date;
  return restored;
}

export function defaultsFromConfig(config: Config, dates: Option[] = []): Record<string, any> {
  return Object.fromEntries(config.filters.map(filter => [filter.id, filter.id === "as_of_date" ? (filter.default as any)?.mode === "date" ? (filter.default as any).value : dates.at(-1)?.value ?? "" : Array.isArray(filter.default) ? filter.default : []]));
}

export function tableCondition(config: Config, page: number, sort?: string, saved?: DashboardViewState["tables"]) {
  return Object.fromEntries(config.widgets.filter(widget => widget.type === "table").map(widget => {
    const preference = saved?.[widget.id];
    return [widget.id, { page: preference?.page ?? page, page_size: preference?.page_size ?? widget.page_size, sort: preference?.sort ?? sort ?? widget.sort }];
  }));
}

export function tableStateFromResult(result: QueryResult | null): DashboardViewState["tables"] {
  return Object.fromEntries((result?.widgets ?? []).filter(widget => widget.type === "table").map(widget => [widget.id, { page: Number(widget.page ?? 1), page_size: Number(widget.page_size ?? 20), sort: String(widget.sort ?? "value_desc") }]));
}

export const agingOptions = [{ value: "", label: "전체" }, { value: "0_to_29", label: "0~29일" }, { value: "30_to_59", label: "30~59일" }, { value: "60_to_89", label: "60~89일" }, { value: "90_plus", label: "90일 이상" }];
