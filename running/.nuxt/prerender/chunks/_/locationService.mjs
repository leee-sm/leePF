import { a as useRuntimeConfig, f as fetchJson } from './nitro.mjs';
import { z } from 'file://C:/Users/%EC%9D%B4%EC%83%81%EB%AF%BC/orca/leePF/running/node_modules/zod/index.js';
import { c as cached } from './cache.mjs';

const RE = 6371.00877;
const GRID = 5;
const SLAT1 = 30;
const SLAT2 = 60;
const OLON = 126;
const OLAT = 38;
const XO = 43;
const YO = 136;
const DEGRAD = Math.PI / 180;
function toKmaGrid(latitude, longitude) {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = longitude * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
  };
}

const kakaoAddressSchema = z.object({
  documents: z.array(
    z.object({
      address_name: z.string().optional(),
      x: z.string(),
      y: z.string(),
      road_address: z.record(z.unknown()).nullable().optional(),
      address: z.record(z.unknown()).nullable().optional()
    })
  )
});
const kakaoPlaceSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      place_name: z.string(),
      category_name: z.string().optional(),
      phone: z.string().optional(),
      address_name: z.string().optional(),
      road_address_name: z.string().optional(),
      x: z.string(),
      y: z.string(),
      distance: z.string().optional(),
      place_url: z.string().optional()
    })
  )
});
function requireKakaoKey() {
  const config = useRuntimeConfig();
  if (!config.kakaoRestApiKey) {
    throw new Error("Kakao REST API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  }
  return config.kakaoRestApiKey;
}
async function searchAddress(query) {
  const normalized = query.trim();
  if (normalized.length < 2) return [];
  const key = requireKakaoKey();
  return cached(`address:v2:${normalized}`, 60 * 60 * 24 * 14, async () => {
    const roadSpaced = normalized.replace(/\s*(대로|로|길)\s*(\d+(?:-\d+)?(?:\S*)?)$/u, "$1 $2");
    const queries = [.../* @__PURE__ */ new Set([
      normalized,
      roadSpaced,
      normalized.replace(/\s+/g, ""),
      normalized.replace(/(대로|로|길)\s*(\d+)/g, "$1 $2")
    ])];
    let parsed = { documents: [] };
    for (const candidate of queries) {
      const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
      url.searchParams.set("query", candidate);
      const json = await fetchJson(url.toString(), {
        headers: { Authorization: `KakaoAK ${key}` }
      });
      const result = kakaoAddressSchema.parse(json);
      parsed = result;
      if (result.documents.length) break;
    }
    return parsed.documents.map((item) => {
      const latitude = Number(item.y);
      const longitude = Number(item.x);
      const grid = toKmaGrid(latitude, longitude);
      const road = item.road_address;
      const address = item.address;
      return {
        roadAddress: String((road == null ? void 0 : road.address_name) || item.address_name || ""),
        latitude,
        longitude,
        sido: String((road == null ? void 0 : road.region_1depth_name) || (address == null ? void 0 : address.region_1depth_name) || ""),
        sigungu: String((road == null ? void 0 : road.region_2depth_name) || (address == null ? void 0 : address.region_2depth_name) || ""),
        eupMyeonDong: String((road == null ? void 0 : road.region_3depth_name) || (address == null ? void 0 : address.region_3depth_name) || ""),
        ...grid
      };
    });
  });
}
async function searchNearbyByCategory(categoryGroupCode, latitude, longitude, radiusMeters) {
  const key = requireKakaoKey();
  const safeRadius = Math.min(Math.max(radiusMeters, 100), 1e4);
  const cacheKey = `place:${categoryGroupCode}:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${safeRadius}`;
  return cached(cacheKey, 60 * 60 * 6, async () => {
    const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
    url.searchParams.set("category_group_code", categoryGroupCode);
    url.searchParams.set("x", String(longitude));
    url.searchParams.set("y", String(latitude));
    url.searchParams.set("radius", String(safeRadius));
    url.searchParams.set("sort", "distance");
    const json = await fetchJson(url.toString(), {
      headers: { Authorization: `KakaoAK ${key}` }
    });
    const parsed = kakaoPlaceSchema.parse(json);
    return parsed.documents.map((item) => ({
      id: item.id,
      name: item.place_name,
      address: item.address_name || "",
      roadAddress: item.road_address_name || "",
      latitude: Number(item.y),
      longitude: Number(item.x),
      distanceMeters: item.distance ? Number(item.distance) : null,
      phone: item.phone || null,
      category: item.category_name || null,
      url: item.place_url || null
    }));
  });
}

export { searchAddress as a, searchNearbyByCategory as s };
//# sourceMappingURL=locationService.mjs.map
