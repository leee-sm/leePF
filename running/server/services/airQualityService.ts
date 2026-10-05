import { z } from 'zod'
import { cached } from '../utils/cache'
import { fetchJson } from '../utils/http'

const itemSchema = z.object({
  stationName: z.string().optional(),
  pm10Value: z.string().nullable().optional(),
  pm25Value: z.string().nullable().optional(),
  pm10Grade: z.string().nullable().optional(),
  pm25Grade: z.string().nullable().optional(),
})

const responseSchema = z.object({
  response: z.object({
    body: z.object({ items: z.array(itemSchema).default([]) }),
  }),
})

function grade(value: number | null) {
  if (value === null) return null
  if (value <= 30) return '좋음'
  if (value <= 80) return '보통'
  if (value <= 150) return '나쁨'
  return '매우 나쁨'
}

export async function getAirQuality(sido?: string) {
  const config = useRuntimeConfig()
  if (!config.koreaAirDataKey || !sido) return null
  return cached(`air:${sido}`, 60 * 30, async () => {
    const url = new URL('https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty')
    url.searchParams.set('serviceKey', config.koreaAirDataKey)
    url.searchParams.set('returnType', 'json')
    url.searchParams.set('numOfRows', '100')
    url.searchParams.set('pageNo', '1')
    url.searchParams.set('sidoName', sido.replace('특별자치도', '').replace('특별시', '').replace('광역시', ''))
    url.searchParams.set('ver', '1.3')
    const parsed = responseSchema.parse(await fetchJson<unknown>(url.toString(), {}, 7000))
    const rows = parsed.response.body.items
    if (!rows.length) return null
    const values = rows.map((item) => ({
      stationName: item.stationName || null,
      pm10: item.pm10Value && /^\d+$/.test(item.pm10Value) ? Number(item.pm10Value) : null,
      pm25: item.pm25Value && /^\d+$/.test(item.pm25Value) ? Number(item.pm25Value) : null,
      pm10Grade: item.pm10Grade || grade(item.pm10Value && /^\d+$/.test(item.pm10Value) ? Number(item.pm10Value) : null),
      pm25Grade: item.pm25Grade || grade(item.pm25Value && /^\d+$/.test(item.pm25Value) ? Number(item.pm25Value) : null),
    }))
    const valid = values.filter((item) => item.pm10 !== null || item.pm25 !== null)
    if (!valid.length) return null
    const pm10Rows = valid.filter((item) => item.pm10 !== null)
    const pm25Rows = valid.filter((item) => item.pm25 !== null)
    const pm10 = pm10Rows.length ? Math.round(pm10Rows.reduce((sum, item) => sum + (item.pm10 || 0), 0) / pm10Rows.length) : null
    const pm25 = pm25Rows.length ? Math.round(pm25Rows.reduce((sum, item) => sum + (item.pm25 || 0), 0) / pm25Rows.length) : null
    return { stationName: valid[0].stationName, pm10, pm25, pm10Grade: grade(pm10), pm25Grade: grade(pm25) }
  })
}
