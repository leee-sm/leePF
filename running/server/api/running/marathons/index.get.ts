import { z } from 'zod'
import { ok, fail } from '../../../utils/apiResponse'
import { listMarathons } from '../../../services/marathonService'

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  region: z.string().trim().max(30).optional(),
  status: z.enum(['접수중', '마감', '접수예정']).optional(),
  distance: z.enum(['10k', 'half', 'full']).optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) return fail('BAD_REQUEST', '조회 월 형식을 확인해 주세요.')
  return ok(await listMarathons(parsed.data))
})
