/**
 * Validate that every persona has the v0.8 derived files the Previously runtime
 * expects. Pure Node — no TypeScript compilation needed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

const personas = fs.readdirSync(REPO_ROOT)
  .filter((name) => /^personal_\d+$/.test(name))
  .filter((name) => fs.statSync(path.join(REPO_ROOT, name)).isDirectory())
  .sort();

const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "manifest.json"), "utf-8"));

let errors = 0;

for (const p of personas) {
  const dir = path.join(REPO_ROOT, p);
  const issues = [];

  const indexPath = path.join(dir, "episodic", "timeline", "index.json");
  if (!fs.existsSync(indexPath)) {
    issues.push("missing timeline/index.json");
  } else {
    try {
      const idx = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      if (!Array.isArray(idx.slices)) issues.push("timeline/index.json missing slices array");
      else if (idx.slices.length === 0) issues.push("timeline/index.json has 0 slices");
      else {
        const first = idx.slices[0];
        if (!first.id || !first.date || !first.start) issues.push("timeline entry missing id/date/start");
      }
    } catch (e) {
      issues.push(`timeline/index.json invalid JSON: ${e.message}`);
    }
  }

  const mdPath = path.join(dir, "episodic", "timeline.md");
  if (!fs.existsSync(mdPath)) issues.push("missing timeline.md");

  const cardPath = path.join(dir, "episodic", "current-previously.md");
  if (!fs.existsSync(cardPath)) {
    issues.push("missing current-previously.md");
  } else {
    const card = fs.readFileSync(cardPath, "utf-8");
    if (!card.includes("Format: user card v2")) issues.push("current-previously.md missing v2 stamp");
    if (!card.includes("## Identity")) issues.push("current-previously.md missing Identity");
    if (!card.includes("## Past")) issues.push("current-previously.md missing Past");
  }

  const strandsPath = path.join(dir, "episodic", "strands.json");
  if (!fs.existsSync(strandsPath)) issues.push("missing strands.json");

  const personaManifest = manifest.personas?.[p];
  if (!personaManifest) issues.push("missing from manifest.json");
  else if (!personaManifest.tree) issues.push("manifest entry missing tree");

  if (issues.length > 0) {
    console.error(`\n${p}:`);
    for (const issue of issues) console.error(`  ✗ ${issue}`);
    errors += issues.length;
  } else {
    console.log(`${p}: OK`);
  }
}

console.log(`\n=== Validation: ${errors === 0 ? "PASS" : `${errors} issue(s)`} ===`);
process.exit(errors === 0 ? 0 : 1);
