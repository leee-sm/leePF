import { defineEventHandler, getRouterParam } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/h3/dist/index.mjs';
import { f as fail, o as ok } from '../../../../_/apiResponse.mjs';
import { g as getMarathon } from '../../../../_/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return fail("BAD_REQUEST", "\uB300\uD68C ID\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  const marathon = await getMarathon(id);
  if (!marathon) return fail("NOT_FOUND", "\uB300\uD68C \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  return ok(marathon);
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
