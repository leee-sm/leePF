import { c as defineEventHandler, e as getRouterParam, h as getMarathon } from '../../../../_/nitro.mjs';
import { f as fail, o as ok } from '../../../../_/apiResponse.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return fail("BAD_REQUEST", "\uB300\uD68C ID\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  const marathon = await getMarathon(id);
  if (!marathon) return fail("NOT_FOUND", "\uB300\uD68C \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  return ok(marathon);
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
