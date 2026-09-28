const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "anonymous";
  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

export function contentLengthTooLarge(request: Request, maxBytes: number): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const value = Number(raw);
  return Number.isFinite(value) && value > maxBytes;
}

export function rateLimit(
  request: Request,
  options: { scope: string; limit: number; windowMs: number },
): Response | null {
  const now = Date.now();
  const key = `${options.scope}:${clientKey(request)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= options.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
