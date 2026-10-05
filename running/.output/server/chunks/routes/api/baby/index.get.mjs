import { c as defineEventHandler, g as getQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { b as listChildcareWithOfficialData } from '../../../_/babyService.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';
import '../../../_/locationService.mjs';
import '../../../_/cache.mjs';

const querySchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  radius: z.coerce.number().default(3e3),
  sido: z.string().optional(),
  sigungu: z.string().optional()
});
const index_get = defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uC704\uCE58\uC640 \uBC18\uACBD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  try {
    return ok(await listChildcareWithOfficialData(parsed.data.lat, parsed.data.lon, parsed.data.radius, parsed.data.sido, parsed.data.sigungu));
  } catch {
    return fail("CHILDCARE_SEARCH_FAILED", "\uC8FC\uBCC0 \uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
