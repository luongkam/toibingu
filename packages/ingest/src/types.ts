/**
 * Source adapters (SD-TBI001). Every adapter uses an official, permitted access path, never throws, and reports
 * its state so the pipeline keeps running when one source is down (plan 261016-0900-trend-engine-sources).
 */
import type { Platform, Source } from "@toibingu/domain";

/** The subset of `fetch` adapters use; tests pass a fake. */
export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  status: number;
  text(): Promise<string>;
}>;

export type AdapterStatus = "ok" | "degraded" | "quota_exhausted" | "not_configured" | "permission_missing";

export interface IngestItem {
  externalId: string;
  text: string;
  url: string;
  platform: Platform;
  publishedAt?: string;
  /** Author handle as the platform returns it; used only to count independent askers, never published. */
  author?: string;
  source: Source;
  meta?: Record<string, string | number>;
}

export interface AdapterResult {
  adapter: string;
  status: AdapterStatus;
  items: IngestItem[];
  warnings: string[];
}

export const result = (adapter: string, status: AdapterStatus, items: IngestItem[] = [], warnings: string[] = []): AdapterResult => ({
  adapter,
  status,
  items,
  warnings,
});

export function officialSource(platform: Platform, externalId: string, url: string, retrievedAt: string): Source {
  return { id: `${platform}:${externalId}`, url, platform, retrievedAt, visibility: "public", accessMethod: "official_api" };
}
