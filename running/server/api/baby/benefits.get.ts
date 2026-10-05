import { z } from 'zod'
import { ok } from '../../utils/apiResponse'
import { listBenefits } from '../../services/babyService'

const querySchema = z.object({
  sido: z.string().optional(),
  sigungu: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const query = querySchema.parse(getQuery(event))
  return ok(await listBenefits(query.sido, query.sigungu))
})
