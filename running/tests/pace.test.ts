import { describe, expect, it } from 'vitest'
import { calculatePace, parseHms } from '../server/services/paceService'

describe('paceService', () => {
  it('calculates 10km 50 minute pace without floating point drift', () => {
    const result = calculatePace('10k', parseHms(0, 50, 0))
    expect(result.paceText).toBe('5:00 /km')
    expect(result.splits.at(-1)?.elapsedText).toBe('00:50:00')
  })
})
