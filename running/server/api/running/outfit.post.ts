import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { recommendRunningOutfit } from '../../services/runningOutfitService'

const schema = z.object({
  temperature: z.number().nullable(),
  feelsLikeTemperature: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  precipitation: z.number().nullable().optional(),
  windSpeed: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  pm25: z.number().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) return fail('BAD_REQUEST', '날씨 정보 형식이 올바르지 않습니다.')
  return ok(recommendRunningOutfit(parsed.data))
})
