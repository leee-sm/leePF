import { ExternalApiError } from '../utils/http'

const sourceUrl = 'https://gorunning.kr/races/'
const sourceName = 'GoRunning 공개 마라톤 일정'

export type PublicMarathon = {
  sourceKey: string
  name: string
  region: string | null
  address: string | null
  raceDate: string
  registrationStatus: string | null
  distance10k: boolean
  distanceHalf: boolean
  distanceFull: boolean
  organizer: string | null
  websiteUrl: string | null
  sourceName: string
  sourceUrl: string
}

function decodeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function cellText(cell: string) {
  return decodeHtml(cell)
}

function parseRow(row: string, raceDate: string): PublicMarathon | null {
  const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1])
  if (cells.length < 7) return null

  const link = cells[1].match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
  const name = link ? cellText(link[2]) : cellText(cells[1])
  if (!name) return null

  const distances = cellText(cells[2])
  const region = cellText(cells[3]) || null
  const address = cellText(cells[4]) || null
  const organizer = cellText(cells[5]) || null
  const statusText = cellText(cells[6])
  const registrationStatus = statusText.includes('등록중')
    ? '접수중'
    : statusText.includes('마감')
      ? '마감'
      : statusText.includes('예정')
        ? '접수예정'
        : statusText || null

  const detailUrl = link?.[1]
    ? new URL(link[1], sourceUrl).toString()
    : null

  return {
    sourceKey: `gorunning:${link?.[1] || `${raceDate}:${name}:${region || ''}`}`,
    name,
    region,
    address,
    raceDate,
    registrationStatus,
    distance10k: /10\s?km/i.test(distances),
    distanceHalf: /하프|half/i.test(distances),
    distanceFull: /풀|full/i.test(distances),
    organizer,
    websiteUrl: detailUrl,
    sourceName,
    sourceUrl,
  }
}

/**
 * k-skill의 korean-marathon-schedule 공개 접근 경로에 맞춘 Provider입니다.
 * GoRunning 페이지는 날짜별 HTML 표를 제공하므로 배치에서만 읽고, 사용자 요청에서는 DB만 읽습니다.
 */
export async function fetchPublicMarathons(): Promise<PublicMarathon[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { 'user-agent': 'LifeRun-MarathonBatch/1.0' },
    })
    if (!response.ok) throw new ExternalApiError(`마라톤 일정 원천 응답 오류 (${response.status})`)
    const html = await response.text()
    const results: PublicMarathon[] = []
    const dateStarts = [...html.matchAll(/<div\b[^>]*id=["']race-(\d{4}-\d{2}-\d{2})["'][^>]*>/gi)]

    for (let index = 0; index < dateStarts.length; index += 1) {
      const current = dateStarts[index]
      const start = current.index ?? 0
      const end = dateStarts[index + 1]?.index ?? html.length
      const block = html.slice(start, end)
      const raceDate = current[1]
      const tables = [...block.matchAll(/<table\b[\s\S]*?<\/table>/gi)]
      const table = tables[0]?.[0]
      if (!table) continue
      for (const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const item = parseRow(row[1], raceDate)
        if (item) results.push(item)
      }
    }

    const unique = new Map(results.map((item) => [item.sourceKey, item]))
    return [...unique.values()]
  } catch (error) {
    if (error instanceof ExternalApiError) throw error
    throw new ExternalApiError('마라톤 일정 원천을 읽지 못했습니다.')
  } finally {
    clearTimeout(timer)
  }
}
