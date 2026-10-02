import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { User, Runtime } from "./types";
import { api } from "./api";
import { usePath } from "./history";
import { DashboardList, DashboardDetail } from "./Dashboard";
import { Forbidden, NotFound } from "./ui";

const isAdmin = (user: User | null) => Boolean(user?.roles.includes("ROLE_SYSTEM"));
const AdminScreens = lazy(() => import("./Admin"));
export default function App() {
  const { path, entryKey, overlay, go, openOverlay, closeOverlay, saveView, pushView } = usePath();
  const [user, setUser] = useState<User | null>(null);
  const [runtime, setRuntime] = useState<Runtime>({ development_login_enabled: false, sso_enabled: true });
  const [authReady, setAuthReady] = useState(false);

  const refreshAuth = useCallback(async () => {
    const [me, runtimeInfo] = await Promise.all([
      api<User>("/api/auth/me").catch(() => null),
      api<Runtime>("/api/runtime").catch(() => ({ development_login_enabled: false, sso_enabled: true })),
    ]);
    setUser(me);
    setRuntime(runtimeInfo);
    setAuthReady(true);
  }, []);

  useEffect(() => { void refreshAuth(); }, [refreshAuth]);

  const logout = async () => {
    await fetch("/logout", { method: "POST", credentials: "same-origin", headers: { "X-Requested-With": "XMLHttpRequest", Origin: window.location.origin } });
    setUser(null);
    go("/");
  };

  const goLogin = () => { window.location.href = "/login?next=%2Fdashboards"; };
  if (!authReady) return <div className="loading-page">서비스를 준비하고 있습니다…</div>;
  if (!user) return <LoginScreen runtime={runtime} onSso={goLogin} />;

  const route = path.replace(/\/$/, "") || "/";
  const admin = isAdmin(user);
  let screen;
  if (route === "/" || route === "/dashboards") screen = <DashboardList go={go} />;
  else if (route === "/admin/dashboards" || route === "/admin/dashboards/new" || (route.startsWith("/admin/dashboards/") && route.endsWith("/edit"))) screen = admin ? <AdminScreens path={route} entryKey={entryKey} go={go} widgetPickerOpen={overlay === "widget-picker"} openOverlay={openOverlay} closeOverlay={closeOverlay} /> : <Forbidden />;
  else if (route.startsWith("/dashboards/")) screen = <DashboardDetail key={`${entryKey}:${route.split("/")[2]}`} id={route.split("/")[2]} entryKey={entryKey} go={go} saveView={saveView} pushView={pushView} />;
  else screen = <NotFound go={go} />;

  return <div className="app-shell"><Sidebar admin={admin} path={route} go={go} /><div className="app-main"><Header user={user} admin={admin} onLogout={() => void logout()} /><div className="screen-view"><Suspense fallback={<main className="content"><div className="loading-card">화면을 불러오는 중…</div></main>}>{screen}</Suspense></div></div></div>;
}

function Sidebar({ admin, path, go }: { admin: boolean; path: string; go: (to: string) => void }) {
  const inAdmin = path.startsWith("/admin/");
  return <aside className="app-sidebar">
    <button className="brand sidebar-brand" onClick={() => go("/dashboards")}><span className="brand-mark">AX</span><span className="brand-copy"><b>Distribution</b><small>INTELLIGENCE</small></span></button>
    <nav className="sidebar-navigation" aria-label="주 메뉴">
      <div className="sidebar-group"><p>WORKSPACE</p><button className={!inAdmin ? "active" : ""} onClick={() => go("/dashboards")}><span className="sidebar-icon" aria-hidden="true">▦</span><span>대시보드</span></button></div>
      {admin && <div className="sidebar-group"><p>ADMINISTRATION</p><button className={inAdmin ? "active" : ""} onClick={() => go("/admin/dashboards")}><span className="sidebar-icon" aria-hidden="true">⚙</span><span>대시보드 관리</span></button></div>}
    </nav>
    <div className="sidebar-footer"><span className="sidebar-footer-mark" aria-hidden="true">↗</span><span><b>재고 분석 워크스페이스</b><small>날짜별 스냅샷 데이터</small></span></div>
  </aside>;
}

function Header({ user, admin, onLogout }: { user: User; admin: boolean; onLogout: () => void }) {
  return <header className="topbar"><div className="topbar-context"><span>AX DISTRIBUTION</span><b>업무 현황</b></div><div className="user-menu"><span className="header-avatar" aria-hidden="true">{user.displayName.slice(0, 1)}</span><span className="header-user"><b>{user.displayName}</b><small>{admin ? "관리자" : "이용자"} · {user.sabun}</small></span><button className="button ghost small" onClick={onLogout}>로그아웃</button></div></header>;
}

function LoginScreen({ runtime, onSso }: { runtime: Runtime; onSso: () => void }) {
  return <main className="login-wrap"><div className="login-card"><div className="brand-mark large">AX</div><p className="eyebrow">DISTRIBUTION INTELLIGENCE</p><h1>재고 현황을 한눈에</h1><p className="muted">로그인 후 공개된 대시보드를 확인할 수 있습니다.</p>{runtime.development_login_enabled ? <div className="login-actions"><a className="button primary" href="/dev/login?role=admin">개발 관리자 로그인</a><a className="button secondary" href="/dev/login?role=user">개발 이용자 로그인</a><p className="hint">localhost 개발 환경에서만 사용할 수 있습니다.</p></div> : <button className="button primary full" onClick={onSso}>KTIS SSO 로그인</button>}</div></main>;
}
