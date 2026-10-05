type CacheItem<T> = {
  expiresAt: number
  value: T
}

const store = new Map<string, CacheItem<unknown>>()

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key) as CacheItem<T> | undefined
  if (hit && hit.expiresAt > now) return hit.value

  const value = await loader()
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 })
  return value
}

export function clearMemoryCache() {
  store.clear()
}
