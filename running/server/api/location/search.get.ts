import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { searchAddress } from '../../services/locationService'

const querySchema = z.object({
  q: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) return fail('BAD_REQUEST', '검색할 도로명주소를 입력해 주세요.')

  try {
    return ok(await searchAddress(parsed.data.q))
  } catch (error) {
    console.error('[location/search]', error)
    return fail('LOCATION_SEARCH_FAILED', '주소검색 데이터를 불러오지 못했습니다.')
  }
})
