import { a as useRuntimeConfig, f as fetchJson, p as prisma } from './nitro.mjs';
import { s as searchNearbyByCategory } from './locationService.mjs';
import { c as cached } from './cache.mjs';

function rows(payload) {
  var _a, _b, _c, _d, _e;
  const value = (_c = (_b = (_a = payload == null ? void 0 : payload.kinderInfo) != null ? _a : payload == null ? void 0 : payload.data) != null ? _b : payload == null ? void 0 : payload.items) != null ? _c : [];
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object");
  if (value && typeof value === "object") {
    const nested = (_e = (_d = value.list) != null ? _d : value.item) != null ? _e : value.items;
    if (Array.isArray(nested)) return nested.filter((item) => item && typeof item === "object");
    return [value];
  }
  return [];
}
function text(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== void 0 && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}
function number(row, ...keys) {
  const value = text(row, ...keys);
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
function sum(row, ...keys) {
  const values = keys.map((key) => number(row, key)).filter((value) => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}
function normalize(value) {
  return value.replace(/\s+/g, "").replace(/[()·-]/g, "").toLowerCase();
}
const SEOUL_DISTRICT_CODES = {
  "\uC885\uB85C\uAD6C": "11110",
  "\uC911\uAD6C": "11140",
  "\uC6A9\uC0B0\uAD6C": "11170",
  "\uC131\uB3D9\uAD6C": "11200",
  "\uAD11\uC9C4\uAD6C": "11215",
  "\uB3D9\uB300\uBB38\uAD6C": "11230",
  "\uC911\uB791\uAD6C": "11260",
  "\uC131\uBD81\uAD6C": "11290",
  "\uAC15\uBD81\uAD6C": "11305",
  "\uB3C4\uBD09\uAD6C": "11320",
  "\uB178\uC6D0\uAD6C": "11350",
  "\uC740\uD3C9\uAD6C": "11380",
  "\uC11C\uB300\uBB38\uAD6C": "11410",
  "\uB9C8\uD3EC\uAD6C": "11440",
  "\uC591\uCC9C\uAD6C": "11470",
  "\uAC15\uC11C\uAD6C": "11500",
  "\uAD6C\uB85C\uAD6C": "11530",
  "\uAE08\uCC9C\uAD6C": "11545",
  "\uC601\uB4F1\uD3EC\uAD6C": "11560",
  "\uB3D9\uC791\uAD6C": "11590",
  "\uAD00\uC545\uAD6C": "11620",
  "\uC11C\uCD08\uAD6C": "11650",
  "\uAC15\uB0A8\uAD6C": "11680",
  "\uC1A1\uD30C\uAD6C": "11710",
  "\uAC15\uB3D9\uAD6C": "11740"
};
function codes(sido, sigungu) {
  if (!(sido == null ? void 0 : sido.includes("\uC11C\uC6B8"))) return null;
  const district = Object.keys(SEOUL_DISTRICT_CODES).find((name) => sigungu == null ? void 0 : sigungu.includes(name));
  return district ? { sidoCode: "11", sggCode: SEOUL_DISTRICT_CODES[district] } : null;
}
async function getOfficialKindergartens(sido, sigungu) {
  const config = useRuntimeConfig();
  const region = codes(sido, sigungu);
  if (!config.publicBabyDataKey || !region) return [];
  return cached(`kindergarten:official:${region.sidoCode}:${region.sggCode}`, 60 * 60 * 24, async () => {
    const baseParams = { key: config.publicBabyDataKey, sidoCode: region.sidoCode, sggCode: region.sggCode, pageCnt: "500", currentPage: "1" };
    const urls = [
      "https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do",
      "https://e-childschoolinfo.moe.go.kr/api/notice/afterSchoolPresent.do",
      "https://e-childschoolinfo.moe.go.kr/api/notice/building.do",
      "https://e-childschoolinfo.moe.go.kr/api/notice/classArea.do"
    ].map((endpoint) => {
      const url = new URL(endpoint);
      Object.entries(baseParams).forEach(([key, value]) => url.searchParams.set(key, value));
      return url;
    });
    const [basic, after, building, classArea] = await Promise.all(urls.map((url) => fetchJson(url.toString(), {}, 8e3)));
    const byCode = (payload) => new Map(rows(payload).map((item) => [text(item, "kinderCode") || "", item]));
    const afterRows = byCode(after);
    const buildingRows = byCode(building);
    const classRows = byCode(classArea);
    return rows(basic).map((item) => {
      var _a;
      const code = text(item, "kinderCode");
      const extra = afterRows.get(code || "") || {};
      const buildingInfo = buildingRows.get(code || "") || {};
      const classInfo = classRows.get(code || "") || {};
      return {
        code,
        name: text(item, "kindername", "kinderName", "name"),
        type: text(item, "establish", "establishType"),
        address: text(item, "addr", "address", "rdAddr"),
        phone: text(item, "telno", "tel"),
        homepage: text(item, "hpaddr", "homepage"),
        operationTime: text(extra, "oper_time", "operTime") || text(item, "opertime"),
        capacity: number(item, "prmstfcnt"),
        currentEnrollment: (_a = sum(item, "ppcnt3", "ppcnt4", "ppcnt5", "mixppcnt", "shppcnt")) != null ? _a : sum(extra, "inor_ptcn_kpcnt", "pm_rrgn_ptcn_kpcnt"),
        staffCount: sum(extra, "fxrl_thcnt", "shcnt_thcnt", "incnt", "cce_tcr_cnt", "etc_thts_cnt"),
        buildingYear: number(buildingInfo, "archyy"),
        floorCount: number(buildingInfo, "floorcnt"),
        buildingArea: number(buildingInfo, "bldgprusarea"),
        landArea: number(buildingInfo, "grottar"),
        classroomCount: number(classInfo, "crcnt"),
        classroomArea: number(classInfo, "clsrarea"),
        playgroundArea: number(classInfo, "phgrindrarea"),
        sourceName: "\uAD50\uC721\uBD80 \uC720\uCE58\uC6D0\uC54C\uB9AC\uBBF8 Open API",
        sourceUrl: "https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do"
      };
    });
  });
}
function matchOfficialKindergarten(name, official) {
  const target = normalize(name);
  return official.find((item) => {
    if (!item.name) return false;
    const candidate = normalize(item.name);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  }) || null;
}

async function listBenefits(sido, sigungu) {
  const benefits = await prisma.babyBenefit.findMany({
    where: {
      OR: [
        { regionSido: null, regionSigungu: null },
        ...sido ? [{ regionSido: sido, regionSigungu: null }, ...sigungu ? [{ regionSido: sido, regionSigungu: sigungu }] : []] : []
      ]
    },
    orderBy: [{ regionSido: "asc" }, { regionSigungu: "asc" }, { title: "asc" }],
    take: 100
  });
  const seen = /* @__PURE__ */ new Set();
  return benefits.filter((item) => {
    const key = `${item.title}:${item.officialUrl || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item) => {
    var _a, _b, _c, _d;
    return {
      id: String(item.id),
      title: item.title,
      regionSido: item.regionSido,
      regionSigungu: item.regionSigungu,
      content: item.content,
      amount: item.amount,
      target: item.target,
      applyMethod: item.applyMethod,
      agency: item.agency,
      officialUrl: item.officialUrl,
      sourceName: item.sourceName,
      effectiveDate: (_b = (_a = item.effectiveDate) == null ? void 0 : _a.toISOString().slice(0, 10)) != null ? _b : null,
      updatedSourceAt: (_d = (_c = item.updatedSourceAt) == null ? void 0 : _c.toISOString().slice(0, 10)) != null ? _d : null
    };
  });
}
async function listChecklists(type) {
  const rows = await prisma.babyChecklist.findMany({ where: { type, active: true }, orderBy: [{ weekFrom: "asc" }, { displayOrder: "asc" }] });
  return rows.map((item) => ({
    id: String(item.id),
    type: item.type,
    periodType: item.periodType,
    weekFrom: item.weekFrom,
    weekTo: item.weekTo,
    monthFrom: item.monthFrom,
    monthTo: item.monthTo,
    category: item.category,
    mandatory: item.mandatory,
    title: item.title,
    description: item.description,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl
  }));
}
async function listHospitals(latitude, longitude, radiusMeters) {
  const places = await searchNearbyByCategory("HP8", latitude, longitude, radiusMeters);
  return places.map((place) => ({ ...place, category: place.category || "\uBCD1\uC6D0", openStatus: "\uC601\uC5C5\uC2DC\uAC04 \uD655\uC778 \uD544\uC694" }));
}
async function listChildcareWithOfficialData(latitude, longitude, radiusMeters, sido, sigungu) {
  const places = await searchNearbyByCategory("PS3", latitude, longitude, radiusMeters);
  let official = [];
  try {
    official = await getOfficialKindergartens(sido, sigungu);
  } catch {
    official = [];
  }
  return places.filter((place) => place.name.includes("\uC5B4\uB9B0\uC774\uC9D1") || place.name.includes("\uC720\uCE58\uC6D0")).map((place) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const isKindergarten = place.name.includes("\uC720\uCE58\uC6D0");
    const matched = isKindergarten ? matchOfficialKindergarten(place.name, official) : null;
    return {
      ...place,
      facilityType: isKindergarten ? "\uC720\uCE58\uC6D0" : "\uC5B4\uB9B0\uC774\uC9D1",
      type: (matched == null ? void 0 : matched.type) || null,
      operatingStatus: matched ? "\uC6B4\uC601 \uC815\uBCF4 \uACF5\uAC1C" : null,
      capacity: (_a = matched == null ? void 0 : matched.capacity) != null ? _a : null,
      currentEnrollment: (_b = matched == null ? void 0 : matched.currentEnrollment) != null ? _b : null,
      staffCount: (_c = matched == null ? void 0 : matched.staffCount) != null ? _c : null,
      classroomCount: (_d = matched == null ? void 0 : matched.classroomCount) != null ? _d : null,
      classroomArea: (_e = matched == null ? void 0 : matched.classroomArea) != null ? _e : null,
      buildingArea: (_f = matched == null ? void 0 : matched.buildingArea) != null ? _f : null,
      floorCount: (_g = matched == null ? void 0 : matched.floorCount) != null ? _g : null,
      schoolBus: null,
      homepage: (matched == null ? void 0 : matched.homepage) || null,
      approvalDate: null,
      operationTime: (matched == null ? void 0 : matched.operationTime) || null,
      verificationStatus: matched ? matched.sourceName : "\uACF5\uC2DD \uC2DC\uC124 \uC0C1\uC138 API \uC5F0\uB3D9 \uD544\uC694",
      sourceUrl: (matched == null ? void 0 : matched.sourceUrl) || null,
      waitlist: "\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C",
      ageGroups: null
    };
  });
}

export { listChecklists as a, listChildcareWithOfficialData as b, listHospitals as c, listBenefits as l };
//# sourceMappingURL=babyService.mjs.map
