import { describe, expect, it } from 'vitest'
import { toKmaGrid } from '../server/utils/kmaGrid'

describe('toKmaGrid', () => {
  it('converts Seoul coordinates to a stable KMA grid neighborhood', () => {
    const grid = toKmaGrid(37.5665, 126.978)
    expect(grid.nx).toBeGreaterThan(55)
    expect(grid.nx).toBeLessThan(65)
    expect(grid.ny).toBeGreaterThan(120)
    expect(grid.ny).toBeLessThan(130)
  })
})
