import { cached } from '../utils/cache'
import { fetchText } from '../utils/http'

type HospitalHours = Record<number, { start: number | null; end: number | null }>
type OfficialHospital = {
  name: string
  address: string
  phone: string | null
  category: string | null
  latitude: number | null
  longitude: number | null
  hours: HospitalHours
}

function xmlValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || null
}

function minutes(value: string | null) {
  if (!value || !/^\d{4}$/.test(value)) return null
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(2))
}

function normalize(value: string) { return value.replace(/\s+/g, '').replace(/[()·-]/g, '').toLowerCase() }

function currentKst() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((part) => part.type === 'weekday')?.value || 'Sun')
  return { day: weekday === 0 ? 7 : weekday, minute: Number(parts.find((part) => part.type === 'hour')?.value || 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value || 0) }
}

function parse(xml: string): OfficialHospital[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1]
    const hours: HospitalHours = {}
    for (let day = 1; day <= 7; day++) hours[day] = { start: minutes(xmlValue(block, `dutyTime${day}s`)), end: minutes(xmlValue(block, `dutyTime${day}c`)) }
    return {
      name: xmlValue(block, 'dutyName') || '', address: xmlValue(block, 'dutyAddr') || '', phone: xmlValue(block, 'dutyTel1'),
      category: xmlValue(block, 'dutyDivName'), latitude: Number(xmlValue(block, 'wgs84Lat')) || null, longitude: Number(xmlValue(block, 'wgs84Lon')) || null, hours,
    }
  }).filter((item) => item.name)
}

export async function getOfficialHospitals(sido?: string, sigungu?: string) {
  const key = useRuntimeConfig().hospitalDataKey
  if (!key || !sido || !sigungu) return []
  return cached(`hospital:official:${sido}:${sigungu}`, 60 * 30, async () => {
    const url = new URL('https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire')
    url.searchParams.set('serviceKey', key)
    url.searchParams.set('Q0', sido)
    url.searchParams.set('Q1', sigungu)
    url.searchParams.set('numOfRows', '1000')
    url.searchParams.set('pageNo', '1')
    return parse(await fetchText(url.toString(), {}, 8000))
  })
}

export function matchOfficialHospital(name: string, latitude: number, longitude: number, official: OfficialHospital[]) {
  const target = normalize(name)
  return official.find((item) => normalize(item.name) === target || normalize(item.name).includes(target) || target.includes(normalize(item.name))) || official
    .filter((item) => item.latitude !== null && item.longitude !== null)
    .sort((a, b) => Math.hypot((a.latitude! - latitude) * 111000, (a.longitude! - longitude) * 88000) - Math.hypot((b.latitude! - latitude) * 111000, (b.longitude! - longitude) * 88000))[0] || null
}

export function hospitalOpenStatus(hours: HospitalHours) {
  const now = currentKst()
  const today = hours[now.day]
  if (!today || today.start === null || today.end === null) return { label: '영업시간 확인 필요', state: 'unknown' }
  if (today.start <= now.minute && now.minute <= today.end) return { label: '영업중', state: 'open' }
  return { label: '영업종료', state: 'closed' }
}
