import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { calculatePace, parseHms, savePaceLookup } from '../../services/paceService'

const bodySchema = z.object({
  distanceType: z.enum(['10k', 'half', 'full']),
  hours: z.number().int().min(0).max(99),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) return fail('BAD_REQUEST', '거리와 목표시간을 확인해 주세요.')

  try {
    const targetSeconds = parseHms(parsed.data.hours, parsed.data.minutes, parsed.data.seconds)
    const result = calculatePace(parsed.data.distanceType, targetSeconds)
    await savePaceLookup(result)
    return ok(result)
  } catch (error) {
    return fail('PACE_CALCULATION_FAILED', error instanceof Error ? error.message : '페이스 계산에 실패했습니다.')
  }
})
