import { describe, expect, it } from 'vitest'
import { recommendRunningOutfit } from '../server/services/runningOutfitService'

describe('runningOutfitService', () => {
  it('adds wind and dust notices', () => {
    const result = recommendRunningOutfit({
      temperature: 8,
      windSpeed: 6,
      pm25: 40,
    })
    expect(result.accessories).toContain('바람막이')
    expect(result.notices.join(' ')).toContain('초미세먼지')
  })
})
