import { useCallback, useEffect, useState } from "react";
import type { Runtime, User } from "./types";
import { api } from "./api";

const revenueCards = [
  {
    title: "디스플레이 광고",
    text: "공개 재고 리포트 상단과 인사이트 영역에 CPM 배너를 운영합니다.",
  },
  {
    title: "B2B 리드",
    text: "유통사, 제조사, 물류 파트너의 상담 문의를 유료 리드로 전환합니다.",
  },
  {
    title: "스폰서 리포트",
    text: "카테고리별 시장 동향 리포트를 브랜드 후원 콘텐츠로 발행합니다.",
  },
];

const insightMetrics = [
  { label: "공개 샘플 리포트", value: "3일" },
  { label: "광고 지면", value: "4개" },
  { label: "상담 CTA", value: "상시" },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [runtime, setRuntime] = useState<Runtime>({
    development_login_enabled: false,
    sso_enabled: true,
  });

  const refreshAuth = useCallback(async () => {
    const [me, runtimeInfo] = await Promise.all([
      api<User>("/api/auth/me").catch(() => null),
      api<Runtime>("/api/runtime").catch(() => ({
        development_login_enabled: false,
        sso_enabled: true,
      })),
    ]);
    setUser(me);
    setRuntime(runtimeInfo);
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const logout = async () => {
    await fetch("/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Origin: window.location.origin,
      },
    });
    setUser(null);
  };

  return (
    <main className="public-home">
      <header className="public-nav">
        <a className="brand" href="/">
          <span className="brand-mark">AX</span>
          <span className="brand-copy">
            <b>Distribution</b>
            <small>PUBLIC INTELLIGENCE</small>
          </span>
        </a>
        <nav aria-label="공개 홈페이지 메뉴">
          <a href="#reports">리포트</a>
          <a href="#revenue">광고 상품</a>
          <a href="#contact">문의</a>
        </nav>
        {user ? (
          <button className="button ghost small" onClick={() => void logout()}>
            로그아웃
          </button>
        ) : (
          <a className="button secondary small" href="/login?next=%2F">
            운영자 로그인
          </a>
        )}
      </header>

      <section className="public-hero">
        <div>
          <p className="eyebrow">Inventory Media Dashboard</p>
          <h1>재고 데이터를 공개 리포트로 보여주고 광고 수익으로 전환하세요.</h1>
          <p>
            내부 대시보드의 핵심 지표를 공개형 홈페이지로 포장해 검색 유입, 광고 배너,
            B2B 상담 문의를 받을 수 있게 구성했습니다.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#reports">샘플 리포트 보기</a>
            <a className="button secondary" href="mailto:ads@example.com">광고 문의</a>
          </div>
        </div>
        <aside className="public-ad-card" aria-label="상단 광고 슬롯">
          <span>AD</span>
          <strong>프리미엄 B2B 배너</strong>
          <p>제조사, 물류사, 솔루션 광고를 직접 판매하거나 AdSense로 운영할 수 있습니다.</p>
        </aside>
      </section>

      <section id="reports" className="public-section">
        <div className="section-headline">
          <p className="eyebrow">Public Report</p>
          <h2>로그인 없이 확인하는 공개 인사이트</h2>
        </div>
        <div className="metric-strip">
          {insightMetrics.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
        <div className="report-preview">
          <div>
            <p className="eyebrow">Sample Insight</p>
            <h3>제조사별 재고 집중도와 장기 재고를 공개 콘텐츠로 요약</h3>
            <p>
              실제 운영에서는 공개 가능한 집계값만 노출하고, 상세 데이터와 관리자 편집은
              SSO 로그인 뒤에서 관리합니다.
            </p>
          </div>
          <div className="bar-list" aria-label="샘플 차트">
            <span style={{ width: "82%" }}>제조사 A 82%</span>
            <span style={{ width: "64%" }}>제조사 B 64%</span>
            <span style={{ width: "48%" }}>제조사 C 48%</span>
          </div>
        </div>
      </section>

      <section id="revenue" className="public-section">
        <div className="section-headline">
          <p className="eyebrow">Revenue Model</p>
          <h2>광고형 수익 모델</h2>
        </div>
        <div className="revenue-grid">
          {revenueCards.map((card) => (
            <article key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="public-cta">
        <div>
          <p className="eyebrow">Launch Ready</p>
          <h2>공개 홈페이지는 광고형으로, 내부 운영은 로그인 뒤에서.</h2>
          <p>
            {runtime.development_login_enabled
              ? "개발 모드에서는 운영자 테스트 로그인을 사용할 수 있습니다."
              : "운영 모드에서는 SSO 로그인과 공개 홈페이지를 분리해 운영합니다."}
          </p>
        </div>
        <div className="cta-actions">
          {runtime.development_login_enabled && (
            <a className="button secondary" href="/dev/login?role=admin">
              개발 관리자 로그인
            </a>
          )}
          <a className="button primary" href="mailto:ads@example.com">
            광고 제휴 문의
          </a>
        </div>
      </section>
    </main>
  );
}
