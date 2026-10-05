import { c as defineEventHandler, g as getQuery, l as listMarathons } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  region: z.string().trim().max(30).optional(),
  status: z.enum(["\uC811\uC218\uC911", "\uB9C8\uAC10", "\uC811\uC218\uC608\uC815"]).optional(),
  distance: z.enum(["10k", "half", "full"]).optional()
});
const index_get = defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uC870\uD68C \uC6D4 \uD615\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  return ok(await listMarathons(parsed.data));
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
