import { c as defineEventHandler, g as getQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { a as listChecklists } from '../../../_/babyService.mjs';
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
  type: z.enum(["pregnancy", "baby"]).default("pregnancy")
});
const checklists_get = defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC720\uD615\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  return ok(await listChecklists(parsed.data.type));
});

export { checklists_get as default };
//# sourceMappingURL=checklists.get.mjs.map
