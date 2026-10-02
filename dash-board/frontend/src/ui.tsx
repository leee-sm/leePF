import type { ReactNode } from "react";

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{actions && <div className="title-actions">{actions}</div>}</div>;
}

export function ErrorBanner({ message, action }: { message: string; action?: ReactNode }) { return message ? <div className="alert error" role="alert"><span>{message}</span>{action}</div> : null; }

export function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span>▦</span><h2>{title}</h2><p>{text}</p></div>; }
export function Forbidden() { return <main className="content"><EmptyState title="관리자 권한이 필요합니다" text="이 화면은 시스템 관리자만 사용할 수 있습니다." /></main>; }
export function NotFound({ go }: { go: (to: string) => void }) { return <main className="content"><EmptyState title="화면을 찾을 수 없습니다" text="요청한 화면이 없거나 주소가 바뀌었습니다." /><button className="button primary centered" onClick={() => go("/dashboards")}>대시보드로 이동</button></main>; }
export function formatPercent(value: number | null | undefined) { return value == null ? "—" : new Intl.NumberFormat("ko-KR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value); }
export function dimensionLabel(value: string) { return value === "미분류" ? "미등록" : value; }

export function formatDate(value: string | null) { if (!value) return "—"; return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value)); }
export function formatTime(value: string | null) { if (!value) return "—"; return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
