import type { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { ddayKst, todayKst } from '../utils/kst'
import { fetchPublicMarathons } from './marathonProvider'

export type MarathonListFilter = {
  month?: string
  date?: string
  region?: string
  status?: string
  distance?: '10k' | 'half' | 'full'
}

function normalizeRaceDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}

function distancesOf(event: {
  distance10k: boolean
  distanceHalf: boolean
  distanceFull: boolean
}) {
  const items: string[] = []
  if (event.distance10k) items.push('10km')
  if (event.distanceHalf) items.push('Half')
  if (event.distanceFull) items.push('Full')
  return items
}

export async function listMarathons(filter: MarathonListFilter = {}) {
  const month = filter.month || todayKst().slice(0, 7)
  const start = new Date(`${month}-01T00:00:00+09:00`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  const dateStart = filter.date ? new Date(`${filter.date}T00:00:00+09:00`) : start
  const dateEnd = filter.date ? new Date(dateStart.getTime() + 86_400_000) : end

  const where: Prisma.MarathonEventWhereInput = {
    raceDate: {
      gte: dateStart,
      lt: dateEnd,
    },
  }
  if (filter.region) where.region = { contains: filter.region, mode: 'insensitive' }
  if (filter.status) where.registrationStatus = filter.status
  if (filter.distance === '10k') where.distance10k = true
  if (filter.distance === 'half') where.distanceHalf = true
  if (filter.distance === 'full') where.distanceFull = true

  const rows = await prisma.marathonEvent.findMany({
    where,
    orderBy: [{ raceDate: 'asc' }, { name: 'asc' }],
    take: 100,
  })

  return {
    month,
    items: rows.map((event) => ({
      id: event.id,
      name: event.name,
      region: event.region,
      raceDate: normalizeRaceDate(event.raceDate),
      registrationStatus: event.registrationStatus || '확인 필요',
      dday: ddayKst(event.raceDate),
      distances: distancesOf(event),
    })),
  }
}

export async function syncPublicMarathons() {
  try {
    const events = await fetchPublicMarathons()
    for (const event of events) {
      await prisma.marathonEvent.upsert({
        where: { sourceKey: event.sourceKey },
        create: { ...event, raceDate: new Date(`${event.raceDate}T00:00:00+09:00`) },
        update: { ...event, raceDate: new Date(`${event.raceDate}T00:00:00+09:00`) },
      })
    }
    console.info(`[marathon-sync] upserted ${events.length} events`)
    return events.length
  } catch (error) {
    console.error('[marathon-sync] failed', error)
    return 0
  }
}

export async function getMarathon(id: string) {
  const event = await prisma.marathonEvent.findUnique({ where: { id } })
  if (!event) return null
  return {
    id: event.id,
    name: event.name,
    region: event.region,
    address: event.address,
    latitude: event.latitude ? Number(event.latitude) : null,
    longitude: event.longitude ? Number(event.longitude) : null,
    raceDate: normalizeRaceDate(event.raceDate),
    startTime: event.startTime,
    registrationStartDate: normalizeRaceDate(event.registrationStartDate),
    registrationEndDate: normalizeRaceDate(event.registrationEndDate),
    registrationStatus: event.registrationStatus || '확인 필요',
    distances: distancesOf(event),
    entryFee: event.entryFee,
    organizer: event.organizer,
    host: event.host,
    websiteUrl: event.websiteUrl,
    registrationUrl: event.registrationUrl,
    description: event.description,
    imageUrl: event.imageUrl,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    dday: ddayKst(event.raceDate),
  }
}
