import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Config, Option, Filter, Widget, QueryResult, DashboardRow } from "./types";
import { api } from "./api";
import { defaultsFromConfig, tableCondition } from "./dashboardState";
import { PageTitle, ErrorBanner, EmptyState, formatDate } from "./ui";
import { QueryMetaLine, InventoryOverview } from "./Dashboard";
import { WidgetGrid } from "./Widgets";

const uuid = () => crypto.randomUUID().replaceAll("-", "").slice(0, 16);

export default function AdminScreens({ path, entryKey, go, widgetPickerOpen, openOverlay, closeOverlay }: { path: string; entryKey: string; go: (to: string) => void; widgetPickerOpen: boolean; openOverlay: (overlay: string) => void; closeOverlay: () => void }) {
  if (path === "/admin/dashboards/new") return <CreateScreen go={go} />;
  if (path.endsWith("/edit")) return <Editor key={entryKey} id={path.split("/")[3]} go={go} widgetPickerOpen={widgetPickerOpen} openOverlay={openOverlay} closeOverlay={closeOverlay} />;
  return <AdminList go={go} />;
}

function AdminList({ go }: { go: (to: string) => void }) {
  const [items, setItems] = useState<DashboardRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => { try { const params = new URLSearchParams(); if (q) params.set("q", q); if (status) params.set("status", status); setItems((await api<{ items: DashboardRow[] }>(`/api/admin/dashboards?${params.toString()}`)).items); setError(""); } catch (err) { setError((err as Error).message); } }, [q, status]);
  useEffect(() => { void load(); }, []);
  const unpublish = async (row: DashboardRow) => {
    if (!window.confirm(`“${row.draft_config.title}” 공개를 중지하면 이용자 접근이 즉시 차단됩니다. 계속할까요?`)) return;
    setBusy(row.id); try { await api(`/api/admin/dashboards/${row.id}/unpublish`, { method: "POST", body: JSON.stringify({ expected_published_revision: row.published_revision }) }); await load(); } catch (err) { setError((err as Error).message); } finally { setBusy(""); }
  };
  const remove = async (row: DashboardRow) => {
    if (!window.confirm(`“${row.draft_config.title}”을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    setBusy(row.id); try { await api(`/api/admin/dashboards/${row.id}?expected_edit_version=${row.edit_version}&expected_published_revision=${row.published_revision}`, { method: "DELETE", body: JSON.stringify({}) }); await load(); } catch (err) { setError((err as Error).message); } finally { setBusy(""); }
  };
  return <main className="content"><PageTitle eyebrow="ADMINISTRATION" title="대시보드 관리" description="초안을 편집하고 공개 상태를 관리합니다." actions={<button className="button primary" onClick={() => go("/admin/dashboards/new")}>＋ 새 대시보드</button>} />{error && <ErrorBanner message={error} />}<div className="toolbar"><label className="search"><span>⌕</span><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && void load()} placeholder="이름 검색" /></label><select className="compact-select" value={status} onChange={e => setStatus(e.target.value)}><option value="">모든 상태</option><option value="draft">초안</option><option value="published">공개</option><option value="unpublished">공개 중지</option></select><button className="button secondary" onClick={() => void load()}>검색</button></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>대시보드</th><th>데이터 소스</th><th>상태</th><th>수정</th><th>동작</th></tr></thead><tbody>{items.map(row => <tr key={row.id}><td><b>{row.draft_config.title}</b><small className="block muted">{row.draft_config.description || "설명 없음"}</small></td><td>재고 샘플</td><td><StatusBadge row={row} /></td><td>{formatDate(row.updated_at)}</td><td className="actions-cell"><button className="text-button" onClick={() => go(`/admin/dashboards/${row.id}/edit`)}>편집</button>{row.visibility === "published" && <button className="text-button danger-text" disabled={busy === row.id} onClick={() => void unpublish(row)}>공개 중지</button>}{row.visibility !== "published" && <button className="text-button danger-text" disabled={busy === row.id} onClick={() => void remove(row)}>삭제</button>}{row.visibility === "published" && <button className="text-button" onClick={() => go(`/dashboards/${row.id}`)}>공개 화면</button>}</td></tr>)}</tbody></table></div>{items.length === 0 && <div className="table-empty">검색 조건에 맞는 대시보드가 없습니다.</div>}</div></main>;
}

function StatusBadge({ row }: { row: DashboardRow }) {
  const label = row.visibility === "published" ? "공개" : row.visibility === "unpublished" ? "공개 중지" : "초안";
  return <span className={`status status-${row.visibility}`}>{label}{row.has_unpublished_changes && <i>· 미공개 변경</i>}</span>;
}

function CreateScreen({ go }: { go: (to: string) => void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [template, setTemplate] = useState("inventory_overview"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const create = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const row = await api<DashboardRow>("/api/admin/dashboards", { method: "POST", body: JSON.stringify({ title, description, source_id: "inventory", template_id: template || null }) }); go(`/admin/dashboards/${row.id}/edit`); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } };
  return <main className="content narrow"><button className="text-button back-link" onClick={() => go("/admin/dashboards")}>← 관리 목록</button><PageTitle eyebrow="NEW DASHBOARD" title="새 대시보드" description="샘플 재고 데이터로 초안을 만듭니다." />{error && <ErrorBanner message={error} />}<form className="panel form-panel" onSubmit={create}><label className="field"><span>대시보드 이름 <em>필수</em></span><input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 재고 현황" /></label><label className="field"><span>설명</span><textarea maxLength={500} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="이 대시보드에서 확인할 내용을 적어주세요." /></label><label className="field"><span>데이터 소스</span><select value="inventory" disabled><option value="inventory">재고 샘플 (3개 기준일)</option></select><small>서버에 등록된 재고 JSON만 사용할 수 있습니다.</small></label><fieldset className="template-choice"><legend>시작 구성</legend><label><input type="radio" checked={template === "inventory_overview"} onChange={() => setTemplate("inventory_overview")} /> 재고 템플릿 <small>수량 카드, 제조사·모델 차트, 집계 표, 필터</small></label><label><input type="radio" checked={template === ""} onChange={() => setTemplate("")} /> 빈 초안 <small>위젯과 필터를 직접 추가</small></label></fieldset><div className="form-actions"><button type="button" className="button secondary" onClick={() => go("/admin/dashboards")}>취소</button><button className="button primary" disabled={busy || !title.trim()}>{busy ? "만드는 중…" : "초안 만들기"}</button></div></form></main>;
}

function Editor({ id, go, widgetPickerOpen, openOverlay, closeOverlay }: { id: string; go: (to: string) => void; widgetPickerOpen: boolean; openOverlay: (overlay: string) => void; closeOverlay: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [savedConfig, setSavedConfig] = useState("");
  const [version, setVersion] = useState(0); const [revision, setRevision] = useState(0); const [status, setStatus] = useState("draft"); const [unpublished, setUnpublished] = useState(false);
  const [meta, setMeta] = useState<{ options: Record<string, Option[]> }>({ options: {} });
  const [preview, setPreview] = useState<QueryResult | null>(null); const [previewDirty, setPreviewDirty] = useState(false);
  const [previewPage, setPreviewPage] = useState(1); const [previewSort, setPreviewSort] = useState("value_desc");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState("");
  const widgetPickerTrigger = useRef<HTMLButtonElement>(null);
  const widgetPickerPanel = useRef<HTMLElement>(null);
  const dirty = Boolean(config && JSON.stringify(config) !== savedConfig);
  const current = config?.widgets.find(widget => widget.id === selectedWidget);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const row = await api<DashboardRow>(`/api/admin/dashboards/${id}`);
        if (!active) return;
        setConfig(row.draft_config); setSavedConfig(JSON.stringify(row.draft_config)); setVersion(row.edit_version); setRevision(row.published_revision); setStatus(row.visibility); setUnpublished(row.has_unpublished_changes);
        const entries = await Promise.all(["manufacturer", "model", "as_of_date"].map(async filterId => {
          let cursor = ""; const all: Option[] = [];
          do { const page = await api<{ options: Option[]; next_cursor: string | null }>(`/api/admin/data-sources/inventory/filter-options?filter_id=${filterId}&cursor=${cursor}`); all.push(...page.options); cursor = page.next_cursor ?? ""; } while (cursor);
          return [filterId, all] as const;
        }));
        if (active) setMeta({ options: Object.fromEntries(entries) });
      } catch (err) { if (active) setError((err as Error).message); }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => { if (savedConfig && config && JSON.stringify(config) !== savedConfig) setPreviewDirty(true); }, [config, savedConfig]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!widgetPickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeOverlay(); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(widgetPickerPanel.current?.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])") ?? []).filter(control => control.tabIndex >= 0 && control.getAttribute("aria-hidden") !== "true");
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!widgetPickerPanel.current?.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => widgetPickerPanel.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.requestAnimationFrame(() => widgetPickerTrigger.current?.focus());
    };
  }, [widgetPickerOpen, closeOverlay]);

  const updateConfig = (update: (old: Config) => Config) => { setConfig(old => old ? update(old) : old); setNotice(""); setError(""); };
  const save = async () => {
    if (!config) return;
    setBusy(true); setError(""); setNotice("");
    try { const row = await api<DashboardRow>(`/api/admin/dashboards/${id}/draft`, { method: "PUT", body: JSON.stringify({ config, expected_edit_version: version }) }); setVersion(row.edit_version); setRevision(row.published_revision); setStatus(row.visibility); setUnpublished(row.has_unpublished_changes); setSavedConfig(JSON.stringify(config)); setNotice("초안을 저장했습니다."); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const makePreview = async (page = previewPage, sort = previewSort) => {
    if (!config) return;
    setPreviewPage(page); setPreviewSort(sort);
    setBusy(true); setError(""); setNotice("");
    try { const latestDate = meta.options.as_of_date?.at(-1)?.value; const result = await api<QueryResult>(`/api/admin/dashboards/${id}/preview`, { method: "POST", body: JSON.stringify({ config, filters: latestDate ? { as_of_date: latestDate } : {}, tables: tableCondition(config, page, sort) }) }); setPreview(result); setPreviewDirty(false); setNotice("저장 전 설정을 미리 봅니다."); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const publish = async () => {
    if (!config) return;
    if (!window.confirm(`“${config.title}” (${config.widgets.length}개 위젯)을 활성 SSO 사용자 전체에게 공개할까요?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      let expectedVersion = version;
      if (dirty) { const saved = await api<DashboardRow>(`/api/admin/dashboards/${id}/draft`, { method: "PUT", body: JSON.stringify({ config, expected_edit_version: version }) }); expectedVersion = saved.edit_version; setVersion(saved.edit_version); setSavedConfig(JSON.stringify(config)); setStatus(saved.visibility); }
      const row = await api<DashboardRow>(`/api/admin/dashboards/${id}/publish`, { method: "POST", body: JSON.stringify({ expected_edit_version: expectedVersion, expected_published_revision: revision }) }); setVersion(row.edit_version); setRevision(row.published_revision); setStatus(row.visibility); setUnpublished(false); setNotice("대시보드를 공개했습니다.");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const addWidget = (type: Widget["type"]) => {
    if (!config) return;
    if (config.widgets.length >= 12) { setError("대시보드에는 위젯을 최대 12개까지 추가할 수 있습니다."); closeOverlay(); return; }
    const count = config.widgets.filter(widget => widget.type === type).length + 1;
    const widget: Widget = type === "metric" ? { id: `w_${uuid()}`, type, title: count === 1 ? "전체 재고 수량" : `재고 수량 ${count}`, metric_id: "inventory_count", width: 3, decimals: 0 } : type === "bar" ? { id: `w_${uuid()}`, type, title: `재고 차트 ${count}`, metric_id: "inventory_count", dimension_id: "manufacturer", width: 6, sort: "value_desc", limit: 10 } : { id: `w_${uuid()}`, type, title: `집계 표 ${count}`, dimension_ids: ["manufacturer", "model"], metric_ids: ["inventory_count"], width: 12, sort: "value_desc", page_size: 20 };
    updateConfig(old => ({ ...old, widgets: [...old.widgets, widget] })); setSelectedWidget(widget.id); closeOverlay();
  };
  const updateWidget = (key: string, value: any) => updateConfig(old => ({ ...old, widgets: old.widgets.map(widget => widget.id === selectedWidget ? { ...widget, [key]: value } : widget) }));
  const moveWidget = (delta: number) => updateConfig(old => { const index = old.widgets.findIndex(widget => widget.id === selectedWidget); const target = index + delta; if (index < 0 || target < 0 || target >= old.widgets.length) return old; const widgets = [...old.widgets]; [widgets[index], widgets[target]] = [widgets[target], widgets[index]]; return { ...old, widgets }; });
  const removeWidget = () => { updateConfig(old => ({ ...old, widgets: old.widgets.filter(widget => widget.id !== selectedWidget) })); setSelectedWidget(""); };
  const updateFilter = (idFilter: string, update: (filter: Filter) => Filter) => updateConfig(old => ({ ...old, filters: old.filters.map(filter => filter.id === idFilter ? update(filter) : filter) }));
  const addFilter = (filterId: "manufacturer" | "model") => updateConfig(old => old.filters.some(filter => filter.id === filterId) ? old : ({ ...old, filters: [...old.filters, { id: filterId, label: filterId === "manufacturer" ? "제조사" : "모델", default: [], required: false }] }));
  const removeFilter = (filterId: string) => updateConfig(old => ({ ...old, filters: old.filters.filter(filter => filter.id !== filterId) }));
  const moveFilter = (filterId: string, delta: number) => updateConfig(old => {
    const index = old.filters.findIndex(filter => filter.id === filterId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= old.filters.length) return old;
    const filters = [...old.filters]; [filters[index], filters[target]] = [filters[target], filters[index]];
    return { ...old, filters };
  });

  if (!config) return <main className="content"><div className="loading-card">편집기를 불러오는 중…</div>{error && <ErrorBanner message={error} />}</main>;
  return <main className="content editor-page"><button className="text-button back-link" onClick={() => { if (dirty && !window.confirm("저장하지 않은 변경 사항을 버릴까요?")) return; go("/admin/dashboards"); }}>← 관리 목록</button><div className="editor-title"><div><p className="eyebrow">DASHBOARD EDITOR</p><h1>{config.title || "제목 없는 대시보드"}</h1><div className="editor-status"><StatusBadge row={{ visibility: status, has_unpublished_changes: unpublished, draft_config: config } as DashboardRow} />{dirty && <span className="unsaved">● 저장되지 않은 변경</span>}</div></div><div className="title-actions"><button ref={widgetPickerTrigger} type="button" className="button secondary add-widget-trigger" disabled={busy || config.widgets.length >= 12} onClick={() => openOverlay("widget-picker")}>＋ 위젯 추가</button><button className="button secondary" disabled={busy || !dirty} onClick={() => void save()}>저장</button><button className="button secondary" disabled={busy} onClick={() => void makePreview()}>미리보기</button><button className="button primary" disabled={busy} onClick={() => void publish()}>{status === "published" ? "변경 공개" : "공개"}</button></div></div>
    {error && <ErrorBanner message={error} />}{notice && <div className="alert success">{notice}</div>}
    <div className="editor-layout"><aside className="editor-sidebar"><h3>대시보드 정보</h3><label className="field"><span>제목</span><input maxLength={120} value={config.title} onChange={e => updateConfig(old => ({ ...old, title: e.target.value }))} /></label><label className="field"><span>설명</span><textarea rows={3} maxLength={500} value={config.description} onChange={e => updateConfig(old => ({ ...old, description: e.target.value }))} /></label><div className="divider" /><div className="section-head"><h3>공통 필터</h3><span>{config.filters.length}/6</span></div>{config.filters.map(filter => <div className="filter-edit" key={filter.id}><div className="filter-row-head"><span>표시 순서</span><div><button type="button" aria-label="필터 위로 이동" disabled={config.filters[0]?.id === filter.id} onClick={() => moveFilter(filter.id, -1)}>↑</button><button type="button" aria-label="필터 아래로 이동" disabled={config.filters[config.filters.length - 1]?.id === filter.id} onClick={() => moveFilter(filter.id, 1)}>↓</button></div></div><label className="field"><span>{filter.id === "as_of_date" ? "기준일" : filter.id === "manufacturer" ? "제조사" : "모델"}{filter.required && <em>필수</em>}</span><input value={filter.label} maxLength={120} onChange={e => updateFilter(filter.id, old => ({ ...old, label: e.target.value }))} /></label>{filter.id === "as_of_date" ? <label className="field"><span>기본 기준일</span><select value={typeof filter.default === "object" && filter.default?.mode === "date" ? filter.default.value : "latest"} onChange={e => updateFilter(filter.id, old => ({ ...old, default: e.target.value === "latest" ? { mode: "latest" } : { mode: "date", value: e.target.value } }))}><option value="latest">최근 조회 가능일</option>{(meta.options.as_of_date ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : <><label className="field"><span>기본 선택값</span><select multiple size={Math.min(Math.max(meta.options[filter.id]?.length ?? 2, 2), 4)} value={Array.isArray(filter.default) ? filter.default : []} onChange={e => updateFilter(filter.id, old => ({ ...old, default: Array.from(e.currentTarget.selectedOptions, option => option.value) }))}>{(meta.options[filter.id] ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>선택하지 않으면 전체</small></label><button className="text-button danger-text" onClick={() => removeFilter(filter.id)}>필터 제거</button></>}</div>)}{config.filters.length < 6 && <div className="add-widget-buttons compact">{!config.filters.some(filter => filter.id === "manufacturer") && <button onClick={() => addFilter("manufacturer")}>＋ 제조사 필터</button>}{!config.filters.some(filter => filter.id === "model") && <button onClick={() => addFilter("model")}>＋ 모델 필터</button>}</div>}</aside>
      <section className="editor-canvas"><div className="canvas-heading"><div><h2>화면 배치</h2><p>위젯을 선택해 설정을 편집하세요. 순서는 위·아래 버튼으로 바꿉니다.</p></div><span>{config.widgets.length}/12 위젯</span></div>{config.widgets.length ? <div className="widget-grid edit-grid">{config.widgets.map((widget, index) => <button key={widget.id} className={`widget-placeholder span-${widget.width} ${selectedWidget === widget.id ? "selected" : ""}`} onClick={() => setSelectedWidget(widget.id)}><span className="placeholder-type">{widget.type === "metric" ? "지표 카드" : widget.type === "bar" ? "막대 차트" : "집계 표"} · 폭 {widget.width}/12</span><b>{widget.title || "제목 없음"}</b><small>{widget.type === "metric" ? "재고 수량" : widget.type === "bar" ? `${widget.dimension_id === "manufacturer" ? "제조사" : "모델"}별 재고` : "제조사 · 모델별 집계"}</small>{index === 0 && <i>첫 번째</i>}</button>)}</div> : <EmptyState title="위젯을 추가해 시작하세요" text="왼쪽 메뉴에서 카드, 차트 또는 표를 추가할 수 있습니다." />}{preview && <div className="preview-block"><div className="preview-banner">미리보기 {previewDirty && <b>· 설정 변경 후 다시 미리보기가 필요합니다</b>}</div><QueryMetaLine meta={preview.meta} filters={defaultsFromConfig(config, meta.options.as_of_date ?? [])} /><InventoryOverview meta={preview.meta} filters={defaultsFromConfig(config, meta.options.as_of_date ?? [])} totalWidget={preview.widgets.find(widget => widget.type === "metric")} /><WidgetGrid widgets={preview.widgets.filter(widget => widget.type !== "metric")} onTablePage={(_id, page) => void makePreview(page, previewSort)} onTableSort={(_id, sort) => void makePreview(1, sort)} /></div>}</section>
      <aside className="editor-inspector"><h3>선택 항목 설정</h3>{current ? <><p className="inspector-kind">{current.type === "metric" ? "지표 카드" : current.type === "bar" ? "막대 차트" : "집계 표"}</p><label className="field"><span>위젯 제목</span><input maxLength={120} value={current.title} onChange={e => updateWidget("title", e.target.value)} /></label><label className="field"><span>너비</span><select value={current.width} onChange={e => updateWidget("width", Number(e.target.value))}>{[3, 4, 6, 12].map(width => <option value={width} key={width}>{width}/12 열</option>)}</select></label>{current.type === "metric" && <><label className="field"><span>지표</span><select value={current.metric_id} onChange={e => updateWidget("metric_id", e.target.value)}><option value="inventory_count">재고 수량</option></select></label><label className="field"><span>소수점</span><select value={current.decimals} onChange={e => updateWidget("decimals", Number(e.target.value))}>{[0, 1, 2].map(v => <option value={v} key={v}>{v}자리</option>)}</select></label></>}{current.type === "bar" && <><label className="field"><span>분류</span><select value={current.dimension_id} onChange={e => updateWidget("dimension_id", e.target.value)}><option value="manufacturer">제조사</option><option value="model">모델</option></select></label><label className="field"><span>정렬</span><select value={current.sort} onChange={e => updateWidget("sort", e.target.value)}><option value="value_desc">수량 많은 순</option><option value="value_asc">수량 적은 순</option><option value="label_asc">이름순</option></select></label><label className="field"><span>표시 항목</span><select value={current.limit} onChange={e => updateWidget("limit", Number(e.target.value))}>{[5, 10, 20].map(v => <option value={v} key={v}>{v}개</option>)}</select></label></>}{current.type === "table" && <><fieldset className="field-checks"><legend>분류 항목</legend>{["manufacturer", "model"].map(dim => <label key={dim}><input type="checkbox" checked={current.dimension_ids.includes(dim)} onChange={e => updateWidget("dimension_ids", e.target.checked ? [...current.dimension_ids, dim] : current.dimension_ids.filter((item: string) => item !== dim))} />{dim === "manufacturer" ? "제조사" : "모델"}</label>)}</fieldset><label className="field"><span>정렬</span><select value={current.sort} onChange={e => updateWidget("sort", e.target.value)}><option value="value_desc">수량 많은 순</option><option value="value_asc">수량 적은 순</option><option value="label_asc">이름순</option></select></label><label className="field"><span>페이지 크기</span><select value={current.page_size} onChange={e => updateWidget("page_size", Number(e.target.value))}>{[20, 50, 100].map(v => <option value={v} key={v}>{v}행</option>)}</select></label></>}<div className="inspector-actions"><button className="button secondary" onClick={() => moveWidget(-1)}>↑ 위로</button><button className="button secondary" onClick={() => moveWidget(1)}>↓ 아래로</button><button className="button danger" onClick={removeWidget}>위젯 삭제</button></div></> : <p className="muted">중앙에서 위젯을 선택하면 설정 항목이 표시됩니다.</p>}</aside></div>
  {widgetPickerOpen && <div className="widget-picker-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeOverlay(); }}>
    <section ref={widgetPickerPanel} className="widget-picker-panel" role="dialog" aria-modal="true" aria-labelledby="widget-picker-title" tabIndex={-1}>
      <div className="widget-picker-heading"><div><p className="eyebrow">DASHBOARD WIDGETS</p><h2 id="widget-picker-title">위젯 추가</h2><p>재고 데이터에 맞는 위젯을 선택하세요.</p></div><button type="button" className="widget-picker-close" aria-label="위젯 선택 닫기" onClick={closeOverlay}>×</button></div>
      <div className="widget-picker-list">
        <article className="widget-picker-item"><div className="widget-picker-preview metric" aria-hidden="true"><span>12,480</span><i>대</i></div><div className="widget-picker-copy"><div><h3>재고 수량</h3><span className="widget-tag">지표</span></div><p>현재 조회 조건에 맞는 재고 행 수를 표시합니다.</p><button type="button" className="button primary small" onClick={() => addWidget("metric")}>선택</button></div></article>
        <article className="widget-picker-item"><div className="widget-picker-preview chart" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div className="widget-picker-copy"><div><h3>분류별 재고</h3><span className="widget-tag">분포</span></div><p>제조사 또는 모델별 재고 수량을 비교합니다.</p><button type="button" className="button primary small" onClick={() => addWidget("bar")}>선택</button></div></article>
        <article className="widget-picker-item"><div className="widget-picker-preview table" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div className="widget-picker-copy"><div><h3>집계 표</h3><span className="widget-tag">상세</span></div><p>제조사·모델별 수량을 정렬하고 나누어 봅니다.</p><button type="button" className="button primary small" onClick={() => addWidget("table")}>선택</button></div></article>
      </div>
      <p className="widget-picker-footnote">위젯은 최대 12개까지 추가할 수 있습니다. 추가한 뒤 오른쪽 설정에서 표시 내용을 조정하세요.</p>
    </section>
  </div>}
  </main>;
}
