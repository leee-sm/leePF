import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { listHospitals } from '../../services/babyService'

const querySchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  radius: z.coerce.number().default(3000),
  sido: z.string().optional(),
  sigungu: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) return fail('BAD_REQUEST', '위치와 반경을 확인해 주세요.')
  try {
    return ok(await listHospitals(parsed.data.lat, parsed.data.lon, parsed.data.radius, parsed.data.sido, parsed.data.sigungu))
  } catch {
    return fail('HOSPITAL_SEARCH_FAILED', '주변 병원 정보를 불러오지 못했습니다.')
  }
})
