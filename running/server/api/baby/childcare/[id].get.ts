import { fail } from '../../../utils/apiResponse'

export default defineEventHandler(() => {
  return fail('OFFICIAL_DATA_NOT_CONNECTED', '어린이집 상세 공식 API 연동이 아직 설정되지 않았습니다.')
})
