#!/usr/bin/env node
/**
 * migrate-to-v0.5.mjs
 *
 * Migrates benchmark-data from flat-slice format (v0.4 compatible) to the
 * Aftrbrez v0.5 nested-slice format.
 *
 * Steps:
 *   1. Fix concatenation bug ("tagemotional_tone: neutral" → "tag")
 *   2. Restructure slices: HHMM.md → HHMM/timeline/core.md + agent.md + previously.md
 *   3. Rebuild manifest.json tree
 *
 * Idempotent — safe to re-run.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, rmSync, unlinkSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Helpers ────────────────────────────────────────────────────────────────

function read(path) {
  return readFileSync(path, "utf-8");
}

function write(path, content) {
  writeFileSync(path, content, "utf-8");
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory());
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isFile());
}

/** Return persona dirs like "personal_01" … "personal_20", sorted. */
function getPersonas() {
  return listDirs(ROOT)
    .filter((n) => /^personal_\d+$/.test(n))
    .sort();
}

// ─── Step 1: Fix concatenation bug ──────────────────────────────────────────

/** Regex that matches the concatenated emotional_tone suffix on a word boundary. */
const CONCAT_RE = /(\w)emotional_tone: ["\\]*(?:positive|negative|neutral|mixed)["\\]*/g;

/**
 * Fix a single string in-place: strip "emotional_tone: X" glued to a word.
 * Works on YAML and JSON strings alike.
 */
function fixConcatenation(str) {
  return str.replace(CONCAT_RE, "$1");
}

function fixSliceTags(filePath) {
  const orig = read(filePath);
  const fixed = fixConcatenation(orig);
  if (fixed !== orig) {
    write(filePath, fixed);
    return true;
  }
  return false;
}

function fixJsonFile(filePath) {
  const orig = read(filePath);
  const fixed = fixConcatenation(orig);
  if (fixed !== orig) {
    write(filePath, fixed);
    return true;
  }
  return false;
}

function step1_fixAllBugs(personaDir) {
  let count = 0;

  // Slice .md files (YAML frontmatter)
  const slicesDir = join(personaDir, "episodic", "slices");
  if (!existsSync(slicesDir)) return count;

  for (const year of listDirs(slicesDir)) {
    const yearDir = join(slicesDir, year);
    for (const month of listDirs(yearDir)) {
      const monthDir = join(yearDir, month);
      // _index.json
      const indexPath = join(monthDir, "_index.json");
      if (existsSync(indexPath)) {
        if (fixJsonFile(indexPath)) count++;
      }
      // Slice files — two possible layouts:
      //   Old (flat):   YYYY/MM/DD/HHMM.md
      //   New (nested): YYYY/MM/DD/HHMM/timeline/core.md
      for (const day of listDirs(monthDir)) {
        const dayDir = join(monthDir, day);
        // Old flat .md files (pre-migration)
        for (const file of listFiles(dayDir)) {
          if (file.endsWith(".md")) {
            if (fixSliceTags(join(dayDir, file))) count++;
          }
        }
        // New nested core.md files (post-migration)
        for (const hm of listDirs(dayDir)) {
          const corePath = join(dayDir, hm, "timeline", "core.md");
          if (existsSync(corePath)) {
            if (fixSliceTags(corePath)) count++;
          }
        }
      }
    }
  }

  // strands.json
  const strandsPath = join(personaDir, "episodic", "strands.json");
  if (existsSync(strandsPath)) {
    if (fixJsonFile(strandsPath)) count++;
  }

  return count;
}

// ─── Step 2: Restructure slices ─────────────────────────────────────────────

/**
 * Generate a v2-format empty previously.md for a given slice_id.
 * Matches the output of Aftrbrez's `newPreviouslyTemplate()`.
 */
function previouslyTemplate(sliceId) {
  const updated = `${sliceId.slice(0, 4)}-${sliceId.slice(5, 7)}-${sliceId.slice(8, 10)}`;
  return `# Previously On

_Active slice: ${sliceId} | Updated: ${updated}_

## 长期记忆

### User identity

_No beliefs yet._

### User patterns

_No beliefs yet._

### Agent strategies

_No beliefs yet._

## 短期记忆

### Current context

_No beliefs yet._
`;
}

function step2_restructure(personaDir) {
  const slicesDir = join(personaDir, "episodic", "slices");
  if (!existsSync(slicesDir)) return { migrated: 0, skipped: 0 };

  let migrated = 0;
  let skipped = 0;

  for (const year of listDirs(slicesDir)) {
    const yearDir = join(slicesDir, year);
    for (const month of listDirs(yearDir)) {
      const monthDir = join(yearDir, month);
      for (const day of listDirs(monthDir)) {
        const dayDir = join(monthDir, day);
        for (const file of listFiles(dayDir)) {
          if (!file.endsWith(".md")) continue;

          const sliceHm = file.replace(/\.md$/, "");
          const sliceDir = join(dayDir, sliceHm);
          const timelineDir = join(sliceDir, "timeline");
          const corePath = join(timelineDir, "core.md");

          // Idempotent: skip if already migrated
          if (existsSync(corePath)) {
            skipped++;
            continue;
          }

          const srcPath = join(dayDir, file);

          // Create directory structure
          ensureDir(timelineDir);

          // Move slice content → timeline/core.md
          const content = read(srcPath);
          write(corePath, content);

          // Write empty agent.md
          write(join(timelineDir, "agent.md"), "");

          // Write previously.md template
          const sliceId = `${year}-${month}-${day}-${sliceHm}`;
          write(join(sliceDir, "previously.md"), previouslyTemplate(sliceId));

          // Remove old flat file
          unlinkSync(srcPath);

          migrated++;
        }
      }
    }
  }

  return { migrated, skipped };
}

