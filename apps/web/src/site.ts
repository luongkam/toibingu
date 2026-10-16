/**
 * Builds the whole static site as path → content. The public build refuses any entry marked published that does
 * not pass `checkPublishGate`, and leaves drafts out entirely (AGENTS.md §6: no auto-publish).
 */
import { checkPublishGate } from "@toibingu/domain";
import { renderDossier, renderHome, dossierPath, type Entry, type RenderOptions } from "./render.ts";

export interface BuildInfo {
  sha: string;
  builtAt: string;
}

export function isPublished(e: Entry): boolean {
  return e.story.status === "published" && e.dossier.approvedBy !== null;
}

export function buildSite(entries: readonly Entry[], o: RenderOptions, info: BuildInfo): Map<string, string> {
  for (const e of entries.filter(isPublished)) {
    const gate = checkPublishGate(e.dossier);
    if (!gate.ok) throw new Error(`${e.story.slug}: marked published but fails the publish gate: ${gate.failures.map((f) => f.code).join(", ")}`);
  }
  const shown = entries.filter((e) => o.preview || isPublished(e));
  const files = new Map<string, string>();
  files.set("/index.html", renderHome(shown, o));
  for (const e of shown) files.set(`${dossierPath(e.story.slug)}index.html`, renderDossier(e, o));
  files.set("/api/version.json", `${JSON.stringify({ sha: info.sha, builtAt: info.builtAt, dossiers: shown.length, preview: Boolean(o.preview) })}\n`);
  return files;
}
