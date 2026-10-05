import { u as useRuntimeConfig, f as fetchJson, c as defineEventHandler, g as getQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { f as fail, o as ok } from '../../../_/apiResponse.mjs';
import { c as cached } from '../../../_/cache.mjs';
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

const itemSchema$1 = z.object({
  stationName: z.string().optional(),
  pm10Value: z.string().nullable().optional(),
  pm25Value: z.string().nullable().optional(),
  pm10Grade: z.string().nullable().optional(),
  pm25Grade: z.string().nullable().optional()
});
const responseSchema = z.object({
  response: z.object({
    body: z.object({ items: z.array(itemSchema$1).default([]) })
  })
});
function grade(value) {
  if (value === null) return null;
  if (value <= 30) return "\uC88B\uC74C";
  if (value <= 80) return "\uBCF4\uD1B5";
  if (value <= 150) return "\uB098\uC068";
  return "\uB9E4\uC6B0 \uB098\uC068";
}
async function getAirQuality(sido) {
  const config = useRuntimeConfig();
  if (!config.koreaAirDataKey || !sido) return null;
  return cached(`air:${sido}`, 60 * 30, async () => {
    const url = new URL("https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty");
    url.searchParams.set("serviceKey", config.koreaAirDataKey);
    url.searchParams.set("returnType", "json");
    url.searchParams.set("numOfRows", "100");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("sidoName", sido.replace("\uD2B9\uBCC4\uC790\uCE58\uB3C4", "").replace("\uD2B9\uBCC4\uC2DC", "").replace("\uAD11\uC5ED\uC2DC", ""));
    url.searchParams.set("ver", "1.3");
    const parsed = responseSchema.parse(await fetchJson(url.toString(), {}, 7e3));
    const rows = parsed.response.body.items;
    if (!rows.length) return null;
    const values = rows.map((item) => ({
      stationName: item.stationName || null,
      pm10: item.pm10Value && /^\d+$/.test(item.pm10Value) ? Number(item.pm10Value) : null,
      pm25: item.pm25Value && /^\d+$/.test(item.pm25Value) ? Number(item.pm25Value) : null,
      pm10Grade: item.pm10Grade || grade(item.pm10Value && /^\d+$/.test(item.pm10Value) ? Number(item.pm10Value) : null),
      pm25Grade: item.pm25Grade || grade(item.pm25Value && /^\d+$/.test(item.pm25Value) ? Number(item.pm25Value) : null)
    }));
    const valid = values.filter((item) => item.pm10 !== null || item.pm25 !== null);
    if (!valid.length) return null;
    const pm10Rows = valid.filter((item) => item.pm10 !== null);
    const pm25Rows = valid.filter((item) => item.pm25 !== null);
    const pm10 = pm10Rows.length ? Math.round(pm10Rows.reduce((sum, item) => sum + (item.pm10 || 0), 0) / pm10Rows.length) : null;
    const pm25 = pm25Rows.length ? Math.round(pm25Rows.reduce((sum, item) => sum + (item.pm25 || 0), 0) / pm25Rows.length) : null;
    return { stationName: valid[0].stationName, pm10, pm25, pm10Grade: grade(pm10), pm25Grade: grade(pm25) };
  });
}

const itemSchema = z.object({ category: z.string(), obsrValue: z.string().optional(), fcstValue: z.string().optional(), fcstDate: z.string().optional(), fcstTime: z.string().optional() });
function kstParts(date = /* @__PURE__ */ new Date()) {
  const value = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return { date: `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(value.getDate()).padStart(2, "0")}`, hour: value.getHours(), minute: value.getMinutes() };
}
function baseTime(hour, minute) {
  const times = [2, 5, 8, 11, 14, 17, 20, 23];
  const selected = [...times].reverse().find((time) => hour > time || hour === time && minute >= 10);
  return selected === void 0 ? "2300" : `${String(selected).padStart(2, "0")}00`;
}
async function callKma(path, params) {
  const config = useRuntimeConfig();
  const url = new URL(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/${path}`);
  url.searchParams.set("serviceKey", config.publicDataServiceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("dataType", "JSON");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const json = await fetchJson(url.toString(), {}, 7e3);
  return z.object({ response: z.object({ body: z.object({ items: z.object({ item: z.array(itemSchema).default([]) }) }) }) }).parse(json).response.body.items.item;
}
async function getRunningWeather(nx, ny, label, sido) {
  const config = useRuntimeConfig();
  if (!config.publicDataServiceKey) return { location: { label, nx, ny }, current: null, hourly: [], airQuality: null, outfit: recommendRunningOutfit({ temperature: null }), source: { name: "\uAE30\uC0C1\uCCAD \uACF5\uACF5\uB370\uC774\uD130\uD3EC\uD138", status: "API Key \uD544\uC694" } };
  const parts = kstParts();
  const key = `weather:${nx}:${ny}:${parts.date}:${parts.hour}`;
  return cached(key, 60 * 15, async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const currentItems = await callKma("getUltraSrtNcst", { base_date: parts.date, base_time: `${String(parts.hour).padStart(2, "0")}00`, nx: String(nx), ny: String(ny) });
    const current = Object.fromEntries(currentItems.map((item) => [item.category, Number(item.obsrValue)]));
    const forecastItems = await callKma("getVilageFcst", { base_date: parts.date, base_time: baseTime(parts.hour, parts.minute), nx: String(nx), ny: String(ny) });
    const groups = /* @__PURE__ */ new Map();
    forecastItems.forEach((item) => {
      const key2 = `${item.fcstDate}-${item.fcstTime}`;
      const row = groups.get(key2) || {};
      const value = Number(item.fcstValue);
      row[item.category] = Number.isFinite(value) ? value : null;
      groups.set(key2, row);
    });
    const hourly = [...groups.entries()].slice(0, 12).map(([time, row]) => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      return { time, temperature: (_a2 = row.TMP) != null ? _a2 : null, humidity: (_b2 = row.REH) != null ? _b2 : null, precipitation: (_c2 = row.PCP) != null ? _c2 : 0, precipitationProbability: (_d2 = row.POP) != null ? _d2 : null, windSpeed: (_e2 = row.WSD) != null ? _e2 : null, sky: (_f2 = row.SKY) != null ? _f2 : null };
    });
    const temperature = (_c = (_b = current.T1H) != null ? _b : (_a = hourly[0]) == null ? void 0 : _a.temperature) != null ? _c : null;
    let airQuality = null;
    try {
      airQuality = await getAirQuality(sido);
    } catch {
      airQuality = null;
    }
    return { location: { label, nx, ny }, current: { temperature, humidity: (_d = current.REH) != null ? _d : null, precipitation: (_e = current.RN1) != null ? _e : 0, windSpeed: (_f = current.WSD) != null ? _f : null, feelsLikeTemperature: temperature, pm10: (_g = airQuality == null ? void 0 : airQuality.pm10) != null ? _g : null, pm25: (_h = airQuality == null ? void 0 : airQuality.pm25) != null ? _h : null }, hourly, airQuality, outfit: recommendRunningOutfit({ temperature, feelsLikeTemperature: temperature, humidity: (_i = current.REH) != null ? _i : null, precipitation: (_j = current.RN1) != null ? _j : 0, windSpeed: (_k = current.WSD) != null ? _k : null, pm10: (_l = airQuality == null ? void 0 : airQuality.pm10) != null ? _l : null, pm25: (_m = airQuality == null ? void 0 : airQuality.pm25) != null ? _m : null }), source: { name: "\uAE30\uC0C1\uCCAD\xB7\uC5D0\uC5B4\uCF54\uB9AC\uC544 \uACF5\uACF5\uB370\uC774\uD130\uD3EC\uD138", status: "\uC815\uC0C1" } };
  });
}

const querySchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  nx: z.coerce.number().optional(),
  ny: z.coerce.number().optional(),
  label: z.string().optional(),
  sido: z.string().optional()
});
const weather_get = defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) return fail("BAD_REQUEST", "\uC704\uCE58 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  const config = useRuntimeConfig();
  if (!config.publicDataServiceKey) {
    return fail("PUBLIC_DATA_KEY_MISSING", "\uAE30\uC0C1\uCCAD \uACF5\uACF5\uB370\uC774\uD130 API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  }
  if (parsed.data.nx === void 0 || parsed.data.ny === void 0) return fail("GRID_REQUIRED", "\uC8FC\uC18C\uB97C \uB2E4\uC2DC \uC120\uD0DD\uD574 \uAE30\uC0C1\uCCAD \uACA9\uC790 \uC88C\uD45C\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  try {
    return ok(await getRunningWeather(parsed.data.nx, parsed.data.ny, parsed.data.label || "\uC120\uD0DD \uC704\uCE58", parsed.data.sido));
  } catch {
    return fail("WEATHER_UNAVAILABLE", "\uB0A0\uC528 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
  }
});

export { weather_get as default };
//# sourceMappingURL=weather.get.mjs.map
