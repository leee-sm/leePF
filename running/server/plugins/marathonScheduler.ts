import { syncPublicMarathons } from '../services/marathonService'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function millisecondsUntilNextKstMidnight() {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS)
  const nextMidnightUtcLike = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate() + 1,
  )
  return Math.max(1000, nextMidnightUtcLike - KST_OFFSET_MS - Date.now())
}

export default defineNitroPlugin(() => {
  const schedule = (callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    timer.unref?.()
  }

  const run = async () => {
    await syncPublicMarathons()
    schedule(run, DAY_MS)
  }

  // 배포 직후에도 최신 공개 일정을 준비하고, 이후 정기 실행은 매일 00:00 KST에 수행합니다.
  void syncPublicMarathons()

  schedule(run, millisecondsUntilNextKstMidnight())
})
