import { c as defineEventHandler, g as getQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { o as ok } from '../../../_/apiResponse.mjs';
import { l as listBenefits } from '../../../_/babyService.mjs';
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
  sido: z.string().optional(),
  sigungu: z.string().optional()
});
const benefits_get = defineEventHandler(async (event) => {
  const query = querySchema.parse(getQuery(event));
  return ok(await listBenefits(query.sido, query.sigungu));
});

export { benefits_get as default };
//# sourceMappingURL=benefits.get.mjs.map
