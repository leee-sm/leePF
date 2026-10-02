import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, role: "admin" | "user") {
  await page.goto("/");
  await page.getByRole("link", { name: role === "admin" ? "개발 관리자 로그인" : "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);
}

test("user login is authenticated and cannot open administrator routes", async ({ page }) => {
  const adminModules: string[] = [];
  page.on("request", request => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/src/Admin.tsx") || /\/assets\/Admin-[^/]+\.js$/.test(path)) adminModules.push(path);
  });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "개발 이용자 로그인" })).toBeVisible();
  await page.getByRole("link", { name: "개발 이용자 로그인" }).click();
  await expect(page).toHaveURL(/\/dashboards$/);

  const user = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
  expect(user.roles).toContain("ROLE_USER");
  expect(user.roles).not.toContain("ROLE_SYSTEM");
  await expect(page.getByRole("button", { name: "대시보드 관리", exact: true })).toHaveCount(0);

  await page.goto("/admin/dashboards");
  await expect(page.getByRole("heading", { name: "관리자 권한이 필요합니다" })).toBeVisible();
  expect(adminModules).toEqual([]);
});

test("administrator widget drawer supports focus, selection, Escape, and browser history", async ({ page }) => {
  const unusedMetadataRequests: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).pathname === "/api/admin/data-sources/inventory") unusedMetadataRequests.push(request.url());
  });
  await login(page, "admin");
  const admin = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
  expect(admin.roles).toContain("ROLE_SYSTEM");

  await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
  const dashboardRow = page.locator("tbody tr").filter({ hasText: "재고 현황" }).first();
  await expect(dashboardRow).toBeVisible();
  await dashboardRow.getByRole("button", { name: "편집" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboards\/[0-9a-f-]+\/edit$/);

  const trigger = page.getByRole("button", { name: /위젯 추가/ });
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  const placeholders = page.locator(".edit-grid .widget-placeholder");
  await expect.poll(() => placeholders.count()).toBeGreaterThan(0);
  const originalWidgetCount = await placeholders.count();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator(".widget-picker-close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "선택", exact: true }).last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".widget-picker-close")).toBeFocused();

  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.goForward();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "위젯 선택 닫기" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("button", { name: "선택", exact: true }).first().click();
  await expect(dialog).toBeHidden();
  await expect(placeholders).toHaveCount(originalWidgetCount + 1);
  await expect(placeholders.last()).toContainText("재고 수량 2");
  await expect(trigger).toBeFocused();
  expect(unusedMetadataRequests).toEqual([]);
});
