import { expect, test } from "@playwright/test";

const isDashboardQuery = (url: string, method: string) =>
  method === "POST" && /\/api\/dashboards\/[^/]+\/query$/.test(new URL(url).pathname);

async function loginAsUser(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
  await expect(page.locator(".dashboard-card").first()).toBeVisible();
}

test("browser Back and Forward restore the inventory view, filters, table page, and scroll", async ({ page }) => {
  await loginAsUser(page);
  await page.locator(".dashboard-card").filter({ hasText: "재고 현황" }).first().click();
  await expect(page).toHaveURL(/\/dashboards\/[0-9a-f-]+$/);

  const endDateInput = page.locator('.date-range-controls input[type="date"]').nth(1);
  await endDateInput.fill("2026-09-09");
  const dateQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  expect((await dateQuery).status()).toBe(200);
  await expect(endDateInput).toHaveValue("2026-09-09");

  const table = page.locator(".widget-card.widget-table").first();
  await table.scrollIntoViewIfNeeded();
  const nextPage = table.getByRole("button", { name: "다음" });
  await expect(nextPage).toBeEnabled();
  const nextPageQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await nextPage.click();
  expect((await nextPageQuery).status()).toBe(200);
  await expect(table.locator(".table-footer")).toContainText("2 /");
  const savedScroll = await page.evaluate(() => window.scrollY);

  await page.getByRole("button", { name: "대시보드", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
  const backQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboards\/[0-9a-f-]+$/);
  expect((await backQuery).status()).toBe(200);
  await expect(page.locator('.date-range-controls input[type="date"]').nth(1)).toHaveValue("2026-09-09");
  await expect(page.locator(".widget-card.widget-table").first().locator(".table-footer")).toContainText("2 /");
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThanOrEqual(Math.max(0, savedScroll - 2));

  await page.goForward();
  await expect(page).toHaveURL(/\/dashboards$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
});

test("a direct detail entry uses the dashboard as a one-time Back fallback", async ({ page, context }) => {
  await loginAsUser(page);
  await page.locator(".dashboard-card").filter({ hasText: "재고 현황" }).first().click();
  const detailUrl = page.url();

  const directPage = await context.newPage();
  await directPage.goto(detailUrl);
  await expect(directPage.getByRole("heading", { name: "재고 현황", exact: true })).toBeVisible();
  await expect(directPage.locator(".widget-table").first()).toBeVisible();
  const drillQuery = directPage.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await directPage.locator(".widget-table").first().getByRole("button", { name: "조건 선택" }).first().click();
  expect((await drillQuery).status()).toBe(200);
  const restoreQuery = directPage.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await directPage.goBack();
  expect((await restoreQuery).status()).toBe(200);
  await expect(directPage).toHaveURL(detailUrl);
  await expect(directPage.locator(".widget-table").first()).toBeVisible();
  await directPage.goBack();
  await expect(directPage).toHaveURL(/\/dashboards$/);
  await expect(directPage.getByRole("heading", { name: "대시보드" })).toBeVisible();
  expect(await directPage.evaluate(() => window.history.state?.fallbackOnBack)).toBe(false);
  await directPage.goBack();
  await expect(directPage).toHaveURL("about:blank");
  await directPage.close();
});

test("condition selection queries immediately and Back and Forward restore the previous table view", async ({ page }) => {
  await loginAsUser(page);
  await page.locator(".dashboard-card").filter({ hasText: "재고 현황" }).first().click();
  await expect(page.locator(".widget-table").first()).toBeVisible();
  const detailUrl = page.url();
  await page.locator('.date-range-controls input[type="date"]').nth(1).fill("2026-09-09");
  const dateQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  await dateQuery;

  const table = page.locator(".widget-table").first();
  const sortQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await table.getByRole("combobox").selectOption("label_asc");
  await sortQuery;
  const nextQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await table.getByRole("button", { name: "다음", exact: true }).click();
  const previous = await (await nextQuery).json();
  await expect(table.locator(".table-footer")).toContainText("2 /");
  await table.getByRole("button", { name: "조건 선택" }).first().scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  const metric = await page.locator(".widget-metric .metric-value").first().innerText();
  const previousTable = previous.widgets.find((widget: any) => widget.type === "table");
  const row = previousTable.rows[0];

  const drillQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await table.getByRole("button", { name: "조건 선택" }).first().click();
  const drillResponse = await drillQuery;
  expect(drillResponse.request().postDataJSON().filters).toMatchObject({ manufacturer: [row.manufacturer], model: [row.model], as_of_date: "2026-09-09" });
  const drilled = await drillResponse.json();
  expect(drilled.meta.row_count).toBe(row.inventory_count);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator(".scope-pill")).toContainText(row.model);
  await expect(table.locator(".table-footer")).toContainText("1 /");

  const backQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.goBack();
  const restored = await backQuery;
  expect(restored.request().postDataJSON().filters).toMatchObject({ manufacturer: [], model: [], as_of_date: "2026-09-09" });
  expect((await restored.json()).widgets.find((widget: any) => widget.type === "table").rows).toEqual(previousTable.rows);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator(".widget-metric .metric-value").first()).toHaveText(metric);
  await expect(table.getByRole("combobox")).toHaveValue("label_asc");
  await expect(table.locator(".table-footer")).toContainText("2 /");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.max(0, scrollY - 2));

  const forwardQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.goForward();
  expect((await (await forwardQuery).json()).meta.row_count).toBe(drilled.meta.row_count);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator(".scope-pill")).toContainText(row.model);
  await expect(table.locator(".table-footer")).toContainText("1 /");
});

test("Back recovers the previous result when an automatic condition query fails", async ({ page }) => {
  await loginAsUser(page);
  await page.locator(".dashboard-card").filter({ hasText: "재고 현황" }).first().click();
  const metric = page.locator(".widget-metric .metric-value").first();
  await expect(metric).toBeVisible();
  const previous = await metric.innerText();
  const detailUrl = page.url();
  await page.route("**/api/dashboards/*/query", route => route.fulfill({ status: 500, json: { message: "자동 조회 검증 오류" } }), { times: 1 });
  await page.locator(".widget-table").first().getByRole("button", { name: "조건 선택" }).first().click();
  await expect(page.locator(".filter-feedback")).toContainText("자동 조회 검증 오류");
  const backQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.goBack();
  expect((await backQuery).status()).toBe(200);
  await expect(page).toHaveURL(detailUrl);
  await expect(metric).toHaveText(previous);
});
