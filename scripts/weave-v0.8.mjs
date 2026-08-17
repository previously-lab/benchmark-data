/**
 * Weave v0.8 timeline indexes for benchmark-data personas.
 *
 * Reads the existing slice directory tree (already in v0.8 format) and
 * generates the derived files the Previously v0.8 runtime expects:
 *
 *   - episodic/timeline/index.json   (canonical catalog)
 *   - episodic/timeline.md           (markdown projection)
 *   - episodic/current-previously.md (v5 user card seed)
 *
 * The script is pure engineering: no LLM calls, deterministic, idempotent.
 *
 * Usage:
 *   node scripts/weave-v0.8.mjs --persona personal_01
 *   node scripts/weave-v0.8.mjs --all
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../../Aftrbrez/node_modules/gray-matter/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

// ─── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function hasFlag(flag) { return args.includes(flag); }
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const PERSONA = getArg("--persona");
const ALL = hasFlag("--all");

if (!PERSONA && !ALL) {
  console.error("Usage: node scripts/weave-v0.8.mjs --persona <id> | --all");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function listPersonas() {
  return fs.readdirSync(REPO_ROOT)
    .filter((name) => /^personal_\d+$/.test(name))
    .filter((name) => fs.statSync(path.join(REPO_ROOT, name)).isDirectory())
    .sort();
}

/** Recursively list slice directories under episodic/slices. */
function enumerateSlices(personaDir) {
  const slicesRoot = path.join(personaDir, "episodic", "slices");
  if (!fs.existsSync(slicesRoot)) return [];

  const ids = [];
  const isYear = (n) => /^\d{4}$/.test(n);
  const isPair = (n) => /^\d{2}$/.test(n);
  const isHhmm = (n) => /^\d{4}$/.test(n);

  for (const year of fs.readdirSync(slicesRoot)) {
    if (!isYear(year)) continue;
    const yearDir = path.join(slicesRoot, year);
    for (const month of fs.readdirSync(yearDir)) {
      if (!isPair(month)) continue;
      const monthDir = path.join(yearDir, month);
      for (const day of fs.readdirSync(monthDir)) {
        if (!isPair(day)) continue;
        const dayDir = path.join(monthDir, day);
        for (const hhmm of fs.readdirSync(dayDir)) {
          if (!isHhmm(hhmm)) continue;
          const corePath = path.join(dayDir, hhmm, "timeline", "core.md");
          if (fs.existsSync(corePath)) {
            ids.push({ rel: `${year}/${month}/${day}/${hhmm}`, corePath });
          }
        }
      }
    }
  }

  ids.sort((a, b) => a.rel.localeCompare(b.rel));
  return ids;
}

/** Parse a slice id like "2022-01-09-0030" from rel path. */
function relToId(rel) {
  const [y, m, d, hm] = rel.split("/");
  return `${y}-${m}-${d}-${hm}`;
}

function str(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && !Array.isArray(v)) return Object.keys(v)[0] ?? "";
  return "";
}

function strArr(v) {
  if (!Array.isArray(v)) return [];
  return v.map((e) => (typeof e === "string" ? e : str(e))).filter(Boolean);
}

function countTurns(content) {
  const trimmed = content?.trim() ?? "";
  if (!trimmed) return 0;
  let count = 0;
  const re = /^## Turn \S+ — \S+ \(\w+\)$/gm;
  while (re.exec(trimmed)) count++;
  return count;
}

/**
 * Defensive YAML frontmatter parse.
 *
 * Some benchmark slices were serialized with unquoted array items containing
 * YAML-special characters (`:`, `'`, `"`). js-yaml rejects those. We pre-quote
 * only array-item values that are not already quoted and contain such chars.
 */
