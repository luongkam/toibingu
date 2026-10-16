/**
 * Meta Graph API error mapping shared by Threads and Instagram adapters.
 * Rate-limit codes: 4, 17, 32, 613 (and HTTP 429). Permission / auth codes: 10, 190, 200..299.
 */
import type { AdapterStatus } from "./types.ts";

export function graphStatus(httpStatus: number, body: string): { status: AdapterStatus; message: string } | null {
  let error: { code?: number; message?: string } | undefined;
  try {
    error = (JSON.parse(body) as { error?: { code?: number; message?: string } }).error;
  } catch {
    // not JSON: fall through to HTTP status
  }
  const code = error?.code;
  const message = error?.message ?? `HTTP ${httpStatus}`;
  if (httpStatus === 429 || code === 4 || code === 17 || code === 32 || code === 613) return { status: "quota_exhausted", message };
  if (code === 10 || code === 190 || (code !== undefined && code >= 200 && code <= 299) || httpStatus === 401 || httpStatus === 403) {
    return { status: "permission_missing", message };
  }
  if (httpStatus >= 400 || error) return { status: "degraded", message };
  return null;
}
