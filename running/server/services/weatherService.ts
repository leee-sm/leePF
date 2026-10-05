import { z } from 'zod'
import { cached } from '../utils/cache'
import { fetchJson } from '../utils/http'
import { recommendRunningOutfit } from './runningOutfitService'
import { getAirQuality } from './airQualityService'

const itemSchema = z.object({ category: z.string(), obsrValue: z.string().optional(), fcstValue: z.string().optional(), fcstDate: z.string().optional(), fcstTime: z.string().optional() })

function kstParts(date = new Date()) {
  const value = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  return { date: `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, '0')}${String(value.getDate()).padStart(2, '0')}`, hour: value.getHours(), minute: value.getMinutes() }
}

function baseTime(hour: number, minute: number) {
  const times = [2, 5, 8, 11, 14, 17, 20, 23]
  const selected = [...times].reverse().find((time) => hour > time || (hour === time && minute >= 10))
  return selected === undefined ? '2300' : `${String(selected).padStart(2, '0')}00`
}

async function callKma(path: string, params: Record<string, string>) {
  const config = useRuntimeConfig()
  const url = new URL(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/${path}`)
  url.searchParams.set('serviceKey', config.publicDataServiceKey)
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('numOfRows', '1000')
  url.searchParams.set('dataType', 'JSON')
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const json = await fetchJson<unknown>(url.toString(), {}, 7000)
  return z.object({ response: z.object({ body: z.object({ items: z.object({ item: z.array(itemSchema).default([]) }) }) }) }).parse(json).response.body.items.item
}

export async function getRunningWeather(nx: number, ny: number, label: string, sido?: string) {
  const config = useRuntimeConfig()
  if (!config.publicDataServiceKey) return { location: { label, nx, ny }, current: null, hourly: [], airQuality: null, outfit: recommendRunningOutfit({ temperature: null }), source: { name: '기상청 공공데이터포털', status: 'API Key 필요' } }
  const parts = kstParts()
  const key = `weather:${nx}:${ny}:${parts.date}:${parts.hour}`
  return cached(key, 60 * 15, async () => {
    const currentItems = await callKma('getUltraSrtNcst', { base_date: parts.date, base_time: `${String(parts.hour).padStart(2, '0')}00`, nx: String(nx), ny: String(ny) })
    const current = Object.fromEntries(currentItems.map((item) => [item.category, Number(item.obsrValue)]))
    const forecastItems = await callKma('getVilageFcst', { base_date: parts.date, base_time: baseTime(parts.hour, parts.minute), nx: String(nx), ny: String(ny) })
    const groups = new Map<string, Record<string, number>>()
    forecastItems.forEach((item) => { const key = `${item.fcstDate}-${item.fcstTime}`; const row = groups.get(key) || {}; const value = Number(item.fcstValue); row[item.category] = Number.isFinite(value) ? value : null; groups.set(key, row) })
    const hourly = [...groups.entries()].slice(0, 12).map(([time, row]) => ({ time, temperature: row.TMP ?? null, humidity: row.REH ?? null, precipitation: row.PCP ?? 0, precipitationProbability: row.POP ?? null, windSpeed: row.WSD ?? null, sky: row.SKY ?? null }))
    const temperature = current.T1H ?? hourly[0]?.temperature ?? null
    let airQuality: Awaited<ReturnType<typeof getAirQuality>> = null
    try {
      airQuality = await getAirQuality(sido)
    } catch {
      // 미세먼지 API가 일시적으로 실패해도 기상청 날씨·예보는 표시한다.
      airQuality = null
    }
    return { location: { label, nx, ny }, current: { temperature, humidity: current.REH ?? null, precipitation: current.RN1 ?? 0, windSpeed: current.WSD ?? null, feelsLikeTemperature: temperature, pm10: airQuality?.pm10 ?? null, pm25: airQuality?.pm25 ?? null }, hourly, airQuality, outfit: recommendRunningOutfit({ temperature, feelsLikeTemperature: temperature, humidity: current.REH ?? null, precipitation: current.RN1 ?? 0, windSpeed: current.WSD ?? null, pm10: airQuality?.pm10 ?? null, pm25: airQuality?.pm25 ?? null }), source: { name: '기상청·에어코리아 공공데이터포털', status: '정상' } }
  })
}
