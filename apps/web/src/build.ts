#!/usr/bin/env node
// Static site build (SD-TBH001 H-18). Usage: node apps/web/src/build.ts <outDir> [--preview] [--base https://toibingu.vn]
// Writes only into <outDir>; reads data/dossiers/*.json.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Entry } from "./render.ts";
import { buildSite } from "./site.ts";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--base");
if (!out) {
  console.error("usage: node apps/web/src/build.ts <outDir> [--preview] [--base <url>]");
  process.exit(2);
}
const base = args[args.indexOf("--base") + 1] && args.includes("--base") ? args[args.indexOf("--base") + 1]! : "https://toibingu.vn";
const root = resolve(import.meta.dirname, "../../..");
const dir = join(root, "data/dossiers");
const entries = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Entry);
let sha = "unknown";
try {
  sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
} catch {
  // not a git checkout
}
const files = buildSite(entries, { baseUrl: base.replace(/\/$/, ""), preview: args.includes("--preview") }, { sha, builtAt: new Date().toISOString() });
for (const [path, content] of files) {
  const target = join(resolve(out), path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
console.log(`built ${files.size} files into ${resolve(out)} (sha ${sha}${args.includes("--preview") ? ", preview" : ""})`);
