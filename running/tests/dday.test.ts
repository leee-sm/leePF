import { describe, expect, it } from 'vitest'
import { ddayKst, todayKst } from '../server/utils/kst'

describe('ddayKst', () => {
  it('returns D-DAY for today in KST', () => {
    expect(ddayKst(todayKst())).toBe('D-DAY')
  })
})