function safeMatter(raw) {
  const fmMatch = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!fmMatch) return matter(raw);

  const [, start, fmBody, end] = fmMatch;
  const fixedLines = [];
  for (const line of fmBody.split(/\r?\n/)) {
    const itemMatch = line.match(/^(\s*-\s+)(.*)$/);
    if (!itemMatch) {
      fixedLines.push(line);
      continue;
    }
    const prefix = itemMatch[1];
    let value = itemMatch[2];
    const alreadyQuoted = /^(["']).*\1$/.test(value);
    if (!alreadyQuoted && /[:'"[{}]/.test(value)) {
      value = '"' + value.replace(/"/g, '\\"') + '"';
    }
    fixedLines.push(prefix + value);
  }

  const fixedRaw = start + fixedLines.join("\n") + end + raw.slice(fmMatch[0].length);
  return matter(fixedRaw);
}

/** Read a slice's core.md and produce a catalog entry. */
function parseSliceEntry(rel, corePath) {
  const raw = fs.readFileSync(corePath, "utf-8");
  const { data, content } = safeMatter(raw);
  const id = relToId(rel);
  const focus = str(data.focus);
  const summary = str(data.summary);
  const tags = strArr(data.tags);

  return {
    id,
    date: id.slice(0, 10),
    start: str(data.start) || `${id.slice(0, 10)}T00:00:00.000Z`,
    ...(data.end ? { end: str(data.end) } : {}),
    turn_count: countTurns(content),
    status: data.status === "closed" ? "closed" : "active",
    focus,
    summary,
    tags,
    ...(data.emotional_tone ? { tone: str(data.emotional_tone) } : {}),
    open_loops: strArr(data.open_loops),
    decisions: strArr(data.decisions),
    strands: [], // resolved later against global strand index
    needs_marking: !focus && !summary,
  };
}

function readStrands(personaDir) {
  const strandsPath = path.join(personaDir, "episodic", "strands.json");
  try {
    const raw = fs.readFileSync(strandsPath, "utf-8");
    return new Set(Object.keys(JSON.parse(raw)));
  } catch {
    return new Set();
  }
}

function resolveStrands(tags, strandNames) {
  return tags.filter((t) => strandNames.has(t));
}

// ─── Timeline rendering ──────────────────────────────────────────────────

function groupByEraAndDay(slices) {
  const eras = new Map();
  for (const s of slices) {
    const era = s.date.slice(0, 7);
    const day = s.date;
    if (!eras.has(era)) eras.set(era, new Map());
    const days = eras.get(era);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(s);
  }
  return [...eras.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([era, days]) => ({
      era,
      days: [...days.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([day, daySlices]) => ({
          day,
          slices: [...daySlices].sort((a, b) => b.id.localeCompare(a.id)),
        })),
    }));
}

function sliceLine(s) {
  const turns = s.turn_count ? ` · ${s.turn_count}轮` : "";
  const tone = s.tone ? ` · ${s.tone}` : "";
  const tags = s.tags.length ? ` [${s.tags.join(",")}]` : "";
  const label = s.focus || s.summary || "*(无摘要)*";
  return `- **${s.id}** ${label}${turns}${tone}${tags}`;
}

function renderTimelineMd(idx) {
  const header = [
    "# Timeline",
    "",
    `_Generated: ${idx.updated_at}_`,
    `_Slices: ${idx.slice_count}_`,
    `_Needs marking: ${idx.needs_marking}_`,
    `_Schema: ${idx._schema}_`,
    "",
  ].join("\n");

  const body = [];
  for (const era of groupByEraAndDay(idx.slices)) {
    body.push(`## ${era.era}`);
    for (const day of era.days) {
      body.push(`### ${day.day.slice(5)}`);
      for (const s of day.slices) body.push(sliceLine(s));
      body.push("");
    }
  }
  return header + "\n" + body.join("\n");
}

// ─── User card seeding ───────────────────────────────────────────────────

/** Parse the simple frontmatter used in user/profile.md. */
function parseProfileFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)---\r?\n/);
  const fields = { name: "", timezone: "UTC", locale: "en", address_as: "" };
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m) fields[m[1]] = m[2].trim();
    }
  }
  const body = match ? raw.slice(match[0].length).trim() : raw.trim();
  return { fields, body };
}

