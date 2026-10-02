import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5180";
const output = process.env.PERF_OUTPUT ?? "/tmp/hotspots.json";
const samples = [];
const browser = await chromium.launch();
try {
  for (const role of ["user", "admin"]) {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await session.send("Performance.enable");
      await page.goto(baseURL);
      await page.getByRole("link", { name: role === "user" ? "개발 이용자 로그인" : "개발 관리자 로그인" }).click();
      await page.locator(".dashboard-card").first().waitFor();
      if (role === "admin") {
        await page.getByRole("button", { name: "대시보드 관리", exact: true }).click();
        await page.locator("tbody tr").filter({ hasText: "재고 현황" }).first().waitFor();
      }
      const requests = [];
      page.on("requestfinished", request => {
        if (new URL(request.url()).pathname.startsWith("/api/")) {
          requests.push({ path: new URL(request.url()).pathname, method: request.method(), durationMs: request.timing().responseEnd });
        }
      });
      const metrics = async () => Object.fromEntries((await session.send("Performance.getMetrics")).metrics.map(item => [item.name, item.value]));
      const before = await metrics();
      const start = performance.now();
      await page.evaluate(() => {
        document.addEventListener("click", () => { window.__hotspotClickAt = performance.now(); }, { once: true, capture: true });
      });
      if (role === "user") {
        await page.getByRole("button", { name: /재고 현황/ }).click();
        await page.locator(".widget-table").first().waitFor();
      } else {
        await page.locator("tbody tr").filter({ hasText: "재고 현황" }).first().getByRole("button", { name: "편집", exact: true }).click();
        await page.locator(".edit-grid .widget-placeholder").first().waitFor();
      }
      const automationElapsedMs = performance.now() - start;
      const visibleMs = await page.evaluate(() => performance.now() - window.__hotspotClickAt);
      if (role === "admin") {
        await page.locator('.filter-edit select[multiple] option').first().waitFor({ state: "attached" });
      }
      const readyMs = await page.evaluate(() => performance.now() - window.__hotspotClickAt);
      const after = await metrics();
      samples.push({ role, iteration, visibleMs, readyMs, automationElapsedMs, scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000, taskMs: (after.TaskDuration - before.TaskDuration) * 1000, requests });
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = Object.fromEntries(["user", "admin"].map(role => {
  const rows = samples.filter(sample => sample.role === role);
  return [role, { samples: rows.length, visibleMedianMs: median(rows.map(row => row.visibleMs)), readyMedianMs: median(rows.map(row => row.readyMs)), scriptMedianMs: median(rows.map(row => row.scriptMs)), taskMedianMs: median(rows.map(row => row.taskMs)), apiRequestsMedian: median(rows.map(row => row.requests.length)), sourceMetadataRequestsMedian: median(rows.map(row => row.requests.filter(request => request.path === "/api/admin/data-sources/inventory").length)), slowestRequests: [...rows.flatMap(row => row.requests)].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5) }];
}));
await mkdir(output.slice(0, output.lastIndexOf("/")), { recursive: true });
await writeFile(output, JSON.stringify({ baseURL, cpuThrottle: 4, summary, samples }, null, 2));
console.log(JSON.stringify(summary, null, 2));
