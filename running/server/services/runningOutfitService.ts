export type RunningOutfitInput = {
  temperature: number | null
  feelsLikeTemperature?: number | null
  humidity?: number | null
  precipitation?: number | null
  windSpeed?: number | null
  pm10?: number | null
  pm25?: number | null
}

export type RunningOutfitRecommendation = {
  top: string
  bottom: string
  accessories: string[]
  notices: string[]
  condition: 'good' | 'caution' | 'poor'
  conditionLabel: string
}

type Rule = { min?: number; max?: number; top: string; bottom: string; accessories: string[] }
const temperatureRules: Rule[] = [
  { min: 25, top: '얇은 기능성 반팔 티', bottom: '러닝 쇼츠', accessories: ['모자', '수분 보충'] },
  { min: 20, max: 24, top: '반팔 기능성 티', bottom: '러닝 쇼츠', accessories: ['가벼운 양말'] },
  { min: 15, max: 19, top: '긴팔 기능성 티 또는 반팔 + 얇은 레이어', bottom: '쇼츠 또는 얇은 러닝 타이츠', accessories: [] },
  { min: 10, max: 14, top: '기능성 긴팔 티', bottom: '러닝 타이츠', accessories: ['얇은 바람막이'] },
  { min: 5, max: 9, top: '보온 기능성 베이스레이어', bottom: '기모 러닝 타이츠', accessories: ['바람막이', '장갑'] },
  { min: 0, max: 4, top: '보온 베이스레이어 + 러닝 재킷', bottom: '기모 러닝 타이츠', accessories: ['장갑', '비니'] },
  { max: -1, top: '방한 베이스레이어 + 방풍 재킷', bottom: '기모 러닝 타이츠', accessories: ['장갑', '비니', '넥워머'] },
]

function matchRule(temperature: number) {
  return temperatureRules.find((rule) => (rule.min === undefined || temperature >= rule.min) && (rule.max === undefined || temperature <= rule.max)) || temperatureRules.at(-1)!
}

export function recommendRunningOutfit(input: RunningOutfitInput): RunningOutfitRecommendation {
  if (input.temperature === null) return { top: '날씨 데이터 확인 필요', bottom: '날씨 데이터 확인 필요', accessories: [], notices: ['기온 데이터가 없어 복장 추천을 계산하지 못했습니다.'], condition: 'caution', conditionLabel: '판단 보류' }
  const baseTemperature = Math.round(input.feelsLikeTemperature ?? input.temperature)
  const rule = matchRule(baseTemperature)
  const accessories = new Set(rule.accessories)
  const notices: string[] = []
  if ((input.precipitation ?? 0) > 0) { accessories.add('방수 재킷 또는 러닝 캡'); notices.push('강수 가능성이 있어 미끄러운 구간에 주의하세요.') }
  if ((input.precipitation ?? 0) <= 0 && baseTemperature >= 15) accessories.add('선글라스')
  if (baseTemperature >= 20 && (input.precipitation ?? 0) <= 0) accessories.add('모자')
  if ((input.windSpeed ?? 0) >= 5) { accessories.add('바람막이'); notices.push('바람이 강해 체감온도가 낮을 수 있습니다.') }
  if ((input.humidity ?? 0) >= 75 && baseTemperature >= 20) notices.push('습도가 높아 무리하지 않는 페이스를 권장합니다.')
  if ((input.pm10 ?? 0) > 80 || (input.pm25 ?? 0) > 35) notices.push('미세먼지 또는 초미세먼지가 높아 야외 운동 강도를 낮추는 것을 권장합니다.')

  const poor = (input.pm10 ?? 0) > 80 || (input.pm25 ?? 0) > 35 || (input.precipitation ?? 0) > 2 || (input.windSpeed ?? 0) >= 8 || baseTemperature > 30 || baseTemperature < -5
  const caution = poor || (input.pm10 ?? 0) > 30 || (input.pm25 ?? 0) > 15 || (input.precipitation ?? 0) > 0 || (input.humidity ?? 0) >= 75 || (input.windSpeed ?? 0) >= 5 || baseTemperature > 27 || baseTemperature < 0
  return { top: rule.top, bottom: rule.bottom, accessories: [...accessories], notices, condition: poor ? 'poor' : caution ? 'caution' : 'good', conditionLabel: poor ? '뛰기 어려움' : caution ? '조건이 애매함' : '뛰기 좋음' }
}
