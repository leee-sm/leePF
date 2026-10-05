import { defineEventHandler, getQuery } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/h3/dist/index.mjs';
import { z } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/zod/index.js';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { a as listChecklists } from '../../../_/babyService.mjs';
import '../../../_/nitro.mjs';
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
