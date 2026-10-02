import type { ResultWidget } from "./types";
import { formatPercent, dimensionLabel } from "./ui";

export function WidgetGrid({ widgets, pendingWidgetIds = [], onTablePage, onTableSort, onBarSelect, onTableSelect, drillableFilters = [] }: { widgets: ResultWidget[]; pendingWidgetIds?: string[]; onTablePage: (id: string, page: number) => void; onTableSort: (id: string, sort: string) => void; onBarSelect?: (dimension: string, value: string) => void; onTableSelect?: (row: Record<string, any>) => void; drillableFilters?: string[] }) {
  return <div className="widget-grid">{widgets.map(widget => {
    const busy = pendingWidgetIds.includes(widget.id);
    return <section key={widget.id} data-widget-id={widget.id} aria-busy={busy} className={"widget-card span-" + (widget.width ?? 6) + " widget-" + widget.type + (busy ? " is-querying" : "")}><div className="widget-head"><div><p className="eyebrow">{widget.type === "metric" ? "TOTAL" : widget.type === "bar" ? "BREAKDOWN" : "DETAILS"}</p><h2>{widget.title}</h2></div>{widget.type === "table" && <select className="compact-select" aria-label={`${widget.title} 정렬`} disabled={busy} value={widget.sort ?? "value_desc"} onChange={e => onTableSort(widget.id, e.target.value)}><option value="value_desc">수량 많은 순</option><option value="value_asc">수량 적은 순</option><option value="label_asc">이름순</option></select>}</div>{widget.type === "metric" ? <div className="metric-value">{Number(widget.value).toLocaleString("ko-KR", { minimumFractionDigits: widget.decimals ?? 0, maximumFractionDigits: widget.decimals ?? 0 })}<small>{widget.unit}</small></div> : widget.type === "bar" ? <BarChart widget={widget} onSelect={onBarSelect && drillableFilters.includes(widget.dimension_id) ? (value => onBarSelect(widget.dimension_id, value)) : undefined} /> : <DataTable widget={widget} busy={busy} onPage={page => onTablePage(widget.id, page)} onSelect={onTableSelect && widget.columns.some((column: { id: string }) => drillableFilters.includes(column.id)) ? onTableSelect : undefined} />}{busy && <span className="widget-busy">갱신 중…</span>}</section>;
  })}</div>;
}

export function BarChart({ widget, onSelect }: { widget: ResultWidget; onSelect?: (value: string) => void }) {
  const items: { label: string; value: number; share: number | null }[] = widget.items ?? [];
  const max = Math.max(...items.map(item => item.value), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const hasRemainder = Number(widget.remaining_categories ?? 0) > 0;
  const isModel = widget.dimension_id === "model";
  const heading = isModel
    ? "상위 " + items.length + "개 모델 표시"
    : (widget.dimension_id === "holder" ? "보유처 " : "제조사 ") + Number(widget.category_count ?? 0).toLocaleString("ko-KR") + "개";
  return <div className="bar-chart">
    <div className="chart-summary"><span>{heading}</span><b>표시 합계 {Number(widget.included_value ?? 0).toLocaleString("ko-KR")} / 전체 {Number(widget.total_value ?? 0).toLocaleString("ko-KR")}대 · {formatPercent(widget.coverage)}</b></div>
    {items.length ? <><div className="chart-key"><span></span><span>막대 길이: 항목 간 수량 비교</span><span>대수</span><span>전체 대비</span></div><div className="chart-rows">{items.map((item, index) => { const label = dimensionLabel(item.label); const content = <><span className="chart-label" title={label}>{label}</span><span className="chart-plot"><span className="chart-bar" style={{ width: Math.max((item.value / max) * 100, 0.6) + "%" }} /></span><b className="chart-count">{item.value.toLocaleString("ko-KR")}</b><span className="chart-share">{formatPercent(item.share)}</span></>; return onSelect ? <button type="button" className="chart-row chart-choice" key={item.label + "-" + index} onClick={() => onSelect(item.label)} title={`${label} 조회 조건에 추가`}>{content}</button> : <div className="chart-row" key={item.label + "-" + index}>{content}</div>; })}</div><div className="chart-axis"><span className="axis-title">재고 수량</span><div>{ticks.map(tick => <span key={tick}>{Math.round(max * tick).toLocaleString("ko-KR")}</span>)}</div><span>대</span></div></> : <div className="widget-empty">조건에 맞는 데이터가 없습니다. <b>합계 0대</b></div>}
    {hasRemainder && <div className="chart-remainder"><span>{isModel ? "나머지 " : "추가 "}{Number(widget.remaining_categories).toLocaleString("ko-KR")}{isModel ? "개 모델" : "개 항목"}</span><b>{Number(widget.remaining_value).toLocaleString("ko-KR")}대 · 전체의 {formatPercent(widget.remaining_share)}</b></div>}
  </div>;
}

function DataTable({ widget, busy = false, onPage, onSelect }: { widget: ResultWidget; busy?: boolean; onPage: (page: number) => void; onSelect?: (row: Record<string, any>) => void }) {
  const page = widget.page ?? 1;
  const pages = Math.max(1, Math.ceil(widget.total / widget.page_size));
  if (!widget.rows?.length) return <div className="widget-empty">조건에 맞는 데이터가 없습니다. <b>총 0건</b></div>;
  const total = Number(widget.total_value ?? 0);
  return <><div className="table-wrap"><table><thead><tr>{widget.columns.map((column: any) => <th className={column.id === "inventory_count" ? "inventory-quantity-column" : ""} key={column.id}>{column.label}{column.id === "inventory_count" && <small className="inventory-quantity-legend">막대: 조회 재고 전체 대비</small>}</th>)}{onSelect && <th>조건</th>}</tr></thead><tbody>{widget.rows.map((row: any, index: number) => <tr key={index}>{widget.columns.map((column: any) => <td key={column.id}>{column.id === "inventory_count" ? <div className="inventory-quantity"><span className="inventory-quantity-track" aria-hidden="true"><span style={{ width: `${total > 0 ? Number(row.inventory_count) / total * 100 : 0}%` }} /></span><strong className="inventory-quantity-value">{Number(row.inventory_count).toLocaleString("ko-KR")} <small>{column.unit ?? ""}</small></strong><span className="inventory-quantity-share">조회 재고의 {formatPercent(total > 0 ? Number(row.inventory_count) / total : 0)}</span></div> : dimensionLabel(row[column.id])}</td>)}{onSelect && <td><button className="text-button" disabled={busy} onClick={() => onSelect(row)}>조건 선택</button></td>}</tr>)}</tbody></table></div><div className="table-summary">전체 집계 {Number(widget.total_value ?? 0).toLocaleString("ko-KR")}대 · 분류 조합 {Number(widget.total).toLocaleString("ko-KR")}건</div><div className="table-footer"><span>총 {widget.total.toLocaleString()}건</span><div><button disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>이전</button><span>{page} / {pages}</span><button disabled={busy || page >= pages} onClick={() => onPage(page + 1)}>다음</button></div></div></>;
}
