#!/usr/bin/env node
/**
 * recover-2025-slices.mjs
 *
 * Recovers the 58 missing slices from git history (commit 5384e86).
 * These are the 2028-year slices from WorldMemArena that were not shifted
 * to 2025 during commit 639d068 ("date shift 3 years").
 *
 * Steps:
 *  1. For each persona, find all .md files under 2028/
 *  2. Shift dates by -3 years (2028 → 2025)
 *  3. Write to 2025/ directory structure
 *  4. Process _index.json files the same way
 *  5. Update strands.json (replace 2028 paths with 2025 paths)
 *  6. Update manifest.json tree (add 2025 entries)
 *  7. Remove 2028/ directories
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { readdirSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PERSONAS = Array.from({ length: 20 }, (_, i) =>
  `personal_${String(i + 1).padStart(2, '0')}`
);

/**
 * Shift a date string by -3 years.
 * Handles both ISO timestamps ("2028-03-08T01:40:00.000Z") and
 * date-only strings ("2028-03-08", "2028-03").
 */
function shiftYear(str) {
  return str.replace(/^(\d{4})/, (_, y) => String(Number(y) - 3));
}

/**
 * Recursively collect all .md and _index.json files under a directory.
 */
function collectFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.name.endsWith('.md') || entry.name === '_index.json') {
      files.push(full);
    }
  }
  return files;
}

/**
 * Shift all dates in a .md slice file.
 */
