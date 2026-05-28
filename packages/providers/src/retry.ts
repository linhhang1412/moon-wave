const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable =
        err instanceof TypeError || // network error
        (err instanceof Error && [...RETRYABLE_STATUSES].some((s) => err.message.includes(String(s))));

      if (!isRetryable || attempt === maxAttempts - 1) throw err;

      const delay = baseDelayMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

// Wraps a fetch call and throws a typed error for retryable HTTP status codes
export async function fetchWithRetry(
  input: string | URL | Request,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  return withRetry(async () => {
    const res = await fetch(input, init);
    if (RETRYABLE_STATUSES.has(res.status)) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res;
  }, options);
}
