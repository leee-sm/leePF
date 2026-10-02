import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const queryResponse = (page: Page) => page.waitForResponse(response =>
  response.request().method() === "POST" && /\/api\/dashboards\/[^/]+\/query$/.test(new URL(response.url()).pathname),
);

test("aging selection filters inventory value, restores history, and exports the applied scope", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  const initialResponse = queryResponse(page);
  await page.getByRole("button", { name: /재고 현황/ }).click();
  const initial = await (await initialResponse).json();
  const amount = page.getByRole("region", { name: "총 단말기 금액" });
  const period = page.getByRole("combobox", { name: "재고 기간", exact: true });
  const checkAmount = async (result: any) => {
    const pricing = result.meta.pricing;
    await expect(amount.locator("strong")).toHaveText(pricing.total_amount == null ? "금액 확인 불가" : `${pricing.total_amount.toLocaleString("ko-KR")}원`);
    await expect(amount).toContainText(`가격 등록 ${pricing.priced_count.toLocaleString("ko-KR")}대`);
    await expect(amount).toContainText(`가격 미등록·판정 불가 ${pricing.unpriced_count.toLocaleString("ko-KR")}대`);
    expect(pricing.priced_count + pricing.unpriced_count).toBe(result.meta.row_count);
  };
  await checkAmount(initial);
  const aging = page.getByRole("region", { name: "재고 기간별 현황" });
  const amountBox = (await amount.boundingBox())!;
  const agingBox = (await aging.boundingBox())!;
  expect(amountBox.y).toBeCloseTo(agingBox.y, 0);
  expect(amountBox.x + amountBox.width).toBeLessThan(agingBox.x);
  await page.locator(".inventory-value-aging-grid").screenshot({ path: test.info().outputPath("value-aging-desktop.png"), style: ".inventory-page .filter-panel, .topbar, .app-sidebar { visibility: hidden !important; }" });
  const agedResponse = queryResponse(page);
  await page.getByRole("button", { name: "90일 이상 재고 조회", exact: true }).click();
  const aged = await agedResponse;
  expect(aged.request().postDataJSON().filters.aging_bucket).toBe("90_plus");
  const agedResult = await aged.json();
  expect(agedResult.meta.row_count).toBe(initial.meta.aging.count_90_plus);
  await expect(period).toHaveValue("90_plus");
  await expect(page.getByRole("button", { name: "90일 이상 재고 조회", exact: true })).toHaveAttribute("aria-pressed", "true");
  await checkAmount(agedResult);

  const backResponse = queryResponse(page);
  await page.goBack();
  await backResponse;
  await expect(period).toHaveValue("");
  await checkAmount(initial);
  const forwardResponse = queryResponse(page);
  await page.goForward();
  await forwardResponse;
  await expect(period).toHaveValue("90_plus");
  await checkAmount(agedResult);

  const manufacturer = page.locator("select[multiple]").first();
  await manufacturer.selectOption({ label: "삼성전자(주)" });
  const filteredResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const filtered = await (await filteredResponse).json();
  expect(filtered.meta.row_count).toBeLessThan(agedResult.meta.row_count);
  await checkAmount(filtered);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓ CSV 내보내기", exact: true }).click();
  const download = await downloadEvent;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain('"재고 기간 필터","90일 이상"');
  expect(csv).toContain(`"총 단말기 금액 (등록 가격 합계)","${filtered.meta.pricing.total_amount}원"`);

  await period.selectOption("30_to_59");
  const periodResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  const periodResult = await (await periodResponse).json();
  expect(periodResult.meta.row_count).toBe(periodResult.meta.aging.count_30_to_59);
  await checkAmount(periodResult);
  const resetResponse = queryResponse(page);
  await page.getByRole("button", { name: "기간·분류 초기화" }).click();
  await resetResponse;
  await expect(period).toHaveValue("");
  await checkAmount(initial);

  await page.locator('.date-range-controls input[type="date"]').nth(1).fill("2026-09-08");
  const emptyResponse = queryResponse(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();
  await checkAmount(await (await emptyResponse).json());
  await expect(amount.locator("strong")).toHaveText("0원");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const mobileAmountBox = (await amount.boundingBox())!;
  const mobileAgingBox = (await aging.boundingBox())!;
  expect(mobileAmountBox.y + mobileAmountBox.height).toBeLessThan(mobileAgingBox.y);
  await page.locator(".inventory-value-aging-grid").screenshot({ path: test.info().outputPath("value-aging-mobile.png"), style: ".inventory-page .filter-panel, .topbar, .app-sidebar { visibility: hidden !important; }" });
});