function shiftSliceContent(content) {
  // Shift YAML frontmatter dates: slice_id, start, end
  content = content.replace(/^slice_id:\s*(\d{4})/gm, (_, y) =>
    `slice_id: ${Number(y) - 3}`
  );
  content = content.replace(/^start:\s*"(\d{4})/gm, (_, y) =>
    `start: "${Number(y) - 3}`
  );
  content = content.replace(/^end:\s*"(\d{4})/gm, (_, y) =>
    `end: "${Number(y) - 3}`
  );

  // Shift turn header timestamps
  // Pattern: ## Turn N — YYYY-MM-DDTHH:MM:SS.sssZ (user/agent)
  content = content.replace(
    /^(## Turn \d+ — )(\d{4})(-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/gm,
    (_, prefix, year, rest) => `${prefix}${Number(year) - 3}${rest}`
  );

  return content;
}

/**
 * Shift all dates in a _index.json file.
 */
function shiftIndexContent(content) {
  const data = JSON.parse(content);

  // Shift month field
  if (data.month) {
    data.month = shiftYear(data.month);
  }

  // Shift each slice entry
  if (Array.isArray(data.slices)) {
    for (const slice of data.slices) {
      if (slice.id) slice.id = shiftYear(slice.id);
      if (slice.start) slice.start = shiftYear(slice.start);
      if (slice.end) slice.end = shiftYear(slice.end);
    }
  }

  return JSON.stringify(data, null, 2) + '\n';
}

/**
 * Update strands.json: replace 2028 paths with 2025 paths, and add missing
 * tags from the newly recovered slices.
 */
function updateStrands(persona, recoveredSlicePaths) {
  const strandsPath = join(ROOT, persona, 'episodic', 'strands.json');
  if (!existsSync(strandsPath)) {
    console.warn(`  WARNING: strands.json not found for ${persona}`);
    return;
  }

  let content = readFileSync(strandsPath, 'utf8');

  // Replace 2028/ with 2025/ in slice paths
  // Only replace in the strands.json (the path references)
  content = content.replace(/("2028\/)/g, '"2025/');

  // For each recovered slice, extract its tags from the frontmatter
  // and add strand entries if missing
  for (const relPath of recoveredSlicePaths) {
    const shiftedPath = relPath.replace(/^2028\//, '2025/');
    const sliceContent = readFileSync(
      join(ROOT, persona, 'episodic', 'slices', shiftedPath),
      'utf8'
    );

    // Extract YAML tags
    const yamlMatch = sliceContent.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) continue;

    const yaml = yamlMatch[1];
    const tagMatch = yaml.match(/^tags:\s*\n([\s\S]*?)(?=\n\S|\n---|$)/m);
    if (!tagMatch) continue;

    const tags = tagMatch[1]
      .split('\n')
      .map((t) => t.trim().replace(/^-\s*/, ''))
      .filter((t) => t && !t.includes('emotional_tone:'));

    // Parse strands.json
    const strands = JSON.parse(content);

    for (const tag of tags) {
      if (!strands[tag]) {
        strands[tag] = [];
      }
      if (!strands[tag].includes(shiftedPath)) {
        strands[tag].push(shiftedPath);
        strands[tag].sort();
      }
    }

    content = JSON.stringify(strands, null, 2) + '\n';
  }

  writeFileSync(strandsPath, content, 'utf8');
  console.log(`  Updated strands.json`);
}

/**
 * Update manifest.json: add 2025 entries to each persona's tree.
 */
function updateManifest(persona, slices2025) {
  const manifestPath = join(ROOT, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const tree = manifest.personas[persona].tree.episodic.slices;

  // Build the 2025 tree structure
  if (!tree['2025']) {
    tree['2025'] = {};
  }

  for (const { month, day, file } of slices2025) {
    if (!tree['2025'][month]) {
      tree['2025'][month] = { _files: [] };
    }
    if (!tree['2025'][month][day]) {
      tree['2025'][month][day] = { _files: [] };
    }
    if (!tree['2025'][month][day]._files.includes(file)) {
      tree['2025'][month][day]._files.push(file);
      tree['2025'][month][day]._files.sort();
    }

    // Ensure _index.json entry exists in month
    if (!tree['2025'][month]._files) {
      tree['2025'][month]._files = [];
    }
    if (!tree['2025'][month]._files.includes('_index.json')) {
      tree['2025'][month]._files.push('_index.json');
      tree['2025'][month]._files.sort();
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`  Updated manifest.json tree`);
}

// ── Main ────────────────────────────────────────────────────────────

let totalRecovered = 0;
const manifestUpdates = {};

for (const persona of PERSONAS) {
  const slices2028Dir = join(ROOT, persona, 'episodic', 'slices', '2028');
  const files = collectFiles(slices2028Dir);

  if (files.length === 0) {
    console.log(`${persona}: no 2028 slices to recover`);
    continue;
  }

  console.log(`${persona}: recovering ${files.filter(f => f.endsWith('.md')).length} slices...`);

  const recoveredPaths = [];
  const slices2025 = [];

  for (const srcPath of files) {
    const rel = relative(slices2028Dir, srcPath).replace(/\\/g, '/');
    // rel is e.g. "03/08/0140.md" or "03/_index.json"
    const shiftedRel = shiftYear(rel);
    // shiftedRel is e.g. "03/08/0140.md" or "03/_index.json" but dates within need shifting too

    const destPath = join(ROOT, persona, 'episodic', 'slices', '2025', shiftedRel);

    // Ensure target directory exists
    mkdirSync(dirname(destPath), { recursive: true });

    const rawContent = readFileSync(srcPath, 'utf8');

    let shiftedContent;
    if (srcPath.endsWith('_index.json')) {
      shiftedContent = shiftIndexContent(rawContent);
    } else {
      shiftedContent = shiftSliceContent(rawContent);

      // Parse path components for manifest update
      const parts = shiftedRel.replace(/\\/g, '/').split('/');
      // parts[0] = month, parts[1] = day, parts[2] = HHMM.md
      slices2025.push({
        month: parts[0],
        day: parts[1],
        file: parts[2],
      });

      recoveredPaths.push(`2025/${shiftedRel.replace(/\\/g, '/')}`);
    }

    writeFileSync(destPath, shiftedContent, 'utf8');
  }

  // Count recovered md files
  const mdCount = recoveredPaths.length;
  totalRecovered += mdCount;

  // Update strands.json
  updateStrands(persona, recoveredPaths);

  // Store for batch manifest update
  manifestUpdates[persona] = slices2025;

  // Remove 2028 directory
  rmSync(slices2028Dir, { recursive: true, force: true });
  console.log(`  Recovered ${mdCount} slices, removed 2028/`);
}

// Batch update manifest
console.log('\nUpdating manifest.json...');
for (const [persona, slices2025] of Object.entries(manifestUpdates)) {
  if (slices2025.length > 0) {
    updateManifest(persona, slices2025);
  }
}

console.log(`\nDone. Total slices recovered: ${totalRecovered}`);
console.log('Next steps: verify with git diff, then commit.');
