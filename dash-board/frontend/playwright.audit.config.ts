import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Separate output keeps the original suite's evidence when the audit runs next.
const phase = process.env.AUDIT_PHASE ?? "extended";
const root = process.env.AUDIT_OUTPUT_ROOT ?? "./test-results/flow-audit";
export default defineConfig({
  ...base,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: `${root}/${phase}/artifacts`,
  reporter: [
    ["list"],
    ["json", { outputFile: `${root}/${phase}/results.json` }],
    ["html", { outputFolder: `${root}/${phase}/html`, open: "never" }],
  ],
  use: {
    ...base.use,
    screenshot: "on",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
});
