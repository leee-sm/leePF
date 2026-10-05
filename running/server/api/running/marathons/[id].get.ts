import { ok, fail } from '../../../utils/apiResponse'
import { getMarathon } from '../../../services/marathonService'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) return fail('BAD_REQUEST', '대회 ID를 확인해 주세요.')
  const marathon = await getMarathon(id)
  if (!marathon) return fail('NOT_FOUND', '대회 정보를 찾을 수 없습니다.')
  return ok(marathon)
})