// ─── Step 3: Rebuild manifest.json tree ─────────────────────────────────────

function step3_updateManifest() {
  const manifestPath = join(ROOT, "manifest.json");
  const manifest = JSON.parse(read(manifestPath));

  for (const [personaId, persona] of Object.entries(manifest.personas)) {
    // Fix topics array concatenation bug
    if (Array.isArray(persona.topics)) {
      persona.topics = persona.topics.map((t) => fixConcatenation(t));
      // Remove duplicates that may have been created by the fix
      persona.topics = [...new Set(persona.topics)];
    }

    // Rebuild tree
    const tree = persona.tree?.episodic?.slices;
    if (!tree) continue;

    // Detect if tree is already in new (nested) format.
    // Old format: day entry has `_files` with `.md` files.
    // New format: day entry has HHMM subdirectories with `timeline/` entries.
    if (isAlreadyMigrated(tree)) continue;

    const newTree = {};
    for (const [year, yearObj] of Object.entries(tree)) {
      if (year === "_files") continue;
      const newYear = {};
      for (const [month, monthObj] of Object.entries(yearObj)) {
        if (month === "_files") continue;
        const newMonth = {};

        for (const [day, dayObj] of Object.entries(monthObj)) {
          if (day === "_files") {
            // Carry over month-level _index.json
            newMonth._files = dayObj;
            continue;
          }

          // dayObj was: { "_files": ["1130.md"] }
          // Now becomes: { "1130": { "timeline": { "_files": ["core.md", "agent.md"] }, "_files": ["previously.md"] } }
          const files = dayObj._files || [];
          const newDay = {};
          for (const f of files) {
            if (f.endsWith(".md")) {
              const hm = f.replace(/\.md$/, "");
              newDay[hm] = {
                timeline: { _files: ["core.md", "agent.md"] },
                _files: ["previously.md"],
              };
            }
          }
          // Only add if we found .md files
          if (Object.keys(newDay).length > 0) {
            newMonth[day] = newDay;
          }
        }

        newYear[month] = newMonth;
      }
      newTree[year] = newYear;
    }

    persona.tree.episodic.slices = newTree;
  }

  write(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return manifestPath;
}

/** Check if the tree is already in v0.5 nested format (idempotency guard). */
function isAlreadyMigrated(tree) {
  // Sample: look at the first year → first month → first day entry.
  // In the new format, day entries contain HHMM sub-keys with `timeline/`.
  for (const yearObj of Object.values(tree)) {
    if (typeof yearObj !== "object" || !yearObj) continue;
    for (const monthObj of Object.values(yearObj)) {
      if (typeof monthObj !== "object" || !monthObj) continue;
      for (const [day, dayObj] of Object.entries(monthObj)) {
        if (day === "_files") continue;
        if (typeof dayObj !== "object" || !dayObj) continue;
        // Old format: dayObj._files contains .md files
        if (Array.isArray(dayObj._files) && dayObj._files.some((f) => f.endsWith(".md"))) {
          return false; // still in old format
        }
        // New format: dayObj has HHMM-named sub-objects
        if (Object.keys(dayObj).some((k) => /^\d{4}$/.test(k))) {
          return true; // already migrated
        }
      }
    }
  }
  return false; // empty tree → needs migration
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("=== benchmark-data → Aftrbrez v0.5 migration ===\n");

  const personas = getPersonas();
  console.log(`Found ${personas.length} personas\n`);

  // Step 1
  console.log("Step 1: Fix concatenation bug...");
  let totalBugFixes = 0;
  for (const p of personas) {
    const personaDir = join(ROOT, p);
    const fixed = step1_fixAllBugs(personaDir);
    if (fixed > 0) {
      console.log(`  ${p}: ${fixed} files fixed`);
      totalBugFixes += fixed;
    }
  }
  // manifest.json topics
  const manifestPath = join(ROOT, "manifest.json");
  const manifestBefore = read(manifestPath);
  const manifestAfter = fixConcatenation(manifestBefore);
  if (manifestBefore !== manifestAfter) {
    write(manifestPath, manifestAfter);
    console.log(`  manifest.json: fixed`);
    totalBugFixes++;
  }
  console.log(`  Total: ${totalBugFixes} files fixed\n`);

  // Step 2
  console.log("Step 2: Restructure slice directories...");
  let totalMigrated = 0;
  let totalSkipped = 0;
  for (const p of personas) {
    const personaDir = join(ROOT, p);
    const { migrated, skipped } = step2_restructure(personaDir);
    if (migrated > 0 || skipped > 0) {
      console.log(`  ${p}: ${migrated} migrated, ${skipped} skipped`);
    }
    totalMigrated += migrated;
    totalSkipped += skipped;
  }
  console.log(`  Total: ${totalMigrated} migrated, ${totalSkipped} skipped\n`);

  // Step 3
  console.log("Step 3: Rebuild manifest.json tree...");
  step3_updateManifest();
  console.log("  manifest.json updated\n");

  // Summary
  console.log("=== Migration complete ===");
  console.log(`  Bug fixes:     ${totalBugFixes}`);
  console.log(`  Slices migrated: ${totalMigrated}`);
  console.log(`  Already done:    ${totalSkipped}`);
  console.log(`  Remaining (last-slice previously.md): generate with subagent`);
}

main();
