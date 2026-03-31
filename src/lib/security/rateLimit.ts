const store = new Map<string, number[]>();

export function assertWithinRateLimit(
  key: string,
  limit: number,
  periodMs: number,
  now = Date.now(),
) {
  const values = store.get(key) ?? [];
  const recent = values.filter((entry) => now - entry < periodMs);
  if (recent.length >= limit) {
    throw new Error("Rate limit exceeded. Please wait a moment.");
  }
  recent.push(now);
  store.set(key, recent);
}
