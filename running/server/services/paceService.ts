export type DistanceType = '10k' | 'half' | 'full'

export const distances: Record<DistanceType, { label: string; km: number; meters: number }> = {
  '10k': { label: '10km', km: 10, meters: 10_000 },
  half: { label: 'Half', km: 21.0975, meters: 21_097.5 },
  full: { label: 'Full', km: 42.195, meters: 42_195 },
}

export type PaceSplit = {
  distanceKm: number
  paceText: string
  elapsedText: string
}

export type PaceResult = {
  distanceType: DistanceType
  distanceKm: number
  targetSeconds: number
  targetTime: string
  paceSecondsPerKm: number
  paceText: string
  splits: PaceSplit[]
}

export function parseHms(hours: number, minutes: number, seconds: number): number {
  if ([hours, minutes, seconds].some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error('시간은 0 이상의 정수로 입력해야 합니다.')
  }
  if (minutes >= 60 || seconds >= 60) {
    throw new Error('분과 초는 0~59 사이여야 합니다.')
  }
  const total = hours * 3600 + minutes * 60 + seconds
  if (total <= 0) throw new Error('목표시간을 입력해 주세요.')
  return total
}

export function formatHms(totalSeconds: number): string {
  const rounded = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

export function calculatePace(distanceType: DistanceType, targetSeconds: number): PaceResult {
  const distance = distances[distanceType]
  if (!distance) throw new Error('지원하지 않는 거리입니다.')
  const paceSecondsPerKm = Math.round(targetSeconds / distance.km)
  const splits: PaceSplit[] = []
  const wholeKm = Math.floor(distance.km)

  for (let km = 1; km <= wholeKm; km += 1) {
    splits.push({
      distanceKm: km,
      paceText: formatPace(paceSecondsPerKm),
      elapsedText: formatHms((targetSeconds * km) / distance.km),
    })
  }

  if (distance.km !== wholeKm) {
    splits.push({
      distanceKm: distance.km,
      paceText: formatPace(paceSecondsPerKm),
      elapsedText: formatHms(targetSeconds),
    })
  }

  return {
    distanceType,
    distanceKm: distance.km,
    targetSeconds,
    targetTime: formatHms(targetSeconds),
    paceSecondsPerKm,
    paceText: formatPace(paceSecondsPerKm),
    splits,
  }
}

export async function savePaceLookup(result: PaceResult) {
  const { prisma } = await import('../utils/prisma')
  await prisma.runPace.create({
    data: {
      distanceType: result.distanceType,
      distanceKm: result.distanceKm,
      targetSeconds: result.targetSeconds,
      paceSecondsPerKm: result.paceSecondsPerKm,
      targetTime: result.targetTime,
      paceText: result.paceText,
    },
  })
}
