import { defineEventHandler, readBody } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/h3/dist/index.mjs';
import { z } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/zod/index.js';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';

const distances = {
  "10k": { label: "10km", km: 10, meters: 1e4 },
  half: { label: "Half", km: 21.0975, meters: 21097.5 },
  full: { label: "Full", km: 42.195, meters: 42195 }
};
function parseHms(hours, minutes, seconds) {
  if ([hours, minutes, seconds].some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error("\uC2DC\uAC04\uC740 0 \uC774\uC0C1\uC758 \uC815\uC218\uB85C \uC785\uB825\uD574\uC57C \uD569\uB2C8\uB2E4.");
  }
  if (minutes >= 60 || seconds >= 60) {
    throw new Error("\uBD84\uACFC \uCD08\uB294 0~59 \uC0AC\uC774\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  }
  const total = hours * 3600 + minutes * 60 + seconds;
  if (total <= 0) throw new Error("\uBAA9\uD45C\uC2DC\uAC04\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  return total;
}
function formatHms(totalSeconds) {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor(rounded % 3600 / 60);
  const seconds = rounded % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
function formatPace(secondsPerKm) {
  const rounded = Math.round(secondsPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}
function calculatePace(distanceType, targetSeconds) {
  const distance = distances[distanceType];
  if (!distance) throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAC70\uB9AC\uC785\uB2C8\uB2E4.");
  const paceSecondsPerKm = Math.round(targetSeconds / distance.km);
  const splits = [];
  const wholeKm = Math.floor(distance.km);
  for (let km = 1; km <= wholeKm; km += 1) {
    splits.push({
      distanceKm: km,
      paceText: formatPace(paceSecondsPerKm),
      elapsedText: formatHms(targetSeconds * km / distance.km)
    });
  }
  if (distance.km !== wholeKm) {
    splits.push({
      distanceKm: distance.km,
      paceText: formatPace(paceSecondsPerKm),
      elapsedText: formatHms(targetSeconds)
    });
  }
  return {
    distanceType,
    distanceKm: distance.km,
    targetSeconds,
    targetTime: formatHms(targetSeconds),
    paceSecondsPerKm,
    paceText: formatPace(paceSecondsPerKm),
    splits
  };
}
async function savePaceLookup(result) {
  const { prisma } = await import('../../../_/nitro.mjs').then(function (n) { return n.e; });
  await prisma.runPace.create({
    data: {
      distanceType: result.distanceType,
      distanceKm: result.distanceKm,
      targetSeconds: result.targetSeconds,
      paceSecondsPerKm: result.paceSecondsPerKm,
      targetTime: result.targetTime,
      paceText: result.paceText
    }
  });
}

const bodySchema = z.object({
  distanceType: z.enum(["10k", "half", "full"]),
  hours: z.number().int().min(0).max(99),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59)
});
const pace_post = defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uAC70\uB9AC\uC640 \uBAA9\uD45C\uC2DC\uAC04\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  try {
    const targetSeconds = parseHms(parsed.data.hours, parsed.data.minutes, parsed.data.seconds);
    const result = calculatePace(parsed.data.distanceType, targetSeconds);
    await savePaceLookup(result);
    return ok(result);
  } catch (error) {
    return fail("PACE_CALCULATION_FAILED", error instanceof Error ? error.message : "\uD398\uC774\uC2A4 \uACC4\uC0B0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
  }
});

export { pace_post as default };
//# sourceMappingURL=pace.post.mjs.map
