/**
 * Fetch with exponential backoff retry logic
 */

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    retryOn = [429, 500, 502, 503, 504],
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[fetchWithRetry] Attempt ${attempt + 1}/${retries + 1} for ${url}`);
      const response = await fetch(url, fetchOptions);

      // If response is OK or not a retryable status, return it
      if (response.ok || !retryOn.includes(response.status)) {
        return response;
      }

      // If we should retry this status code
      if (retryOn.includes(response.status)) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        lastError = error;

        // If this isn't the last attempt, wait and retry
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(
            `[fetchWithRetry] Retryable error (${response.status}), retrying in ${delay}ms...`
          );
          onRetry?.(attempt + 1, error);
          await sleep(delay);
          continue;
        }

        // Last attempt failed, return the error response
        return response;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`[fetchWithRetry] Attempt ${attempt + 1} failed:`, error);

      // If this isn't the last attempt, wait and retry
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Network error, retrying in ${delay}ms...`);
        onRetry?.(attempt + 1, error);
        await sleep(delay);
        continue;
      }

      // Last attempt failed, throw the error
      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simple in-memory cache for API responses
 */
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private defaultTTL = 5000; // 5 seconds default

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  get(key: string, maxAge: number = this.defaultTTL): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string, maxAge: number = this.defaultTTL): boolean {
    return this.get(key, maxAge) !== null;
  }
}

export const apiCache = new ResponseCache();

/**
 * Fetch with caching and retry
 */
export async function cachedFetch(
  url: string,
  options: FetchWithRetryOptions & { cacheTTL?: number; bypassCache?: boolean } = {}
): Promise<any> {
  const { cacheTTL = 5000, bypassCache = false, ...fetchOptions } = options;

  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
    const cached = apiCache.get(cacheKey, cacheTTL);
    if (cached) {
      console.log(`[cachedFetch] Cache hit for ${url}`);
      return cached;
    }
  }

  // Fetch with retry
  const response = await fetchWithRetry(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Cache the successful response
  if (!bypassCache) {
    const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
    apiCache.set(cacheKey, data, cacheTTL);
  }

  return data;
}
