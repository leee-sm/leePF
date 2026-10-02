import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

type QueryResult = {
  meta: { row_count: number; snapshot_row_count?: number; comparison_date?: string | null; as_of_date?: string; inventory_history?: Array<{ as_of_date: string; row_count: number }> };
  widgets: Array<{ id: string; type: string; value?: number; total_value?: number; total?: number; rows?: unknown[] }>;
};

const isDashboardQuery = (url: string, method: string) =>
  method === "POST" && /\/api\/dashboards\/[^/]+\/query$/.test(new URL(url).pathname);

test("inventory query starts without waiting for model filter options", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
  let releaseModels!: () => void;
  const modelGate = new Promise<void>(resolve => { releaseModels = resolve; });
  let modelRequestStarted = false;
  let queryCount = 0;
  page.on("request", request => {
    if (isDashboardQuery(request.url(), request.method())) queryCount += 1;
  });
  await page.route("**/filter-options?*", async route => {
    if (new URL(route.request().url()).searchParams.get("filter_id") === "model") {
      modelRequestStarted = true;
      await modelGate;
    }
    await route.continue();
  });
  try {
    await page.getByRole("button", { name: /재고 현황/ }).click();
    await expect.poll(() => modelRequestStarted).toBe(true);
    await expect.poll(() => queryCount, { timeout: 3000 }).toBe(1);
  } finally {
    releaseModels();
  }
  await expect(page.locator(".widget-table").first()).toBeVisible();
  await expect(page.locator('select[multiple]').nth(1)).toBeEnabled();
  expect(queryCount).toBe(1);
});

