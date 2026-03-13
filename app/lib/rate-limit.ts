const records = new Map<string, { count: number; resetTime: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  records.forEach((val, key) => {
    if (now > val.resetTime) records.delete(key);
  });
}

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const record = records.get(ip);

  if (!record || now > record.resetTime) {
    records.set(ip, { count: 1, resetTime: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  record.count++;
  return { ok: true, remaining: limit - record.count };
}
