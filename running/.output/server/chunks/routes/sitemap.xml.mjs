import { c as defineEventHandler, u as useRuntimeConfig, i as setHeader } from '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';

const routes = [
  "/",
  "/running",
  "/running/weather",
  "/running/marathons",
  "/running/pace",
  "/baby",
  "/baby/benefits",
  "/baby/hospitals",
  "/baby/checklist",
  "/baby/childcare"
];
const sitemap_xml = defineEventHandler((event) => {
  const baseUrl = useRuntimeConfig(event).public.appBaseUrl.replace(/\/$/, "");
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${baseUrl}${route}</loc></url>`).join("")}</urlset>`;
});

export { sitemap_xml as default };
//# sourceMappingURL=sitemap.xml.mjs.map
