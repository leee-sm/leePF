import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { listChecklists } from '../../services/babyService'

const querySchema = z.object({
  type: z.enum(['pregnancy', 'baby']).default('pregnancy'),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) return fail('BAD_REQUEST', '체크리스트 유형을 확인해 주세요.')
  return ok(await listChecklists(parsed.data.type))
})
