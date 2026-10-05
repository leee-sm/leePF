import { z } from 'zod'
import { ok, fail } from '../../utils/apiResponse'
import { getRunningWeather } from '../../services/weatherService'

const querySchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  nx: z.coerce.number().optional(),
  ny: z.coerce.number().optional(),
  label: z.string().optional(),
  sido: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) return fail('BAD_REQUEST', '위치 정보를 확인해 주세요.')

  const config = useRuntimeConfig()
  if (!config.publicDataServiceKey) {
    return fail('PUBLIC_DATA_KEY_MISSING', '기상청 공공데이터 API Key가 설정되지 않았습니다.')
  }

  if (parsed.data.nx === undefined || parsed.data.ny === undefined) return fail('GRID_REQUIRED', '주소를 다시 선택해 기상청 격자 좌표를 확인해 주세요.')
  try {
    return ok(await getRunningWeather(parsed.data.nx, parsed.data.ny, parsed.data.label || '선택 위치', parsed.data.sido))
  } catch {
    return fail('WEATHER_UNAVAILABLE', '날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
})
