import { useCallback, useEffect, useRef, useState } from "react";
import type { Config, Option, Filter, QueryMeta, QueryResult, ResultWidget, DashboardViewState } from "./types";
import { api, loadFilterOptions } from "./api";
import { readAppHistoryEntry } from "./history";
import { agingOptions, queryFilters, dateRangeError, rangeDefaults, restoreRangeFilters, tableCondition, tableStateFromResult } from "./dashboardState";
import { PageTitle, ErrorBanner, EmptyState, formatDate, formatTime, formatPercent, dimensionLabel } from "./ui";
import { WidgetGrid, BarChart } from "./Widgets";

export function DashboardList({ go }: { go: (to: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (term: string) => {
    setLoading(true); setError("");
    try { const data = await api<{ items: any[] }>(`/api/dashboards?q=${encodeURIComponent(term)}`); setItems(data.items); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(""); }, [load]);
  return <main className="content"><PageTitle eyebrow="WORKSPACE" title="대시보드" description="공개된 업무 현황을 확인하세요." />{error && <ErrorBanner message={error} />}<div className="toolbar"><label className="search"><span>⌕</span><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && void load(q)} placeholder="대시보드 검색" /></label><button className="button secondary" onClick={() => void load(q)}>검색</button></div>{loading ? <div className="loading-card">대시보드 목록을 불러오는 중…</div> : items.length ? <div className="dashboard-grid">{items.map(item => <button className="dashboard-card" key={item.id} onClick={() => go(`/dashboards/${item.id}`)}><span className="card-icon">▦</span><h2>{item.title}</h2><p>{item.description || "설명 없음"}</p><span className="card-foot">공개 {formatDate(item.published_at)} <b>열기 →</b></span></button>)}</div> : <EmptyState title="공개된 대시보드가 없습니다" text="관리자가 대시보드를 공개하면 이곳에서 확인할 수 있습니다." />}</main>;
}

export function DashboardDetail({ id, entryKey, go, saveView, pushView }: { id: string; entryKey: string; go: (to: string) => void; saveView: (entryKey: string, view: DashboardViewState) => void; pushView: (view: DashboardViewState) => void }) {
  const [savedView] = useState<DashboardViewState | null>(() => {
    const entry = readAppHistoryEntry();
    return entry && (entry.entryKey === entryKey || entry.parentEntryKey === entryKey) ? entry.view ?? null : null;
  });
  const [dashboard, setDashboard] = useState<{ config: Config; published_revision: number } | null>(null);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [selected, setSelected] = useState<Record<string, any>>(savedView?.selected ?? {});
  const [applied, setApplied] = useState<Record<string, any>>(savedView?.applied ?? {});
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateEditError, setDateEditError] = useState("");
  const [querying, setQuerying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [pendingWidgetIds, setPendingWidgetIds] = useState<string[]>([]);
  const activeQuery = useRef<AbortController | null>(null);
  const modelOptionsQuery = useRef<AbortController | null>(null);
  const dirty = JSON.stringify(selected) !== JSON.stringify(applied);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api<{ config: Config; published_revision: number }>(`/api/dashboards/${id}`);
        if (!active) return;
        setDashboard(data);
        const dateOptions = await loadFilterOptions(id, data.published_revision, "as_of_date");
        const availableDates = dateOptions.map(option => option.value);
        const defaults = rangeDefaults(data.config, availableDates);
        const selectedFilters = restoreRangeFilters(savedView?.selected, defaults, availableDates);
        const appliedFilters = restoreRangeFilters(savedView?.applied, defaults, availableDates);
        const manufacturers = Array.isArray(selectedFilters.manufacturer) ? selectedFilters.manufacturer : Array.isArray(defaults.manufacturer) ? defaults.manufacturer : [];
        setOptions({ as_of_date: dateOptions });
        setSelected({ ...selectedFilters }); setApplied(appliedFilters);
        const controller = new AbortController();
        activeQuery.current = controller;
        setQuerying(true);
        await Promise.all([
          Promise.all(data.config.filters.filter(filter => filter.id !== "as_of_date").map(async filter => [filter.id, await loadFilterOptions(id, data.published_revision, filter.id, filter.id === "model" ? manufacturers : [], controller.signal)] as const)).then(entries => {
            if (!active) return;
            const optionMap: Record<string, Option[]> = { ...Object.fromEntries(entries), as_of_date: dateOptions };
            setOptions(optionMap);
            if (!savedView && Array.isArray(selectedFilters.model)) {
              const validModels = new Set((optionMap.model ?? []).map(option => option.value));
              selectedFilters.model = selectedFilters.model.filter((value: string) => validModels.has(value));
            }
            setSelected(selectedFilters);
          }),
          api<QueryResult>(`/api/dashboards/${id}/query`, { method: "POST", body: JSON.stringify({ published_revision: data.published_revision, filters: queryFilters(appliedFilters), tables: tableCondition(data.config, 1, undefined, savedView?.tables) }), signal: controller.signal }).then(initialResult => { if (active) setResult(initialResult); }),
        ]);
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) { setLoading(false); setQuerying(false); } }
    })();
    return () => { active = false; activeQuery.current?.abort(); modelOptionsQuery.current?.abort(); };
  }, [id, savedView]);

  useEffect(() => {
    if (dashboard) saveView(entryKey, { selected, applied, tables: tableStateFromResult(result) });
  }, [entryKey, dashboard, selected, applied, result, saveView]);

  const refreshModelOptions = async (manufacturers: string[]) => {
    if (!dashboard?.config.filters.some(filter => filter.id === "model")) return;
    modelOptionsQuery.current?.abort();
    const controller = new AbortController();
    modelOptionsQuery.current = controller;
    setModelLoading(true);
    try {
      const models = await loadFilterOptions(id, dashboard.published_revision, "model", manufacturers, controller.signal);
      if (modelOptionsQuery.current !== controller) return;
      const valid = new Set(models.map(option => option.value));
      setOptions(current => ({ ...current, model: models }));
      setSelected(current => ({ ...current, model: (current.model ?? []).filter((value: string) => valid.has(value)) }));
    } catch (err) {
      if ((err as Error).name !== "AbortError" && modelOptionsQuery.current === controller) {
        setOptions(current => ({ ...current, model: [] }));
        setSelected(current => ({ ...current, model: [] }));
        setError((err as Error).message);
      }
    } finally {
      if (modelOptionsQuery.current === controller) setModelLoading(false);
    }
  };

  const changeFilter = (filterId: string, value: any) => {
    setError("");
    setSelected(current => ({ ...current, [filterId]: value }));
    if (filterId === "manufacturer") void refreshModelOptions(value);
  };

  const resetFilters = (resetDates: boolean) => {
    if (!dashboard) return;
    const all = resetDates ? rangeDefaults(dashboard.config, (options.as_of_date ?? []).map(option => option.value)) : { ...selected };
    for (const filter of dashboard.config.filters) {
      if (filter.id !== "as_of_date") all[filter.id] = [];
    }
    if (resetDates) setDateEditError("");
    setError("");
    setSelected(all);
    void refreshModelOptions([]);
    void run(all);
  };

  const changeDate = (filterId: "as_of_start_date" | "as_of_date", value: string) => {
    const availableDates = (options.as_of_date ?? []).map(option => option.value);
    if (value && !availableDates.includes(value)) {
      setDateEditError("현재 조회 가능한 스냅샷 날짜만 선택할 수 있습니다.");
      return;
    }
    setDateEditError("");
    setError("");
    setSelected(current => ({ ...current, [filterId]: value }));
  };

  const drillTo = (dimension: string, value: string, row?: Record<string, any>) => {
    if (!dashboard) return;
    const filters = { ...selected };
    if (row?.manufacturer && "manufacturer" in filters) filters.manufacturer = [row.manufacturer];
    if (row?.model && "model" in filters) filters.model = [row.model];
    if (dimension === "aging_bucket") filters.aging_bucket = value;
    else if (dimension in filters) filters[dimension] = [value];
    if (dimension === "manufacturer" && !row?.model && "model" in filters) filters.model = [];
    const invalidRange = dateRangeError(filters, (options.as_of_date ?? []).map(option => option.value));
    if (invalidRange) { setDateEditError(invalidRange); return; }
    saveView(entryKey, { selected, applied, tables: tableStateFromResult(result) });
    pushView({ selected: filters, applied: filters, tables: tableCondition(dashboard.config, 1) });
  };

  const run = async (filters = selected, table?: { id: string; page: number; sort: string }) => {
    if (!dashboard) return;
    const invalidRange = dateRangeError(filters, (options.as_of_date ?? []).map(option => option.value));
    if (invalidRange) {
      setDateEditError(invalidRange);
      return;
    }
    activeQuery.current?.abort();
    const controller = new AbortController();
    activeQuery.current = controller;
    const widgetIds = table ? [table.id] : dashboard.config.widgets.map(widget => widget.id);
    setPendingWidgetIds(widgetIds); setError(""); setQuerying(true);
    try {
      const tables = table ? { [table.id]: { page: table.page, page_size: dashboard.config.widgets.find(widget => widget.id === table.id)?.page_size, sort: table.sort } } : tableCondition(dashboard.config, 1);
      const data = await api<QueryResult>(`/api/dashboards/${id}/query`, { method: "POST", body: JSON.stringify({ published_revision: dashboard.published_revision, filters: queryFilters(filters), tables, ...(table ? { widget_ids: widgetIds } : {}) }), signal: controller.signal });
      if (activeQuery.current === controller) {
        if (table) setResult(current => current ? { ...current, widgets: current.widgets.map(widget => data.widgets.find(updated => updated.id === widget.id) ?? widget) } : data);
        else { setResult(data); setApplied(filters); }
      }
    } catch (err) { if ((err as Error).name !== "AbortError" && activeQuery.current === controller) setError((err as Error).message); }
    finally { if (activeQuery.current === controller) { setQuerying(false); setPendingWidgetIds([]); } }
  };

  const exportCsv = async () => {
    if (!dashboard || !result || querying || exporting) return;
    const filters = JSON.parse(JSON.stringify(applied)) as Record<string, any>;
    setExporting(true);
    setError("");
    try {
      const tableWidgets = result.widgets.filter(widget => widget.type === "table");
      const completeTables = await Promise.all(tableWidgets.map(async widget => {
        const pageSize = Number(widget.page_size ?? 20);
        const pageCount = Math.max(1, Math.ceil(Number(widget.total ?? 0) / pageSize));
        const rows: Array<Record<string, any>> = [];
        for (let firstPage = 1; firstPage <= pageCount; firstPage += 4) {
          const batch = Array.from({ length: Math.min(4, pageCount - firstPage + 1) }, (_, index) => firstPage + index);
          const responses = await Promise.all(batch.map(page => api<QueryResult>(`/api/dashboards/${id}/query`, {
            method: "POST",
            body: JSON.stringify({ published_revision: dashboard.published_revision, filters: queryFilters(filters), tables: { [widget.id]: { page, page_size: pageSize, sort: widget.sort ?? "value_desc" } }, widget_ids: [widget.id] }),
          })));
          for (const response of responses) {
            const table = response.widgets.find(item => item.id === widget.id);
            if (table?.type === "table") rows.push(...(table.rows ?? []));
          }
        }
        return [widget.id, { ...widget, page: 1, rows }] as const;
      }));
      const tablesById = new Map(completeTables);
      const exportResult = { ...result, widgets: result.widgets.map(widget => tablesById.get(widget.id) ?? widget) };
      downloadDashboardCsv(dashboard.config.title, exportResult, filters);
    } catch (err) {
      setError(`CSV 내보내기에 실패했습니다: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <main className="content"><div className="loading-card">대시보드를 불러오는 중…</div></main>;
  if (error && !dashboard) return <main className="content"><button className="text-button" onClick={() => go("/dashboards")}>← 대시보드 목록</button><ErrorBanner message={error} /><EmptyState title="대시보드를 열 수 없습니다" text="공개가 중지되었거나 삭제된 대시보드입니다." /></main>;
  if (!dashboard) return null;
  const availableDates = (options.as_of_date ?? []).map(option => option.value);
  const rangeError = dateEditError || dateRangeError(selected, availableDates);
  const feedback = rangeError || (error ? (result ? `조회 실패: ${error} 마지막 성공 결과를 유지하고 있습니다.` : `조회 실패: ${error}`) : querying ? "조건에 맞는 재고를 조회하고 있습니다…" : modelLoading ? "모델 선택지를 불러오고 있습니다…" : dirty ? "조건이 변경되었습니다. 조회를 눌러 적용하세요." : "\u00a0");
  const retryVisible = Boolean(error && !error.startsWith("CSV 내보내기에"));
  return <main className="content inventory-page"><button className="text-button back-link" onClick={() => go("/dashboards")}>← 대시보드 목록</button><PageTitle eyebrow="INVENTORY OVERVIEW" title={dashboard.config.title} description={dashboard.config.description} actions={<><button className="button secondary export-button" disabled={!result || querying || exporting} onClick={() => void exportCsv()}>{exporting ? "CSV 준비 중…" : "↓ CSV 내보내기"}</button><button className="button secondary" disabled={querying || exporting} onClick={() => void run(applied)}>↻ 새로고침</button></>} />
    <section className="filter-panel" aria-label="재고 조회 조건"><div className="filter-heading"><div><b>조회 조건</b><span>시작일·종료일과 분류를 선택한 뒤 조회를 눌러 적용하세요.</span></div><span className={`changed-tag${dirty ? "" : " is-invisible"}`} aria-hidden={!dirty}>조회 조건 변경됨</span></div><div className="filter-grid">{dashboard.config.filters.map(filter => filter.id === "as_of_date" ? <DateRangeControls key={filter.id} label={filter.label} id={id} feedbackId={`range-feedback-${id}`} dates={availableDates} startDate={selected.as_of_start_date ?? ""} endDate={selected.as_of_date ?? ""} invalid={Boolean(rangeError)} onChange={changeDate} /> : <FilterControl key={filter.id} filter={filter} value={selected[filter.id]} options={options[filter.id] ?? []} loading={filter.id === "model" && modelLoading} onChange={value => changeFilter(filter.id, value)} />)}</div><div id={`range-feedback-${id}`} className={`filter-feedback${rangeError || error ? " is-error" : querying || modelLoading ? " is-pending" : ""}`}><span role="status" aria-live="polite">{feedback}</span><button type="button" className="filter-retry" aria-hidden={!retryVisible} tabIndex={retryVisible ? 0 : -1} disabled={!retryVisible || querying || Boolean(rangeError)} onClick={() => void run(selected)}>다시 시도</button></div><div className="filter-actions"><label className="aging-filter"><span>재고 기간</span><select aria-label="재고 기간" value={selected.aging_bucket ?? ""} onChange={e => changeFilter("aging_bucket", e.target.value)}>{agingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="button text-button" onClick={() => resetFilters(true)}>기간·분류 초기화</button><button className="button primary" disabled={querying || modelLoading || Boolean(rangeError)} onClick={() => void run(selected)}>조회</button></div></section>
    {result && <><QueryMetaLine meta={result.meta} filters={applied} /><InventoryOverview meta={result.meta} filters={applied} totalWidget={result.widgets.find(widget => widget.type === "metric")} busy={pendingWidgetIds.includes(result.widgets.find(widget => widget.type === "metric")?.id ?? "")} onAgingSelect={bucket => drillTo("aging_bucket", bucket)} onManufacturerSelect={dashboard.config.filters.some(filter => filter.id === "manufacturer") ? label => drillTo("manufacturer", label) : undefined} /></>}
    {result ? <><div className="inventory-section-head"><div><p className="eyebrow">EXPLORE</p><h2>구성과 상세 내역</h2><p>분류 항목이나 표 행을 선택하면 바로 조회합니다. 뒤로가기로 이전 조회 화면으로 돌아갈 수 있습니다.</p></div><button className="button secondary small" disabled={querying || modelLoading || !dashboard.config.filters.some(filter => (filter.id === "manufacturer" || filter.id === "model") && selected[filter.id]?.length)} onClick={() => resetFilters(false)}>제조사·모델 해제</button></div><WidgetGrid widgets={result.widgets.filter(widget => widget.type !== "metric")} pendingWidgetIds={pendingWidgetIds} drillableFilters={dashboard.config.filters.map(filter => filter.id)} onBarSelect={(dimension, value) => drillTo(dimension, value)} onTableSelect={row => drillTo(row.manufacturer ? "manufacturer" : "model", row.manufacturer ?? row.model, row)} onTablePage={(id, page) => { const widget = result.widgets.find(item => item.id === id); void run(applied, { id, page, sort: widget?.sort ?? "value_desc" }); }} onTableSort={(id, sort) => void run(applied, { id, page: 1, sort })} /></> : !querying && !error ? <EmptyState title="재고 결과가 없습니다" text="조회 조건을 확인하고 다시 시도해 주세요." /> : null}
    </main>;
}

function DateRangeControls({ label, id, feedbackId, dates, startDate, endDate, invalid, onChange }: { label: string; id: string; feedbackId: string; dates: string[]; startDate: string; endDate: string; invalid: boolean; onChange: (filterId: "as_of_start_date" | "as_of_date", value: string) => void }) {
  const dateListId = `snapshot-dates-${id}`;
  const orderedDates = [...dates].sort();
  const firstDate = orderedDates[0] ?? "";
  const lastDate = orderedDates.at(-1) ?? "";
  return <div className="date-range-controls" role="group" aria-label={`${label} 기간`}>
    <datalist id={dateListId}>{orderedDates.map(date => <option key={date} value={date} />)}</datalist>
    <label className="field"><span>시작일</span><input type="date" min={firstDate || undefined} max={lastDate || undefined} list={dateListId} value={startDate} aria-invalid={invalid} aria-describedby={feedbackId} onChange={event => onChange("as_of_start_date", event.currentTarget.value)} /></label>
    <label className="field"><span>종료일</span><input type="date" min={firstDate || undefined} max={lastDate || undefined} list={dateListId} value={endDate} aria-invalid={invalid} aria-describedby={feedbackId} onChange={event => onChange("as_of_date", event.currentTarget.value)} /></label>
  </div>;
}

function FilterControl({ filter, value, options, loading = false, onChange }: { filter: Filter; value: any; options: Option[]; loading?: boolean; onChange: (value: any) => void }) {
  if (filter.id === "as_of_date") return <label className="field"><span>{filter.label}<em>필수</em></span><select value={value ?? options.at(-1)?.value ?? ""} onChange={e => onChange(e.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  const selected: string[] = Array.isArray(value) ? value : [];
  return <label className="field"><span>{filter.label}</span><select multiple disabled={loading} size={Math.min(Math.max(options.length + 1, 2), 4)} value={selected.length ? selected : [""]} onChange={e => {
    const chosen = Array.from(e.currentTarget.selectedOptions, option => option.value);
    onChange(chosen.includes("") ? selected.length === 0 && chosen.length > 1 ? chosen.filter(Boolean) : [] : chosen);
  }}><option value="">전체</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>{loading ? "해당 제조사의 모델을 불러오는 중…" : "전체를 선택하면 조건을 적용하지 않습니다. 여러 항목은 Ctrl 또는 Command를 누르고 선택하세요."}</small></label>;
}

export function QueryMetaLine({ meta, filters }: { meta: QueryMeta; filters: Record<string, any> }) {
  const message = meta.snapshot_row_count === 0
    ? "종료일은 정상적인 0건 스냅샷입니다."
    : meta.row_count === 0
      ? "종료일 스냅샷은 있지만 현재 필터 결과는 0건입니다."
      : "필터 적용 결과 " + meta.row_count.toLocaleString("ko-KR") + "건";
  const startDate = filters.as_of_start_date ?? meta.inventory_history?.[0]?.as_of_date ?? meta.as_of_date;
  return <><div className="result-meta"><span><b>조회 기간</b> {startDate} ~ {meta.as_of_date}</span><span><b>조회 시각</b> {formatTime(meta.fetched_at)}</span><span><b>원천 갱신</b> {meta.source_updated_at ? formatTime(meta.source_updated_at) : "확인 불가"}</span><span><b>종료일 전체</b> {meta.snapshot_row_count.toLocaleString("ko-KR")}건</span></div><div className={`query-status${meta.row_count === 0 ? " is-empty" : " is-invisible"}`} role={meta.row_count === 0 ? "status" : undefined} aria-hidden={meta.row_count > 0}>{meta.row_count === 0 ? message : "\u00a0"}</div></>;
}

export function InventoryOverview({ meta, filters, totalWidget, busy = false, onManufacturerSelect, onAgingSelect }: { meta: QueryMeta; filters: Record<string, any>; totalWidget?: ResultWidget; busy?: boolean; onManufacturerSelect?: (label: string) => void; onAgingSelect?: (bucket: string) => void }) {
  const count = (value: number) => value.toLocaleString("ko-KR");
  const scope = ["manufacturer", "model"].map(key => {
    const values = filters[key] as string[] | undefined;
    return `${key === "manufacturer" ? "제조사" : "모델"}: ${values?.length ? values.map(dimensionLabel).join(", ") : "전체"}`;
  });
  scope.push(`재고 기간: ${agingOptions.find(option => option.value === (filters.aging_bucket ?? ""))?.label ?? "전체"}`);
  const startDate = filters.as_of_start_date ?? (meta.inventory_history ?? [])[0]?.as_of_date ?? meta.as_of_date;
  const history = (meta.inventory_history ?? []).filter(point => point.as_of_date >= startDate && point.as_of_date <= meta.as_of_date);
  const startPoint = history.find(point => point.as_of_date === startDate);
  const delta = startDate !== meta.as_of_date && startPoint ? meta.row_count - startPoint.row_count : null;
  return <section className="inventory-overview" aria-label="재고 개요">
    <div className="overview-top"><div><p className="eyebrow">INVENTORY OVERVIEW</p><h2>{startDate} ~ {meta.as_of_date} 재고 현황</h2><p>재고 한 행을 1대로 집계합니다. 요약과 기존 차트·표는 종료일, 추이는 기간 안 실제 스냅샷 기준입니다.</p></div><span className="scope-pill">{scope.join(" · ")}</span></div>
    <div className="overview-grid widget-grid">
      {totalWidget ? <section className={`widget-card widget-metric overview-total${busy ? " is-querying" : ""}`} data-widget-id={totalWidget.id} aria-busy={busy}><span>{totalWidget.title || "조회 재고"}</span><strong className="metric-value">{Number(totalWidget.value).toLocaleString("ko-KR", { minimumFractionDigits: totalWidget.decimals ?? 0, maximumFractionDigits: totalWidget.decimals ?? 0 })}<small>{totalWidget.unit ?? "대"}</small></strong><p>종료일 전체 {count(meta.snapshot_row_count)}대</p>{busy && <span className="widget-busy">갱신 중…</span>}</section> : <div className="overview-total"><span>조회 재고</span><strong>{count(meta.row_count)}<small>대</small></strong><p>종료일 전체 {count(meta.snapshot_row_count)}대</p></div>}
      <div className="overview-fact"><span>시작일 대비 변화</span><strong className={delta == null || delta === 0 ? "" : delta < 0 ? "negative" : "positive"}>{delta == null ? "단일 스냅샷" : `${delta > 0 ? "+" : ""}${count(delta)}대`}</strong><p>{delta == null ? "시작일과 종료일이 같아 비교하지 않습니다." : `${startDate} 시작 ${count(startPoint!.row_count)}대 · ${meta.as_of_date} 종료 ${count(meta.row_count)}대`}</p></div>
      <div className="overview-fact"><span>제조사 구성</span><strong>{count(meta.manufacturer_count)}개</strong><p>{meta.top_manufacturer ? `최다 ${dimensionLabel(meta.top_manufacturer.label)} · ${count(meta.top_manufacturer.count)}대 (${formatPercent(meta.top_manufacturer.share)})` : "해당 재고 없음"}</p></div>
      <div className="overview-fact"><span>모델 구성</span><strong>{count(meta.model_count)}개</strong><p>{meta.top_model ? `최다 ${dimensionLabel(meta.top_model.label)} · ${count(meta.top_model.count)}대 (${formatPercent(meta.top_model.share)})` : "해당 재고 없음"}</p></div>
    </div>
    <div className="inventory-value-aging-grid">
      <InventoryAmount pricing={meta.pricing} />
      <InventoryAging aging={meta.aging} total={meta.row_count} selectedBucket={filters.aging_bucket ?? ""} onSelect={onAgingSelect} />
    </div>
    <InventoryHolders holders={meta.holders} total={meta.row_count} />
    <div className="inventory-insights-grid"><InventoryTrend history={history} selectedDate={meta.as_of_date} startDate={startDate} endDate={meta.as_of_date} /><div className="inventory-side-cards"><InventoryConcentration meta={meta} /><InventoryQuickActions meta={meta} onManufacturerSelect={onManufacturerSelect} /></div></div>
    <p className="missing-note">미등록 분류: 제조사 {count(meta.unclassified_count.manufacturer)}대 · 모델 {count(meta.unclassified_count.model)}대. 전체 재고에는 포함됩니다.</p>
  </section>;
}

function InventoryTrend({ history, selectedDate, startDate, endDate }: { history: Array<{ as_of_date: string; row_count: number }>; selectedDate: string; startDate: string; endDate: string }) {
  const width = 680; const height = 230; const left = 58; const right = 18; const top = 18; const bottom = 28;
  const largestValue = Math.max(...history.map(item => item.row_count), 0);
  const max = Math.max(largestValue, 1);
  const usableWidth = width - left - right; const usableHeight = height - top - bottom;
  const points = history.map((item, index) => ({ ...item, x: left + (history.length <= 1 ? usableWidth / 2 : usableWidth * index / (history.length - 1)), y: top + usableHeight * (1 - item.row_count / max) }));
  const path = points.map((point, index) => (index ? "L" : "M") + point.x + "," + point.y).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const textualSummary = history.map(point => `${point.as_of_date} ${point.row_count.toLocaleString("ko-KR")}대`).join(", ");
  return <section className="inventory-trend-card" aria-label="선택 기간 재고 추이">
    <div className="trend-card-head"><div><p className="eyebrow">SNAPSHOT TREND</p><h3>선택 기간 재고 추이</h3><p>기간에 실제 제공된 각 스냅샷에 같은 제조사·모델 조건을 적용합니다.</p></div><span className="trend-unit">대</span></div>
    {history.length ? <><div className="trend-chart-wrap"><svg className="trend-chart" viewBox={"0 0 " + width + " " + height} role="img" aria-label={`${startDate}부터 ${endDate}까지 재고 스냅샷 추이`}>
      <desc>{textualSummary}</desc>
      {ticks.map(tick => { const y = top + usableHeight * (1 - tick); return <g key={tick}><line className="trend-grid-line" x1={left} x2={width - right} y1={y} y2={y} /><text className="trend-axis-label" x={left - 10} y={y + 4} textAnchor="end">{(largestValue === 0 ? 0 : Math.round(max * tick)).toLocaleString("ko-KR")}</text></g>; })}
      <path className="trend-line" d={path} />
      {points.map(point => <circle key={point.as_of_date} className={"trend-point" + (point.as_of_date === selectedDate ? " selected" : "")} cx={point.x} cy={point.y} r={point.as_of_date === selectedDate ? 6 : 4.5}><title>{point.as_of_date + ": " + point.row_count.toLocaleString("ko-KR") + "대"}</title></circle>)}
    </svg></div><div className="trend-date-list" aria-label="날짜별 재고 수량">{points.map(point => <span key={point.as_of_date} className={point.as_of_date === selectedDate ? "selected" : ""}><span>{point.as_of_date}</span><b>{point.row_count.toLocaleString("ko-KR")}대</b></span>)}</div></> : <div className="trend-empty">선택한 기간에 표시할 실제 스냅샷이 없습니다.</div>}
  </section>;
}

function InventoryAmount({ pricing }: { pricing?: QueryMeta["pricing"] }) {
  if (!pricing) return null;
  return <section className="inventory-amount-card widget-card" aria-label="총 단말기 금액">
    <div><p className="eyebrow">INVENTORY VALUE</p><h2>총 단말기 금액</h2><p>종료일 · 현재 조회 조건 · 등록된 출고 단가 합계</p></div>
    <strong>{pricing.total_amount == null ? "금액 확인 불가" : `${pricing.total_amount.toLocaleString("ko-KR")}원`}</strong>
    <p>가격 등록 {pricing.priced_count.toLocaleString("ko-KR")}대 · 가격 미등록·판정 불가 {pricing.unpriced_count.toLocaleString("ko-KR")}대 (합계 제외)</p>
  </section>;
}

function InventoryHolders({ holders, total }: { holders?: QueryMeta["holders"]; total: number }) {
  if (!holders) return null;
  return <section className="inventory-holder-card widget-card" aria-label="보유처별 재고 보유 현황">
    <div className="widget-head"><div><p className="eyebrow">STOCK BY HOLDER</p><h2>보유처별 재고 보유 현황</h2><p className="aging-note">종료일 스냅샷 · 적용된 제조사·모델 조건 · 원본 거래처명 기준</p></div></div>
    <BarChart widget={{ id: "inventory_holders", type: "bar", title: "보유처별 재고", dimension_id: "holder", items: holders, category_count: holders.length, total_value: total, included_value: total, coverage: total > 0 ? 1 : null }} />
  </section>;
}

function InventoryAging({ aging, total, selectedBucket, onSelect }: { aging?: NonNullable<QueryMeta["aging"]>; total: number; selectedBucket: string; onSelect?: (bucket: string) => void }) {
  if (!aging) return null;
  const metrics = [
    { bucket: "0_to_29", label: "0~29일", value: aging.count_0_to_29, color: "#16816e" },
    { bucket: "30_to_59", label: "30~59일", value: aging.count_30_to_59, color: "#6598c5" },
    { bucket: "60_to_89", label: "60~89일", value: aging.count_60_to_89, color: "#d89a36" },
    { bucket: "90_plus", label: "90일 이상", value: aging.count_90_plus, color: "#c96862" },
  ];
  const max = Math.max(...metrics.map(metric => metric.value), 1);
  return <section className="inventory-aging-card" aria-label="재고 기간별 현황">
    <div className="aging-card-head"><div><p className="eyebrow">AGING STOCK</p><h3>재고 기간별 현황</h3><p>종료일 스냅샷 · 적용된 제조사·모델 조건</p></div><span className="aging-unit">대</span></div>
    <div className="aging-rows" role="list" aria-label="경과일 기준 재고 수량">
      {metrics.map(metric => {
        const share = total > 0 ? `${(metric.value / total * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%` : "—";
        const content = <>
          <span className="aging-label">{metric.label}</span>
          <span className="aging-track" role="img" aria-label={`${metric.label} ${metric.value.toLocaleString("ko-KR")}대`}><span style={{ width: `${Math.max(metric.value / max * 100, metric.value ? 1 : 0)}%`, backgroundColor: metric.color }} /></span>
          <span className="aging-count"><b>{metric.value.toLocaleString("ko-KR")}대</b><small>{share}</small></span>
        </>;
        return <div role="listitem" key={metric.bucket}>{onSelect ? <button type="button" className="aging-row aging-choice" aria-label={`${metric.label} 재고 조회`} aria-pressed={selectedBucket === metric.bucket} onClick={() => onSelect(metric.bucket)}>{content}</button> : <div className="aging-row">{content}</div>}</div>;
      })}
    </div>
    <p className="aging-note">원본 출고 경과일 후보 필드 기준 · 4구간은 중복되지 않으며 0일은 0~29일에 포함합니다. 0일 {aging.zero_count.toLocaleString("ko-KR")}대(업무 의미 미확정) · 판정 불가 {aging.unavailable_count.toLocaleString("ko-KR")}대</p>
  </section>;
}

function InventoryConcentration({ meta }: { meta: QueryMeta }) {
  const share = Math.max(0, Math.min(meta.top_manufacturer?.share ?? 0, 1));
  const top = meta.top_manufacturer;
  const ringStyle = { background: "conic-gradient(#2868e8 " + share * 100 + "%, #edf1f6 " + share * 100 + "% 100%)" };
  return <section className="inventory-insight-card"><div className="insight-card-head"><div><p className="eyebrow">DATA INSIGHT</p><h3>재고 집중도</h3></div><span className="insight-icon" aria-hidden="true">✦</span></div>
    <p className="insight-caption">전체 재고 중 가장 많은 제조사 비중</p>
    <div className="concentration-ring" style={ringStyle}><div><strong>{formatPercent(share)}</strong><span>{top ? dimensionLabel(top.label) : "재고 없음"}</span></div></div>
    <p className="insight-description">{top ? dimensionLabel(top.label) + " 재고 " + top.count.toLocaleString("ko-KR") + "대가 현재 조건에서 가장 큰 비중을 차지합니다." : "현재 선택 조건에 해당하는 재고가 없습니다."}</p>
  </section>;
}

function InventoryQuickActions({ meta, onManufacturerSelect }: { meta: QueryMeta; onManufacturerSelect?: (label: string) => void }) {
  const top = meta.top_manufacturer;
  const takeaway = meta.row_count === 0
    ? "현재 조건에 해당하는 재고가 없습니다. 다른 기간이나 분류를 선택해 보세요."
    : top
      ? dimensionLabel(top.label) + "가 가장 큰 비중을 차지합니다. 현재 조회는 " + meta.row_count.toLocaleString("ko-KR") + "대입니다."
      : "현재 조건의 재고는 " + meta.row_count.toLocaleString("ko-KR") + "대입니다.";
  return <section className="inventory-quick-actions-card">
    <div className="quick-actions-heading"><div><p className="eyebrow">QUICK FILTERS</p><h3>조건 빠른 설정</h3></div><span className="insight-icon" aria-hidden="true">↗</span></div>
    <p className="quick-actions-summary">{takeaway} 최다 제조사 조건을 선택하면 바로 조회합니다.</p>
    <div className="quick-actions-buttons"><button type="button" disabled={!top || !onManufacturerSelect} onClick={() => top && onManufacturerSelect?.(top.label)}>최다 제조사 조건 선택 <span aria-hidden="true">→</span></button></div>
  </section>;
}

function downloadDashboardCsv(title: string, result: QueryResult, filters: Record<string, any>) {
  const meta = result.meta;
  const filterLabel = (values: string[] | undefined) => values?.length ? values.map(dimensionLabel).join(" | ") : "전체";
  const history = (meta.inventory_history ?? []).filter(point => point.as_of_date >= (filters.as_of_start_date ?? (meta.inventory_history ?? [])[0]?.as_of_date ?? meta.as_of_date) && point.as_of_date <= meta.as_of_date);
  const startDate = filters.as_of_start_date ?? history[0]?.as_of_date ?? meta.as_of_date;
  const startPoint = history.find(point => point.as_of_date === startDate);
  const periodDelta = startPoint && startDate !== meta.as_of_date ? meta.row_count - startPoint.row_count : null;
  const rows: string[][] = [
    ["대시보드", title],
    ["기준일", meta.as_of_date],
    ["시작일", startDate],
    ["종료일", meta.as_of_date],
    ["제조사 필터", filterLabel(filters.manufacturer)],
    ["모델 필터", filterLabel(filters.model)],
    ["재고 기간 필터", agingOptions.find(option => option.value === (filters.aging_bucket ?? ""))?.label ?? "전체"],
    ["총 단말기 금액 (등록 가격 합계)", meta.pricing?.total_amount == null ? "금액 확인 불가" : String(meta.pricing.total_amount) + "원"],
    ["가격 등록 재고", String(meta.pricing?.priced_count ?? 0) + "대"],
    ["가격 미등록·판정 불가", String(meta.pricing?.unpriced_count ?? 0) + "대"],
    ["조회 재고", String(meta.row_count) + "대"],
    ["기준일 전체", String(meta.snapshot_row_count) + "대"],
    ["기간 시작일 재고", startPoint ? String(startPoint.row_count) + "대" : "—"],
    ["기간 변화", periodDelta == null ? "—" : String(periodDelta) + "대"],
    [],
    ["구분", "위젯 또는 기준일", "제조사", "모델", "재고 수량", "비중", "비고"],
  ];
  for (const point of history) {
    rows.push(["추이", point.as_of_date, "", "", String(point.row_count) + "대", "", "별도 스냅샷"]);
  }
  for (const widget of result.widgets) {
    if (widget.type === "metric") {
      rows.push(["지표", widget.title, "", "", String(widget.value) + (widget.unit ?? ""), "", "현재 필터 적용"]);
    } else if (widget.type === "bar") {
      for (const item of widget.items ?? []) {
        rows.push(["분류별 재고", widget.title, widget.dimension_id === "manufacturer" ? dimensionLabel(item.label) : "", widget.dimension_id === "model" ? dimensionLabel(item.label) : "", String(item.value) + "대", formatPercent(item.share), ""]);
      }
    } else if (widget.type === "table") {
      const pageCount = Math.max(1, Math.ceil(widget.total / widget.page_size));
      if (!widget.rows?.length) rows.push(["집계 표", widget.title, "", "", "", "", "표시할 행 없음"]);
      for (const row of widget.rows ?? []) {
        rows.push(["집계 표", widget.title, dimensionLabel(row.manufacturer ?? ""), dimensionLabel(row.model ?? ""), String(row.inventory_count ?? "") + (row.inventory_count == null ? "" : "대"), "", `전체 ${pageCount}페이지`]);
      }
    }
  }
  const csv = "\uFEFF" + rows.map(row => row.map(value => "\"" + String(value ?? "").replaceAll("\"", "\"\"") + "\"").join(",")).join("\r\n");
  const fileTitle = title.trim().replace(/[\\/:*?"<>|]/g, "_") || "dashboard";
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.href = url;
  link.download = fileTitle + "-" + meta.as_of_date + ".csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
