/**
 * Test that Aftrbrez's demo-fs can read the newly generated v0.8 files from
 * the local benchmark-data repo.
 */

import { setDemoPersona, readFileDemo, listFilesDemo } from "../../Aftrbrez/src/lib/demo/demo-fs.ts";

async function testPersona(personaId) {
  setDemoPersona(personaId);
  const issues = [];

  try {
    const idxRaw = await readFileDemo("memory/episodic/timeline/index.json");
    const idx = JSON.parse(idxRaw);
    if (!idx.slices?.length) issues.push("timeline/index.json has no slices");
  } catch (e) {
    issues.push(`timeline/index.json: ${e.message}`);
  }

  try {
    await readFileDemo("memory/episodic/timeline.md");
  } catch (e) {
    issues.push(`timeline.md: ${e.message}`);
  }

  try {
    const card = await readFileDemo("memory/episodic/current-previously.md");
    if (!card.includes("Format: user card v2")) issues.push("current-previously.md missing v2 stamp");
  } catch (e) {
    issues.push(`current-previously.md: ${e.message}`);
  }

  try {
    const list = await listFilesDemo("memory/episodic/slices");
    if (!list.some((e) => /^\d{4}$/.test(e.name))) issues.push("slices root missing year dirs");
  } catch (e) {
    issues.push(`slices listing: ${e.message}`);
  }

  if (issues.length) {
    console.error(`\n${personaId}:`);
    for (const issue of issues) console.error(`  ✗ ${issue}`);
    return false;
  }
  console.log(`${personaId}: OK`);
  return true;
}

const personas = Array.from({ length: 20 }, (_, i) => `personal_${String(i + 1).padStart(2, "0")}`);
let ok = 0;
for (const p of personas) {
  if (await testPersona(p)) ok++;
}
console.log(`\n=== Demo read test: ${ok}/${personas.length} passed ===`);
process.exit(ok === personas.length ? 0 : 1);
