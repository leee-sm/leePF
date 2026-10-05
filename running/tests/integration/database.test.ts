import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/prisma'

describe('test PostgreSQL integration', () => {
  it('connects to the disposable database and exposes the expected schema', async () => {
    const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'run_pace'
    `
    expect(result).toHaveLength(1)
  })

  it('can insert and read a run pace record', async () => {
    const created = await prisma.runPace.create({
      data: {
        distanceType: '10k',
        distanceKm: 10,
        targetSeconds: 3000,
        paceSecondsPerKm: 300,
        targetTime: '00:50:00',
        paceText: '5:00 /km',
      },
    })
    const found = await prisma.runPace.findUnique({ where: { id: created.id } })
    expect(found?.paceText).toBe('5:00 /km')
    await prisma.runPace.delete({ where: { id: created.id } })
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
