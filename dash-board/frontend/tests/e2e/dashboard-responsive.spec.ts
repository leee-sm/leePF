import { expect, test } from "@playwright/test";

test("inventory dashboard controls fit desktop, tablet, and mobile viewports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
  await page.locator(".dashboard-card").filter({ hasText: "재고 현황" }).first().click();
  await expect(page.locator(".inventory-trend-card")).toBeVisible();

  for (const viewport of [
    { width: 1440, height: 900, name: "desktop" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 390, height: 844, name: "mobile" },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document, `${viewport.name} document width`).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole("button", { name: "대시보드", exact: true })).toBeVisible();
    await expect(page.locator('.date-range-controls input[type="date"]')).toHaveCount(2);
    await expect(page.locator('.date-range-controls input[type="date"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: "조회", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /CSV 내보내기/ })).toBeVisible();
    await expect(page.locator(".widget-card.widget-table .table-footer").first()).toBeVisible();
    if (viewport.name === "mobile") {
      const tableWrap = page.locator(".widget-card.widget-table .table-wrap").first();
      const tableWidth = await tableWrap.evaluate(element => ({ visible: element.clientWidth, content: element.scrollWidth }));
      expect(tableWidth.content).toBeGreaterThan(tableWidth.visible);
      const detailButton = page.locator(".widget-card.widget-table button", { hasText: "조건 선택" }).first();
      await detailButton.scrollIntoViewIfNeeded();
      await expect(detailButton).toBeInViewport();
    }
  }
});
