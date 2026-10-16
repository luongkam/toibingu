import type { FetchLike } from "../src/types.ts";

export interface Call {
  url: string;
}

/** Replies in order; records every URL so tests can assert what was requested. */
export function fakeFetch(...replies: ({ status: number; body: string } | Error)[]): FetchLike & { calls: Call[] } {
  const calls: Call[] = [];
  const fn = (async (url: string) => {
    calls.push({ url });
    const r = replies.shift();
    if (!r) throw new Error(`unexpected request ${url}`);
    if (r instanceof Error) throw r;
    return { status: r.status, text: async () => r.body };
  }) as FetchLike & { calls: Call[] };
  fn.calls = calls;
  return fn;
}

export const json = (status: number, value: unknown) => ({ status, body: JSON.stringify(value) });
