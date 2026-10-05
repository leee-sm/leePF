import { defineEventHandler, getQuery } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/h3/dist/index.mjs';
import { z } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/zod/index.js';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { l as listMarathons } from '../../../_/nitro.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/destr/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/hookable/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ofetch/dist/node.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/node-mock-http/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ufo/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/drivers/fs.mjs';
import 'file:///C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/@nuxt/nitro-server/dist/runtime/utils/cache-driver.js';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/ohash/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/klona/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/defu/dist/defu.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/scule/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/radix3/dist/index.mjs';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/@prisma/client/default.js';
import 'node:fs';
import 'node:url';
import 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/pathe/dist/index.mjs';

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
