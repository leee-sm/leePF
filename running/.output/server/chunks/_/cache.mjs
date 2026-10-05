const store = /* @__PURE__ */ new Map();
async function cached(key, ttlSeconds, loader) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value;
  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlSeconds * 1e3 });
  return value;
}

export { cached as c };
//# sourceMappingURL=cache.mjs.map
