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

const robots_txt = defineEventHandler((event) => {
  const baseUrl = useRuntimeConfig(event).public.appBaseUrl;
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /*?*",
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join("\n");
});

export { robots_txt as default };
//# sourceMappingURL=robots.txt.mjs.map
