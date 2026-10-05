import { c as defineEventHandler, r as readBody } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { r as recommendRunningOutfit } from '../../../_/runningOutfitService.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';

const schema = z.object({
  temperature: z.number().nullable(),
  feelsLikeTemperature: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  precipitation: z.number().nullable().optional(),
  windSpeed: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  pm25: z.number().nullable().optional()
});
const outfit_post = defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uB0A0\uC528 \uC815\uBCF4 \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  return ok(recommendRunningOutfit(parsed.data));
});

export { outfit_post as default };
//# sourceMappingURL=outfit.post.mjs.map