test("filter lookup keeps widgets mounted and table controls refresh only their table", async ({ page }) => {
  const queryRequests: Array<{ url: string; body: any }> = [];
  const documentRequests: string[] = [];

  page.on("request", request => {
    if (isDashboardQuery(request.url(), request.method())) {
      queryRequests.push({ url: request.url(), body: request.postDataJSON() });
    }
    if (request.resourceType() === "document") documentRequests.push(request.url());
  });

  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);

  const initialQueryResponse = page.waitForResponse(response =>
    isDashboardQuery(response.url(), response.request().method()),
  );
  await page.getByRole("button", { name: /재고 현황/ }).click();
  const initialResponse = await initialQueryResponse;
  expect(initialResponse.status()).toBe(200);
  const initialResult = (await initialResponse.json()) as QueryResult;
  expect(initialResult.meta.inventory_history?.map(point => point.as_of_date)).toEqual([
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
  ]);
  expect(initialResult.meta.inventory_history?.[0]?.row_count).toBe(0);
  await expect(page.locator(".trend-date-list > span")).toHaveCount(3);
  await expect(page.locator(".widget-grid .widget-card")).toHaveCount(initialResult.widgets.length);
  const metric = page.locator('.widget-card.widget-metric').first();
  const initialMetric = await metric.locator('.metric-value').innerText();

  const manufacturerSelect = page.locator('select[multiple]').first();
  const modelSelect = page.locator('select[multiple]').nth(1);
  await expect(manufacturerSelect.locator('option[value=""]')).toHaveText('전체');
  await expect(manufacturerSelect.locator('option[value=""]')).toHaveJSProperty('selected', true);
  const initialModelCount = await modelSelect.locator('option:not([value=""])').count();
  const manufacturer = await manufacturerSelect.locator('option:not([value=""])').first().getAttribute("value");
  expect(manufacturer).toBeTruthy();
  const narrowedModelsResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/filter-options') &&
    new URL(response.url()).searchParams.get('filter_id') === 'model' &&
    new URL(response.url()).searchParams.getAll('manufacturer').includes(manufacturer!),
  );
  await manufacturerSelect.selectOption(manufacturer!);
  expect((await narrowedModelsResponse).status()).toBe(200);
  await expect.poll(() => modelSelect.locator('option:not([value=""])').count()).toBeLessThan(initialModelCount);
  await expect(modelSelect.locator('option[value=""]')).toHaveJSProperty('selected', true);

  await page.route("**/api/dashboards/*/query", async route => {
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.continue();
  });

  const queryCountBeforeClick = queryRequests.length;
  const documentCountBeforeClick = documentRequests.length;
  const filteredQueryResponse = page.waitForResponse(response =>
    isDashboardQuery(response.url(), response.request().method()),
  );
  await page.getByRole("button", { name: "조회", exact: true }).click();

  await expect(page.getByText("조건에 맞는 재고를 조회하고 있습니다…")).toBeVisible();
  await expect(page.locator(".widget-grid .widget-card")).toHaveCount(initialResult.widgets.length);
  await expect(metric).toHaveAttribute("aria-busy", "true");
  await expect(metric.locator('.metric-value')).toHaveText(initialMetric);

  const filteredResponse = await filteredQueryResponse;
  expect(filteredResponse.status()).toBe(200);
  const filteredResult = (await filteredResponse.json()) as QueryResult;

  expect(queryRequests).toHaveLength(queryCountBeforeClick + 1);
  expect(queryRequests.at(-1)?.body.filters.manufacturer).toContain(manufacturer);
  expect(filteredResult.widgets.map(widget => widget.id).sort()).toEqual(
    initialResult.widgets.map(widget => widget.id).sort(),
  );
  expect(filteredResult.meta.row_count).toBeLessThan(initialResult.meta.row_count);
  expect(documentRequests).toHaveLength(documentCountBeforeClick);
  await expect(page.locator(".widget-grid .widget-card")).toHaveCount(filteredResult.widgets.length);
  await expect(metric).toHaveAttribute("aria-busy", "false");
  await expect(metric.locator('.metric-value')).not.toHaveText(initialMetric);

  const modelValue = await modelSelect.locator('option:not([value=""])').first().getAttribute("value");
  expect(modelValue).toBeTruthy();
  await modelSelect.selectOption(modelValue!);
  const modelQueryResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const modelResult = (await (await modelQueryResponse).json()) as QueryResult;
  expect(queryRequests.at(-1)?.body.filters.manufacturer).toContain(manufacturer);
  expect(queryRequests.at(-1)?.body.filters.model).toEqual([modelValue]);
  expect(modelResult.meta.row_count).toBeGreaterThan(0);
  expect(modelResult.meta.row_count).toBeLessThanOrEqual(filteredResult.meta.row_count);

  const table = page.locator('.widget-card.widget-table').first();
  const tableId = await table.getAttribute('data-widget-id');
  expect(tableId).toBeTruthy();
  const metricAfterFilter = await metric.locator('.metric-value').innerText();
  const tableQueryResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await table.getByRole('combobox').selectOption('label_asc');
  await expect(table).toHaveAttribute('aria-busy', 'true');
  await expect(metric).toHaveAttribute('aria-busy', 'false');
  const tableResponse = await tableQueryResponse;
  expect(tableResponse.status()).toBe(200);
  const tableResult = (await tableResponse.json()) as QueryResult;
  expect(tableResult.widgets.map(widget => widget.id)).toEqual([tableId]);
  expect(queryRequests.at(-1)?.body.widget_ids).toEqual([tableId]);
  await expect(table).toHaveAttribute('aria-busy', 'false');
  await expect(metric.locator('.metric-value')).toHaveText(metricAfterFilter);
  expect(documentRequests).toHaveLength(documentCountBeforeClick);

  const allModelsResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/filter-options') &&
    new URL(response.url()).searchParams.get('filter_id') === 'model' &&
    !new URL(response.url()).searchParams.has('manufacturer'),
  );
  await manufacturerSelect.selectOption('');
  expect((await allModelsResponse).status()).toBe(200);
  await expect(manufacturerSelect.locator('option[value=""]')).toHaveJSProperty('selected', true);
  await expect.poll(() => modelSelect.locator('option:not([value=""])').count()).toBe(initialModelCount);
  await modelSelect.selectOption("");
  const allQueryResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole('button', { name: '조회', exact: true }).click();
  expect((await allQueryResponse).status()).toBe(200);
  expect(queryRequests.at(-1)?.body.filters.manufacturer).toEqual([]);
  expect(queryRequests.at(-1)?.body.filters.model).toEqual([]);
  await expect(metric.locator('.metric-value')).toHaveText(initialMetric);

  const chartChoice = page.locator('.widget-bar .chart-choice').first();
  const chartLabel = await chartChoice.locator('.chart-label').innerText();
  const queryCountBeforeChart = queryRequests.length;
  const chartModelOptionsResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/filter-options') &&
    new URL(response.url()).searchParams.get('filter_id') === 'model' &&
    new URL(response.url()).searchParams.getAll('manufacturer').includes(chartLabel),
  );
  const chartQueryResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await chartChoice.click();
  expect((await chartModelOptionsResponse).status()).toBe(200);
  const chartResult = (await (await chartQueryResponse).json()) as QueryResult;
  expect(queryRequests).toHaveLength(queryCountBeforeChart + 1);
  await expect(page.locator('.changed-tag')).not.toBeVisible();
  expect(queryRequests.at(-1)?.body.filters.manufacturer).toEqual([chartLabel]);
  await expect(page.locator('.scope-pill')).toContainText(`제조사: ${chartLabel}`);
  expect(chartResult.widgets.find(widget => widget.type === 'metric')?.value).toBe(chartResult.meta.row_count);

  const queryCountBeforeTableChoice = queryRequests.length;
  const tableModelOptionsResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/filter-options') &&
    new URL(response.url()).searchParams.get('filter_id') === 'model' &&
    new URL(response.url()).searchParams.has('manufacturer'),
  );
  const tableDrillQueryResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.locator('.widget-table button', { hasText: '조건 선택' }).first().click();
  expect((await tableModelOptionsResponse).status()).toBe(200);
  const tableDrillResult = (await (await tableDrillQueryResponse).json()) as QueryResult;
  expect(queryRequests).toHaveLength(queryCountBeforeTableChoice + 1);
  expect(queryRequests.at(-1)?.body.filters.manufacturer).toHaveLength(1);
  expect(queryRequests.at(-1)?.body.filters.model).toHaveLength(1);
  expect(tableDrillResult.widgets.find(widget => widget.type === 'metric')?.value).toBe(tableDrillResult.meta.row_count);
  expect(tableDrillResult.widgets.find(widget => widget.type === 'table')?.total_value).toBe(tableDrillResult.meta.row_count);
  await expect(page.locator('.scope-pill')).toContainText('모델:');

  const endDateInput = page.locator('.date-range-controls input[type="date"]').nth(1);
  await endDateInput.fill('2026-09-08');
  const zeroSnapshotResponse = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole('button', { name: '조회', exact: true }).click();
  const zeroSnapshot = (await (await zeroSnapshotResponse).json()) as QueryResult;
  expect(zeroSnapshot.meta.row_count).toBe(0);
  expect(zeroSnapshot.meta.snapshot_row_count).toBe(0);
  expect(zeroSnapshot.meta.comparison_date).toBeNull();
  await expect(page.getByText('종료일은 정상적인 0건 스냅샷입니다.')).toBeVisible();
  await expect(metric.locator('.metric-value')).toContainText('0');

  await endDateInput.fill('2026-09-09');
  const earlierDateQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const earlierDateResponse = await earlierDateQuery;
  expect(earlierDateResponse.status()).toBe(200);
  expect(queryRequests.at(-1)?.body.filters.as_of_date).toBe("2026-09-09");
  await expect(endDateInput).toHaveValue("2026-09-09");
  await expect(page.locator(".trend-date-list > span").filter({ hasText: "2026-09-09" })).toHaveClass(/selected/);

  await endDateInput.fill('2026-09-10');
  const latestDateQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const latestDateResponse = await latestDateQuery;
  expect(latestDateResponse.status()).toBe(200);
  const latestDateResult = (await latestDateResponse.json()) as QueryResult;
  expect(queryRequests.at(-1)?.body.filters.as_of_date).toBe("2026-09-10");
  await expect(endDateInput).toHaveValue("2026-09-10");

  const expectedFilters = queryRequests.at(-1)?.body.filters;
  const expectedTable = latestDateResult.widgets.find(widget => widget.type === "table");
  expect(expectedFilters?.manufacturer).toHaveLength(1);
  expect(expectedFilters?.model).toHaveLength(1);
  expect(expectedTable?.total).toBeGreaterThan(0);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /CSV 내보내기/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/2026-09-10\.csv$/);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const csv = await readFile(downloadPath!, "utf8");
  expect(csv).toContain(`"기준일","2026-09-10"`);
  expect(csv).toContain(`"제조사 필터","${expectedFilters!.manufacturer[0]}"`);
  expect(csv).toContain(`"모델 필터","${expectedFilters!.model[0]}"`);
  expect(csv).toContain(`"조회 재고","${latestDateResult.meta.row_count}대"`);
  expect(csv.split(/\r?\n/).filter(line => line.startsWith('"집계 표"'))).toHaveLength(expectedTable!.total!);

  const allModelOptionsResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/filter-options') &&
    new URL(response.url()).searchParams.get('filter_id') === 'model' &&
    !new URL(response.url()).searchParams.has('manufacturer'),
  );
  await manufacturerSelect.selectOption("");
  expect((await allModelOptionsResponse).status()).toBe(200);
  await expect.poll(() => modelSelect.locator('option:not([value=""])').count()).toBe(initialModelCount);
  await expect(modelSelect).toBeEnabled();
  await modelSelect.selectOption("");
  const unfilteredDateQuery = page.waitForResponse(response => isDashboardQuery(response.url(), response.request().method()));
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const unfilteredDateResult = (await (await unfilteredDateQuery).json()) as QueryResult;
  const unfilteredTable = unfilteredDateResult.widgets.find(widget => widget.type === "table");
  expect(queryRequests.at(-1)?.body.filters).toMatchObject({ as_of_date: "2026-09-10", manufacturer: [], model: [] });
  expect(unfilteredTable?.total).toBeGreaterThan(20);
  await expect(page.getByRole("button", { name: /CSV 내보내기/ })).toBeEnabled();
  const fullDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /CSV 내보내기/ }).click();
  const fullDownload = await fullDownloadEvent;
  const fullDownloadPath = await fullDownload.path();
  expect(fullDownloadPath).toBeTruthy();
  const fullCsv = await readFile(fullDownloadPath!, "utf8");
  expect(fullCsv).toContain('"제조사 필터","전체"');
  expect(fullCsv).toContain('"모델 필터","전체"');
  expect(fullCsv).toContain(`"조회 재고","${unfilteredDateResult.meta.row_count}대"`);
  expect(fullCsv.split(/\r?\n/).filter(line => line.startsWith('"집계 표"'))).toHaveLength(unfilteredTable!.total!);
  expect(fullCsv).toContain('"비고"');
  expect(fullCsv).toContain('"전체 4페이지"');
});
