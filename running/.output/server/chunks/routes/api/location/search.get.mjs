import { c as defineEventHandler, g as getQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { a as searchAddress } from '../../../_/locationService.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';
import '../../../_/cache.mjs';

const querySchema = z.object({
  q: z.string().min(2)
});
const search_get = defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uAC80\uC0C9\uD560 \uB3C4\uB85C\uBA85\uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  try {
    return ok(await searchAddress(parsed.data.q));
  } catch (error) {
    console.error("[location/search]", error);
    return fail("LOCATION_SEARCH_FAILED", "\uC8FC\uC18C\uAC80\uC0C9 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  }
});

export { search_get as default };
//# sourceMappingURL=search.get.mjs.map
