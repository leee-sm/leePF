import { c as defineEventHandler, p as prisma } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@prisma/client';
import 'node:url';

const health_get = defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "UP", database: "UP" };
  } catch {
    return { status: "DOWN", database: "DOWN" };
  }
});

export { health_get as default };
//# sourceMappingURL=health.get.mjs.map
