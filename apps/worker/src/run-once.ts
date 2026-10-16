#!/usr/bin/env node
// One scout cycle on the owner's machine (SD-TBH001 H-14). Credentials come from env only; prints a JSON report.
// Usage: node apps/worker/src/run-once.ts [--community meme] [--hashtag toico ...]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Community } from "@toibingu/domain";
import { instagramHashtagQuota, threadsKeywordQuota } from "@toibingu/ingest";
import type { Term } from "@toibingu/lexicon";
import { runCycle } from "./pipeline.ts";

const args = process.argv.slice(2);
const flag = (name: string): string[] => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]!] : []));
const lexicon = JSON.parse(readFileSync(join(import.meta.dirname, "../../../data/lexicon/terms.json"), "utf8")) as Term[];
const env = process.env;

const report = await runCycle(fetch, {
  threads: { quota: threadsKeywordQuota(), ...(env.THREADS_ACCESS_TOKEN ? { accessToken: env.THREADS_ACCESS_TOKEN } : {}) },
  instagram: {
    quota: instagramHashtagQuota(),
    graphVersion: env.META_GRAPH_VERSION ?? "v23.0",
    ...(env.IG_ACCESS_TOKEN ? { accessToken: env.IG_ACCESS_TOKEN } : {}),
    ...(env.IG_USER_ID ? { igUserId: env.IG_USER_ID } : {}),
  },
  lexicon,
  hashtags: flag("hashtag"),
  community: (flag("community")[0] ?? "meme") as Community,
});
console.log(JSON.stringify(report, null, 2));
