import { expect, test, type Page } from "@playwright/test";

const queryResponse = (page: Page) => page.waitForResponse(response =>
  response.request().method() === "POST" && /\/api\/dashboards\/[^/]+\/query$/.test(new URL(response.url()).pathname),
);

async function openInventory(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
  const response = queryResponse(page);
  await page.getByRole("button", { name: /재고 현황/ }).click();
  return (await response).json();
}

test("reset immediately restores results and classification clear retains the selected dates", async ({ page }) => {
  const initial = await openInventory(page);
  const metric = page.locator(".widget-metric .metric-value").first();
  const manufacturer = page.locator("select[multiple]").first();
  const value = await manufacturer.locator('option:not([value=""])').first().getAttribute("value");
  await manufacturer.selectOption(value!);
  const dates = page.locator('.date-range-controls input[type="date"]');
  await dates.nth(1).fill("2026-09-09");
  const filteredResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const filtered = await (await filteredResponse).json();
  expect(filtered.meta.row_count).toBeLessThan(initial.meta.row_count);
  await expect(metric).toHaveText(`${filtered.meta.row_count.toLocaleString("ko-KR")}대`);

  const clearResponse = queryResponse(page);
  await page.getByRole("button", { name: "제조사·모델 해제" }).click();
  const clear = await clearResponse;
  expect(clear.status()).toBe(200);
  expect(clear.request().postDataJSON().filters).toMatchObject({ as_of_date: "2026-09-09", manufacturer: [], model: [] });
  const cleared = await clear.json();
  await expect(metric).toHaveText(`${cleared.meta.row_count.toLocaleString("ko-KR")}대`);
  await expect(dates.nth(1)).toHaveValue("2026-09-09");

  await manufacturer.selectOption(value!);
  const resetResponse = queryResponse(page);
  await page.getByRole("button", { name: "기간·분류 초기화" }).click();
  const reset = await resetResponse;
  expect(reset.status()).toBe(200);
  expect(reset.request().postDataJSON().filters).toMatchObject({ as_of_date: "2026-09-10", manufacturer: [], model: [] });
  expect((await reset.json()).meta.row_count).toBe(initial.meta.row_count);
  await expect(metric).toHaveText(`${initial.meta.row_count.toLocaleString("ko-KR")}대`);
  await expect(dates.first()).toHaveValue("2026-09-08");
  await expect(dates.nth(1)).toHaveValue("2026-09-10");
  await expect(page.locator(".changed-tag")).not.toBeVisible();

  await dates.nth(1).fill("2026-09-08");
  const emptyResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  expect((await (await emptyResponse).json()).meta.row_count).toBe(0);
  await expect(page.locator(".widget-table .widget-empty").first()).toBeVisible();
  const restoredResponse = queryResponse(page);
  await page.getByRole("button", { name: "기간·분류 초기화" }).click();
  await restoredResponse;
  await expect(page.locator(".inventory-quantity").first()).toBeVisible();
});

