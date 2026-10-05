const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function nowKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS)
}

export function formatDateKst(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayKst(): string {
  return formatDateKst(nowKst())
}

export function ddayKst(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return '일정 미정'
  const target = typeof dateValue === 'string' ? new Date(`${dateValue}T00:00:00+09:00`) : dateValue
  if (Number.isNaN(target.getTime())) return '일정 미정'

  const today = new Date(`${todayKst()}T00:00:00+09:00`)
  const raceDay = new Date(`${formatDateKst(new Date(target.getTime() + KST_OFFSET_MS))}T00:00:00+09:00`)
  const diffDays = Math.round((raceDay.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return '종료'
  if (diffDays === 0) return 'D-DAY'
  return `D-${diffDays}`
}

export function toKstIso(date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().replace('Z', '+09:00')
}