function makePastParagraph(name, body) {
  const cleaned = body
    .replace(/^Hello,?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const snippet = cleaned.slice(0, 360);
  const ellipsis = cleaned.length > 360 ? "…" : "";
  return `${name} is a persona in the Previously benchmark dataset. ` +
    `The seed profile describes: ${snippet}${ellipsis}`;
}

function buildCurrentPreviously(profilePath, personaId, lastSliceId) {
  let name = personaId;
  let timezone = "America/Chicago";
  let locale = "en";
  let addressAs = "";
  let body = "";

  if (fs.existsSync(profilePath)) {
    const parsed = parseProfileFrontmatter(fs.readFileSync(profilePath, "utf-8"));
    name = parsed.fields.name || personaId;
    timezone = parsed.fields.timezone || timezone;
    locale = parsed.fields.locale || locale;
    addressAs = parsed.fields.address_as || name.split(" ")[0];
    body = parsed.body;
  }

  const updated = new Date().toISOString();
  const lines = [
    "# Previously On",
    "",
    `_Active slice: ${lastSliceId} | Format: user card v2 | Updated: ${updated}_`,
    "",
    "## Identity",
    "",
    `- Name: ${name}`,
  ];

  if (addressAs) lines.push(`- Address them as: ${addressAs}`);
  lines.push(`- Locale: ${locale}`, `- Timezone: ${timezone}`, "");

  lines.push("## Past", "");
  lines.push(makePastParagraph(name, body || `Seed persona ${personaId}.`));
  lines.push("");

  lines.push("## Now", "", "_No active hooks._", "");
  lines.push("## Horizon", "", "_No open commitments._", "");
  lines.push("## Self-model", "", "- Treat this as read-only seed data; evolve only from real conversation turns.");

  return lines.join("\n") + "\n";
}

// ─── Manifest update ─────────────────────────────────────────────────────

function scanTree(dirPath, node) {
  for (const e of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith(".")) {
      node[e.name] = {};
      scanTree(path.join(dirPath, e.name), node[e.name]);
    } else if (e.isFile() && !e.name.startsWith(".")) {
      if (!node._files) node._files = [];
      node._files.push(e.name);
    }
  }
}

function updateManifest(personaId) {
  const manifestPath = path.join(REPO_ROOT, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const personaDir = path.join(REPO_ROOT, personaId);

  const tree = {};
  scanTree(personaDir, tree);

  const existing = manifest.personas[personaId] ?? {};
  manifest.personas[personaId] = {
    ...existing,
    tree,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

// ─── Per-persona weave ───────────────────────────────────────────────────

function weavePersona(personaId) {
  const personaDir = path.join(REPO_ROOT, personaId);
  if (!fs.existsSync(personaDir)) {
    console.error(`Persona not found: ${personaId}`);
    return false;
  }

  console.log(`\n=== ${personaId} ===`);

  const slices = enumerateSlices(personaDir);
  console.log(`  Slices found: ${slices.length}`);

  if (slices.length === 0) {
    console.log("  No slices — skipping.");
    return false;
  }

  const strandNames = readStrands(personaDir);
  const entries = slices.map(({ rel, corePath }) => parseSliceEntry(rel, corePath));
  for (const e of entries) {
    e.strands = resolveStrands(e.tags, strandNames);
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const needsMarking = entries.filter((e) => e.needs_marking).length;
  const index = {
    _schema: 1,
    updated_at: new Date().toISOString(),
    slice_count: entries.length,
    needs_marking: needsMarking,
    slices: entries,
  };

  const timelineDir = path.join(personaDir, "episodic", "timeline");
  fs.mkdirSync(timelineDir, { recursive: true });

  fs.writeFileSync(
    path.join(timelineDir, "index.json"),
    JSON.stringify(index, null, 2),
    "utf-8"
  );
  console.log(`  Wrote timeline/index.json (${entries.length} slices, ${needsMarking} dry)`);

  fs.writeFileSync(
    path.join(personaDir, "episodic", "timeline.md"),
    renderTimelineMd(index),
    "utf-8"
  );
  console.log(`  Wrote timeline.md`);

  const lastSliceId = entries[entries.length - 1].id;
  const profilePath = path.join(personaDir, "user", "profile.md");
  const currentPreviously = buildCurrentPreviously(profilePath, personaId, lastSliceId);
  fs.writeFileSync(
    path.join(personaDir, "episodic", "current-previously.md"),
    currentPreviously,
    "utf-8"
  );
  console.log(`  Wrote current-previously.md`);

  updateManifest(personaId);
  console.log(`  Updated manifest.json tree`);

  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────

const personas = ALL ? listPersonas() : [PERSONA];
console.log(`Weaving v0.8 timeline for ${personas.length} persona(s)`);

let ok = 0;
for (const p of personas) {
  if (weavePersona(p)) ok++;
}

console.log(`\n=== Done ===`);
console.log(`Personas processed: ${ok}/${personas.length}`);