test("inventory bars show counts and shares correctly after sorting and pagination", async ({ page }) => {
  const initial = await openInventory(page);
  const table = page.locator(".widget-table").first();
  const checkRows = async (result: any) => {
    const widget = result.widgets.find((item: any) => item.type === "table");
    await expect(table).toHaveAttribute("aria-busy", "false");
    await expect(table.locator(".inventory-quantity")).toHaveCount(widget.rows.length);
    for (const index of [0, widget.rows.length - 1]) {
      const row = widget.rows[index];
      const quantity = table.locator(".inventory-quantity").nth(index);
      await expect(quantity.locator(".inventory-quantity-value")).toHaveText(`${row.inventory_count.toLocaleString("ko-KR")} 대`);
      const share = new Intl.NumberFormat("ko-KR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(row.inventory_count / widget.total_value);
      await expect(quantity.locator(".inventory-quantity-share")).toHaveText(`조회 재고의 ${share}`);
    }
    const widths = await table.locator(".inventory-quantity-track > span").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
    const track = await table.locator(".inventory-quantity-track").first().evaluate(element => element.getBoundingClientRect().width);
    expect(track).toBeGreaterThan(40);
    for (const index of [0, widget.rows.length - 1]) {
      expect(widths[index]).toBeCloseTo(track * widget.rows[index].inventory_count / widget.total_value, 0);
    }
    expect(Math.max(...widths)).toBeLessThan(track);
    expect(Math.min(...widths)).toBeLessThan(Math.max(...widths));
  };
  await expect(table.locator(".inventory-quantity-legend")).toHaveText("막대: 조회 재고 전체 대비");
  await checkRows(initial);
  await table.screenshot({ path: test.info().outputPath("inventory-bars.png") });

  const sortedResponse = queryResponse(page);
  await table.getByRole("combobox").selectOption("value_asc");
  const sorted = await (await sortedResponse).json();
  await checkRows(sorted);

  const nextResponse = queryResponse(page);
  await table.getByRole("button", { name: "다음", exact: true }).click();
  const next = await (await nextResponse).json();
  const nextWidget = next.widgets.find((item: any) => item.type === "table");
  expect(nextWidget.page).toBe(2);
  expect(nextWidget.total_value).toBe(initial.widgets.find((item: any) => item.type === "table").total_value);
  await checkRows(next);
});

test("aging and holder charts match the active query including filtered and empty results", async ({ page }) => {
  const initial = await openInventory(page);
  const aging = page.getByRole("region", { name: "재고 기간별 현황" });
  const holders = page.getByRole("region", { name: "보유처별 재고 보유 현황" });
  const check = async (result: any) => {
    await expect(aging.locator(".aging-label")).toHaveText(["0~29일", "30~59일", "60~89일", "90일 이상"]);
    const counts = ["count_0_to_29", "count_30_to_59", "count_60_to_89", "count_90_plus"].map(key => result.meta.aging[key]);
    await expect(aging.locator(".aging-count b")).toHaveText(counts.map(value => `${value.toLocaleString("ko-KR")}대`));
    expect(counts.reduce((sum, value) => sum + value, result.meta.aging.unavailable_count)).toBe(result.meta.row_count);
    await expect(holders.locator(".chart-row")).toHaveCount(result.meta.holders.length);
    expect(result.meta.holders.reduce((sum: number, item: any) => sum + item.value, 0)).toBe(result.meta.row_count);
    if (result.meta.holders.length) {
      await expect(holders.locator(".chart-count").first()).toHaveText(result.meta.holders[0].value.toLocaleString("ko-KR"));
      await expect(holders.locator(".chart-share").first()).toHaveText(new Intl.NumberFormat("ko-KR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(result.meta.holders[0].share));
    } else {
      await expect(holders.locator(".widget-empty")).toContainText("합계 0대");
    }
  };
  await check(initial);
  await holders.screenshot({ path: test.info().outputPath("holders.png"), style: ".inventory-page .filter-panel, .topbar, .app-sidebar { visibility: hidden !important; }" });
  await aging.screenshot({ path: test.info().outputPath("aging.png"), style: ".inventory-page .filter-panel, .topbar, .app-sidebar { visibility: hidden !important; }" });
  const filteredResponse = queryResponse(page);
  await page.locator("select[multiple]").first().selectOption({ label: "삼성전자(주)" });
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const filtered = await (await filteredResponse).json();
  expect(filtered.meta.row_count).toBeLessThan(initial.meta.row_count);
  await check(filtered);
  await page.locator('.date-range-controls input[type="date"]').nth(1).fill("2026-09-08");
  const emptyResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  await check(await (await emptyResponse).json());
  await page.setViewportSize({ width: 390, height: 844 });
  const resetResponse = queryResponse(page);
  await page.getByRole("button", { name: "기간·분류 초기화" }).click();
  await check(await (await resetResponse).json());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await holders.screenshot({ path: test.info().outputPath("holders-mobile.png"), style: ".inventory-page .filter-panel, .topbar, .app-sidebar { visibility: hidden !important; }" });
});
