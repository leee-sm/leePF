import { cached } from '../utils/cache'
import { fetchJson } from '../utils/http'

type ApiRow = Record<string, unknown>

function rows(payload: any): ApiRow[] {
  const value = payload?.kinderInfo ?? payload?.data ?? payload?.items ?? []
  if (Array.isArray(value)) return value.filter((item): item is ApiRow => item && typeof item === 'object')
  if (value && typeof value === 'object') {
    const nested = value.list ?? value.item ?? value.items
    if (Array.isArray(nested)) return nested.filter((item): item is ApiRow => item && typeof item === 'object')
    return [value]
  }
  return []
}

function text(row: ApiRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return null
}

function number(row: ApiRow, ...keys: string[]) {
  const value = text(row, ...keys)
  if (!value) return null
  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function sum(row: ApiRow, ...keys: string[]) {
  const values = keys.map((key) => number(row, key)).filter((value): value is number => value !== null)
  return values.length ? values.reduce((total, value) => total + value, 0) : null
}

function normalize(value: string) {
  return value.replace(/\s+/g, '').replace(/[()·-]/g, '').toLowerCase()
}

const SEOUL_DISTRICT_CODES: Record<string, string> = {
  '\uC885\uB85C\uAD6C': '11110', '\uC911\uAD6C': '11140', '\uC6A9\uC0B0\uAD6C': '11170', '\uC131\uB3D9\uAD6C': '11200',
  '\uAD11\uC9C4\uAD6C': '11215', '\uB3D9\uB300\uBB38\uAD6C': '11230', '\uC911\uB791\uAD6C': '11260', '\uC131\uBD81\uAD6C': '11290',
  '\uAC15\uBD81\uAD6C': '11305', '\uB3C4\uBD09\uAD6C': '11320', '\uB178\uC6D0\uAD6C': '11350', '\uC740\uD3C9\uAD6C': '11380',
  '\uC11C\uB300\uBB38\uAD6C': '11410', '\uB9C8\uD3EC\uAD6C': '11440', '\uC591\uCC9C\uAD6C': '11470', '\uAC15\uC11C\uAD6C': '11500',
  '\uAD6C\uB85C\uAD6C': '11530', '\uAE08\uCC9C\uAD6C': '11545', '\uC601\uB4F1\uD3EC\uAD6C': '11560', '\uB3D9\uC791\uAD6C': '11590',
  '\uAD00\uC545\uAD6C': '11620', '\uC11C\uCD08\uAD6C': '11650', '\uAC15\uB0A8\uAD6C': '11680', '\uC1A1\uD30C\uAD6C': '11710', '\uAC15\uB3D9\uAD6C': '11740',
}

function codes(sido?: string, sigungu?: string) {
  if (!sido?.includes('\uC11C\uC6B8')) return null
  const district = Object.keys(SEOUL_DISTRICT_CODES).find((name) => sigungu?.includes(name))
  return district ? { sidoCode: '11', sggCode: SEOUL_DISTRICT_CODES[district] } : null
}

export type OfficialKindergarten = {
  code: string | null
  name: string | null
  type: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  homepage: string | null
  operationTime: string | null
  operatingStatus: string | null
  capacity: number | null
  currentEnrollment: number | null
  staffCount: number | null
  buildingYear: number | null
  floorCount: number | null
  buildingArea: number | null
  landArea: number | null
  classroomCount: number | null
  classroomArea: number | null
  playgroundArea: number | null
  sourceName: string
  sourceUrl: string
}

export async function getOfficialKindergartens(sido?: string, sigungu?: string): Promise<OfficialKindergarten[]> {
  const config = useRuntimeConfig()
  const region = codes(sido, sigungu)
  if (!config.publicBabyDataKey || !region) return []

  return cached(`kindergarten:official:${region.sidoCode}:${region.sggCode}`, 60 * 60 * 24, async () => {
    const baseParams = { key: config.publicBabyDataKey, sidoCode: region.sidoCode, sggCode: region.sggCode, pageCnt: '500', currentPage: '1' }
    const urls = [
      'https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do',
      'https://e-childschoolinfo.moe.go.kr/api/notice/afterSchoolPresent.do',
      'https://e-childschoolinfo.moe.go.kr/api/notice/building.do',
      'https://e-childschoolinfo.moe.go.kr/api/notice/classArea.do',
    ].map((endpoint) => {
      const url = new URL(endpoint)
      Object.entries(baseParams).forEach(([key, value]) => url.searchParams.set(key, value))
      return url
    })

    const [basic, after, building, classArea] = await Promise.all(urls.map((url) => fetchJson<unknown>(url.toString(), {}, 8000)))
    const byCode = (payload: unknown) => new Map(rows(payload).map((item) => [text(item, 'kindercode', 'kinderCode') || '', item]))
    const afterRows = byCode(after)
    const buildingRows = byCode(building)
    const classRows = byCode(classArea)

    return rows(basic).map((item) => {
      const code = text(item, 'kindercode', 'kinderCode')
      const extra = afterRows.get(code || '') || {}
      const buildingInfo = buildingRows.get(code || '') || {}
      const classInfo = classRows.get(code || '') || {}
      return {
        code,
        name: text(item, 'kindername', 'kinderName', 'name'),
        type: text(item, 'establish', 'establishType'),
        address: text(item, 'addr', 'address', 'rdAddr'),
        latitude: number(item, 'lttdcdnt'),
        longitude: number(item, 'lngtcdnt'),
        phone: text(item, 'telno', 'tel'),
        homepage: text(item, 'hpaddr', 'homepage'),
        operationTime: text(extra, 'oper_time', 'operTime') || text(item, 'opertime'),
        operatingStatus: text(item, 'operStatus', 'operstatus', 'status'),
        capacity: number(item, 'prmstfcnt'),
        currentEnrollment: sum(item, 'ppcnt3', 'ppcnt4', 'ppcnt5', 'mixppcnt', 'shppcnt') ?? sum(extra, 'inor_ptcn_kpcnt', 'pm_rrgn_ptcn_kpcnt'),
        staffCount: sum(extra, 'fxrl_thcnt', 'shcnt_thcnt', 'incnt', 'cce_tcr_cnt', 'etc_thts_cnt'),
        buildingYear: number(buildingInfo, 'archyy'),
        floorCount: number(buildingInfo, 'floorcnt'),
        buildingArea: number(buildingInfo, 'bldgprusarea'),
        landArea: number(buildingInfo, 'grottar'),
        classroomCount: number(classInfo, 'crcnt'),
        classroomArea: number(classInfo, 'clsrarea'),
        playgroundArea: number(classInfo, 'phgrindrarea'),
        sourceName: '교육부 유치원알리미 Open API',
        sourceUrl: 'https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do',
      }
    })
  })
}

export function matchOfficialKindergarten(name: string, official: OfficialKindergarten[]) {
  const target = normalize(name)
  return official.find((item) => {
    if (!item.name) return false
    const candidate = normalize(item.name)
    return candidate === target || candidate.includes(target) || target.includes(candidate)
  }) || null
}
