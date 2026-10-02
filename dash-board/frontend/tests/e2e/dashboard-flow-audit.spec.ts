import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Destructive fixtures are permitted only on the dedicated temporary database.
test.skip(process.env.AUDIT_ISOLATED !== "1", "Opt in only on a disposable audit service.");
test.beforeAll(() => {
  if (process.env.AUDIT_ISOLATED !== "1") throw new Error("Run with AUDIT_ISOLATED=1 against a disposable audit service.");
});

const seedId = "46d2770a-f4ed-4f67-a6bf-7f3d2e7a4201";
const created = new Map<Page, string[]>();
const network = new Map<Page, Array<{ method: string; path: string; status: number }>>();
const queryResponse = (page: Page) => page.waitForResponse(r => /\/api\/dashboards\/[^/]+\/query$/.test(new URL(r.url()).pathname));
const previewResponse = (page: Page) => page.waitForResponse(r => r.url().endsWith("/preview"));
const publishResponse = (page: Page) => page.waitForResponse(r => r.url().endsWith("/publish"));

test.beforeEach(async ({ page }) => {
  network.set(page, []);
  page.on("response", response => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith("/api/") || path === "/logout") network.get(page)?.push({ method: response.request().method(), path, status: response.status() });
  });
});

async function api(page: Page, path: string, method = "GET", body?: unknown) {
  return page.evaluate(async ({ path, method, body }) => {
    const response = await fetch(path, {
      method,
      headers: method === "GET" ? {} : { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  }, { path, method, body });
}

async function login(page: Page, role: "admin" | "user" = "admin") {
  await page.goto("/");
  // Authentication loads after document navigation. Wait for it before
  // choosing logout versus login; an immediate count introduces a race.
  await expect(page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).or(page.getByRole("link", { name: "개발 관리자 로그인" }))).toBeVisible();
  if (await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).count()) {
    await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).click();
  }
  await page.getByRole("link", { name: role === "admin" ? "개발 관리자 로그인" : "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
}

async function editorReady(page: Page) {
  await expect(page.locator(".editor-sidebar input").first()).toBeVisible();
  await expect(page.locator(".editor-sidebar select").first().locator("option")).toHaveCount(4);
}

async function createUi(page: Page, suffix: string) {
  const title = `E2E ${suffix} ${Date.now()}`;
  await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
  await page.getByRole("button", { name: /새 대시보드/ }).click();
  await page.getByRole("textbox", { name: /대시보드 이름/ }).fill(title);
  await page.getByRole("textbox", { name: "설명", exact: true }).fill("Disposable audit fixture");
  await page.getByRole("button", { name: "초안 만들기", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboards\/[^/]+\/edit$/);
  const id = new URL(page.url()).pathname.split("/")[3];
  created.set(page, [...(created.get(page) ?? []), id]);
  await editorReady(page);
  return { id, title };
}

async function publish(page: Page) {
  const response = publishResponse(page);
  page.once("dialog", dialog => void dialog.accept());
  await page.getByRole("button", { name: /^(공개|변경 공개)$/ }).click();
  const result = await response;
  expect(result.status()).toBe(200);
  await expect(page.getByText("대시보드를 공개했습니다.", { exact: true })).toBeVisible();
  return result.json();
}

async function save(page: Page) {
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByText("초안을 저장했습니다.", { exact: true })).toBeVisible();
}

async function openPublic(page: Page, id: string) {
  const response = queryResponse(page);
  await page.goto(`/dashboards/${id}`);
  const result = await response;
  expect(result.status()).toBe(200);
  await expect(page.locator(".inventory-overview")).toBeVisible();
  return result.json();
}

test.afterEach(async ({ page }, info) => {
  // Capture before cleanup changes the screen or its cookies.
  if (!page.isClosed()) {
    await info.attach("audit-screen", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    await info.attach("audit-location", { body: new URL(page.url()).pathname, contentType: "text/plain" });
    await info.attach("request-statuses", { body: JSON.stringify(network.get(page), null, 2), contentType: "application/json" });
    await page.context().request.get("/dev/login?role=admin");
    for (const id of created.get(page) ?? []) {
      const response = await api(page, `/api/admin/dashboards/${id}`);
      if (response.status !== 200) continue;
      let row = response.data;
      if (row.visibility === "published") row = (await api(page, `/api/admin/dashboards/${id}/unpublish`, "POST", { expected_published_revision: row.published_revision })).data;
      const removed = await api(page, `/api/admin/dashboards/${id}?expected_edit_version=${row.edit_version}&expected_published_revision=${row.published_revision}`, "DELETE", {});
      expect(removed.status, "fixture cleanup").toBe(204);
    }
    created.delete(page);
    network.delete(page);
  }
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`normal complete administrator and user lifecycle - ${viewport.name}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await login(page);
    const { id, title } = await createUi(page, viewport.name);
    await page.locator(".editor-sidebar textarea").fill("Saved audit description");
    await save(page);
    const previewWait = previewResponse(page);
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    const preview = await (await previewWait).json();
    await expect(page.locator(".preview-block .widget-metric")).toBeVisible();
    await expect(page.locator(".preview-block .inventory-overview .overview-top h2")).toContainText("2026-09-08 ~ 2026-09-10");
    await publish(page);
    const draftTitle = title + " 수정";
    await page.locator(".editor-sidebar input").first().fill(draftTitle);
    await save(page);
    const beforeRepublish = await api(page, `/api/dashboards/${id}`);
    expect(beforeRepublish.data.config.title).toBe(title);
    await publish(page);
    await login(page, "user");
    const publicResult = await openPublic(page, id);
    await expect(page.getByRole("heading", { name: draftTitle, exact: true })).toBeVisible();
    expect(publicResult.widgets).toEqual(preview.widgets);
    const table = page.locator(".widget-table");
    const sortWait = queryResponse(page);
    await table.getByRole("combobox").selectOption("label_asc");
    expect((await sortWait).status()).toBe(200);
    const nextWait = queryResponse(page);
    await table.getByRole("button", { name: "다음", exact: true }).click();
    expect((await nextWait).status()).toBe(200);
    await expect(table.locator(".table-footer")).toContainText("2 /");
    const manufacturer = page.locator('.filter-grid select[multiple]').first();
    const value = await manufacturer.locator('option:not([value=""])').first().getAttribute("value");
    await manufacturer.selectOption(value!);
    await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
    const filteredWait = queryResponse(page);
    await page.getByRole("button", { name: "조회", exact: true }).click();
    const filtered = await (await filteredWait).json();
    expect(filtered.meta.row_count).toBeLessThan(publicResult.meta.row_count);
    const downloadWait = page.waitForEvent("download");
    await page.getByRole("button", { name: /CSV 내보내기/ }).click();
    const download = await downloadWait;
    const csv = await readFile((await download.path())!, "utf8");
    expect(csv).toContain(`"제조사 필터","${value}"`);
    expect(csv.split(/\r?\n/).filter(line => line.startsWith('"집계 표"'))).toHaveLength(filtered.widgets.find((w: any) => w.type === "table").total);
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole("button", { name: "대시보드 관리", exact: true })).toHaveCount(0);
    expect((await api(page, "/api/admin/dashboards")).status).toBe(403);
    await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).click();
    await expect(page.getByRole("link", { name: "개발 이용자 로그인" })).toBeVisible();
    expect((await api(page, "/api/auth/me")).status).toBe(401);
    await login(page);
    await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
    const row = page.locator("tbody tr").filter({ hasText: draftTitle });
    page.once("dialog", dialog => void dialog.accept());
    await row.getByRole("button", { name: "공개 중지", exact: true }).click();
    await expect(row.getByRole("button", { name: "삭제", exact: true })).toBeVisible();
    expect((await api(page, `/api/dashboards/${id}`)).status).toBe(404);
    page.once("dialog", dialog => void dialog.accept());
    await row.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(row).toHaveCount(0);
    expect((await api(page, `/api/admin/dashboards/${id}`)).status).toBe(404);
  });
}

test("fixed date default permits publication", async ({ page }) => {
  await login(page);
  await createUi(page, "fixed-date");
  await page.locator(".editor-sidebar select").first().selectOption("2026-09-09");
  await save(page);
  await publish(page);
});

test("fixed date is respected by preview and public defaults (public config mock)", async ({ page }) => {
  await login(page);
  const { id } = await createUi(page, "date-preview");
  await page.locator(".editor-sidebar select").first().selectOption("2026-09-09");
  const previewWait = previewResponse(page);
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  const preview = await (await previewWait).json();
  expect.soft(preview.meta.as_of_date, "preview uses configured date").toBe("2026-09-09");
  await page.locator(".editor-sidebar select").first().selectOption("latest");
  await publish(page);
  // Publication of fixed defaults is broken. Mock only its GET configuration
  // to independently test client initialization; queries still use real data.
  await page.route(`**/api/dashboards/${id}`, async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.config.filters.find((f: any) => f.id === "as_of_date").default = { mode: "date", value: "2026-09-09" };
    await route.fulfill({ response, json: body });
  });
  await openPublic(page, id);
  await expect.soft(page.locator('.date-range-controls input[type="date"]').nth(1)).toHaveValue("2026-09-09");
});

for (const move of ["sidebar", "browser-back"] as const) {
  test(`unsaved editor changes can cancel ${move} navigation`, async ({ page }) => {
    await login(page);
    const { title } = await createUi(page, move);
    await page.locator(".editor-sidebar input").first().fill(title + " unsaved");
    let prompted = false;
    page.on("dialog", async dialog => { prompted = true; await dialog.dismiss(); });
    if (move === "sidebar") await page.getByRole("button", { name: "대시보드", exact: true }).click();
    else await page.goBack();
    await expect.soft(page.locator(".editor-sidebar input").first()).toHaveValue(title + " unsaved");
    expect.soft(prompted, "unsaved navigation asks before discarding").toBe(true);
  });
}

test("all configured metric cards render with configured width", async ({ page }) => {
  await login(page);
  const { id } = await createUi(page, "metrics");
  await page.locator(".widget-placeholder").first().click();
  await page.locator(".editor-inspector select").first().selectOption("12");
  await page.getByRole("button", { name: /위젯 추가/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "선택", exact: true }).first().click();
  await publish(page);
  const result = await openPublic(page, id);
  const metrics = result.widgets.filter((w: any) => w.type === "metric");
  expect(metrics).toHaveLength(2);
  await expect.soft(page.locator(".widget-metric")).toHaveCount(2);
  const fullWidth = metrics.find((w: any) => w.width === 12);
  expect(fullWidth).toBeTruthy();
  const cardBox = await page.locator(`[data-widget-id="${fullWidth.id}"]`).boundingBox();
  const gridBox = await page.locator(".overview-grid").boundingBox();
  expect.soft(Math.abs(cardBox!.width - gridBox!.width), "12-column card occupies the available grid width").toBeLessThanOrEqual(2);
});

test("expired server session offers reauthentication and return path", async ({ page, context }) => {
  await login(page, "user");
  await openPublic(page, seedId);
  const cookie = (await context.cookies()).find(c => c.name === "ax_session");
  if (!process.env.AUDIT_DB_PATH || !cookie) throw new Error("Temporary database and session required");
  execFileSync("python3", ["-c", "import sqlite3,hashlib,sys,json; args=json.load(sys.stdin); p=args['dbPath']; assert p.startswith('/tmp/ax-flow-audit'); db=sqlite3.connect(p); db.execute(\"update user_sessions set expires_at='2000-01-01 00:00:00' where token_hash=?\",(hashlib.sha256(args['token'].encode()).hexdigest(),)); db.commit()"], { input: JSON.stringify({ dbPath: process.env.AUDIT_DB_PATH, token: cookie.value }) });
  const response = queryResponse(page);
  await page.getByRole("button", { name: /새로고침/ }).click();
  expect((await response).status()).toBe(401);
  const relogin = page.getByRole("link", { name: "개발 이용자 로그인" }).or(page.getByRole("button", { name: /재로그인|SSO 로그인/ }));
  await expect(relogin).toBeVisible();
  await relogin.click();
  await expect(page).toHaveURL(new RegExp(`/dashboards/${seedId}$`));
});

test("republished dashboard recovers from outdated revision without a document reload", async ({ page }) => {
  await login(page);
  const { id } = await createUi(page, "republish");
  await publish(page);
  await openPublic(page, id);
  const row = (await api(page, `/api/admin/dashboards/${id}`)).data;
  expect((await api(page, `/api/admin/dashboards/${id}/publish`, "POST", { expected_edit_version: row.edit_version, expected_published_revision: row.published_revision })).status).toBe(200);
  const response = queryResponse(page);
  await page.getByRole("button", { name: /새로고침/ }).click();
  expect((await response).status()).toBe(409);
  // Accept either automatic recovery or an explicit recovery control.
  const recovery = page.getByRole("button", { name: /최신.*불러|대시보드.*다시.*불러/ });
  const retryResponse = queryResponse(page);
  if (await recovery.count()) await recovery.click();
  else await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  expect((await retryResponse).status()).toBe(200);
  await expect(page.locator(".filter-feedback")).not.toContainText("조회 실패");
});

test("concurrent editor conflict preserves local edits and provides recovery", async ({ page, context }) => {
  await login(page);
  const { id, title } = await createUi(page, "conflict");
  const local = title + " local";
  await page.locator(".editor-sidebar input").first().fill(local);
  const other = await context.newPage();
  await other.goto(`/admin/dashboards/${id}/edit`);
  await editorReady(other);
  await other.locator(".editor-sidebar textarea").fill("Other administrator saved first");
  await save(other);
  await other.close();
  const response = page.waitForResponse(r => r.request().method() === "PUT" && r.url().endsWith("/draft"));
  await page.getByRole("button", { name: "저장", exact: true }).click();
  expect((await response).status()).toBe(409);
  await expect(page.locator(".editor-sidebar input").first()).toHaveValue(local);
  await expect(page.getByRole("button", { name: /최신.*불러|충돌.*해결|변경.*비교/ })).toBeVisible();
});

test("query network failure retains last result and retry succeeds", async ({ page }) => {
  await login(page, "user");
  await openPublic(page, seedId);
  const metric = page.locator(".widget-metric .metric-value");
  const previous = await metric.innerText();
  await page.route("**/api/dashboards/*/query", route => route.abort("failed"), { times: 1 });
  await page.getByRole("button", { name: /새로고침/ }).click();
  await expect(page.locator(".filter-feedback")).toContainText("조회 실패");
  await expect(metric).toHaveText(previous);
  const response = queryResponse(page);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.locator(".filter-feedback")).not.toContainText("조회 실패");
});

test("authentication service outage is distinguished from signed out", async ({ page }) => {
  await login(page, "user");
  await page.route("**/api/auth/me", route => route.fulfill({ status: 503, json: { error: { message: "Authentication service unavailable" } } }));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(/인증|연결|불러|서비스/);
  await expect(page.getByRole("button", { name: /다시 시도|재시도/ })).toBeVisible();
});

test("initial date option network failure can be retried from the detail screen", async ({ page }) => {
  await login(page, "user");
  await page.route(`**/api/dashboards/${seedId}/filter-options?**`, route => route.abort("failed"), { times: 1 });
  await page.goto(`/dashboards/${seedId}`);
  await expect(page.locator(".loading-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "다시 시도", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.locator(".widget-metric")).toBeVisible();
});

test("rejected logout keeps authenticated state and allows retry", async ({ page }) => {
  await login(page, "user");
  await page.route("**/logout", route => route.fulfill({ status: 500, json: { error: { message: "Logout unavailable" } } }), { times: 1 });
  await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).click();
  expect((await api(page, "/api/auth/me")).status).toBe(200);
  await expect(page.getByRole("alert")).toContainText(/로그아웃|실패/);
  await expect(page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ })).toBeVisible();
});

test("published dashboard beyond the first 20 is reachable from the list", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const ids: string[] = [];
  for (let index = 0; index < 21; index++) {
    const response = await api(page, "/api/admin/dashboards", "POST", { title: `Pagination fixture ${index} ${Date.now()}`, description: "Audit only", source_id: "inventory", template_id: "inventory_overview" });
    expect(response.status).toBe(201);
    const row = response.data;
    ids.push(row.id);
    created.set(page, [...ids]);
    expect((await api(page, `/api/admin/dashboards/${row.id}/publish`, "POST", { expected_edit_version: row.edit_version, expected_published_revision: row.published_revision })).status).toBe(200);
  }
  const target = (await api(page, `/api/dashboards/${ids[0]}`)).data.config.title;
  await login(page, "user");
  const pagination = page.getByRole("button", { name: /다음|더 보기/ });
  if (await pagination.count()) await pagination.first().click();
  await expect(page.locator(".dashboard-card").filter({ hasText: target })).toBeVisible();
});

test("deleted initial sample remains deleted after user list visit", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
  const row = page.locator("tbody tr").filter({ hasText: "재고 현황" });
  page.once("dialog", dialog => void dialog.accept());
  await row.getByRole("button", { name: "공개 중지", exact: true }).click();
  await expect(row.getByRole("button", { name: "삭제", exact: true })).toBeVisible();
  page.once("dialog", dialog => void dialog.accept());
  await row.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(row).toHaveCount(0);
  expect((await api(page, `/api/admin/dashboards/${seedId}`)).status).toBe(404);
  await login(page, "user");
  await expect(page.locator(".loading-card")).toHaveCount(0);
  await expect(page.locator(".dashboard-card").filter({ hasText: "재고 현황" })).toHaveCount(0);
  expect((await api(page, `/api/dashboards/${seedId}`)).status).toBe(404);
});

test("major screens fit each viewport and retain visual evidence", async ({ page }) => {
  test.setTimeout(90_000);
  const capture = async (name: string) => {
    await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect.soft(dimensions.content, `${name} document width`).toBeLessThanOrEqual(dimensions.viewport);
  };
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "개발 관리자 로그인" }).or(page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }))).toBeVisible();
    if (await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).count()) await page.getByRole("button", { name: /^로그아웃(?: 나가기)?$/ }).click();
    await expect(page.getByRole("link", { name: "개발 관리자 로그인" })).toBeVisible();
    await capture(`${viewport.name}-login`);
    await login(page);
    await expect(page.locator(".dashboard-card").first()).toBeVisible();
    await capture(`${viewport.name}-list`);
    const { id } = await createUi(page, `visual-${viewport.name}`);
    await capture(`${viewport.name}-editor`);
    const previewWait = previewResponse(page);
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    expect((await previewWait).status()).toBe(200);
    await expect(page.locator(".preview-block .widget-table")).toBeVisible();
    await capture(`${viewport.name}-preview`);
    await publish(page);
    await openPublic(page, id);
    await capture(`${viewport.name}-inventory`);
    await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await capture(`${viewport.name}-admin-list`);
  }
});
