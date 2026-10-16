// Every dossier in data/dossiers parses, matches its file name, and is either a draft or passes the publish gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPublishGate } from "@toibingu/domain";
import type { Entry } from "../src/render.ts";
import { isPublished } from "../src/site.ts";

const DIR = join(import.meta.dirname, "../../../data/dossiers");

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  test(`data/dossiers/${file}`, () => {
    const e = JSON.parse(readFileSync(join(DIR, file), "utf8")) as Entry;
    assert.equal(`${e.story.slug}.json`, file, "file name = slug");
    assert.equal(e.dossier.storyId, e.story.id);
    assert.ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.story.slug), "ASCII slug");
    if (isPublished(e)) assert.deepEqual(checkPublishGate(e.dossier).failures, []);
    else assert.equal(e.dossier.approvedBy, null, "drafts carry no approver");
  });
}
