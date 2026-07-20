# AGENTS.md

## About

This repository contains seeded conversation datasets for [Previously](https://github.com/previously-lab/agent). Each persona is a self-contained episodic memory store — 30 multi-turn conversations spanning ~3 years, converted from the WorldMemArena benchmark into Previously's memory format.

## Key Facts

- **20 personas**, 600 total slices, enriched by Claude Haiku 4.5
- **Format**: YAML frontmatter + Markdown turns (Previously episodic memory format)
- **Dates**: Shifted back 3 years from WorldMemArena originals so all slices fall before 2026. Original dates were 2025–2028; shifted to 2022–2025. Use `scripts/shift-all-dates.mjs --reverse` in the Previously repo to restore.
- **License**: CC BY-NC 4.0 (inherited from WorldMemArena)
- **Source**: [WorldMemArena](https://huggingface.co/datasets/LCZZZZ/WorldMemArena) benchmark (arXiv:2605.29341)

## Directory Structure

```
personal_14/
├── episodic/
│   ├── slices/YYYY/MM/DD/HHMM.md    # time slice (YAML frontmatter + turns)
│   ├── slices/YYYY/MM/_index.json    # monthly index
│   └── strands.json                  # keyword → slice-path index
├── user/profile.md                   # persona profile
└── quality-report.json               # Haiku audit results
manifest.json                          # top-level index
```

## When Working Here

- Never modify slice content or metadata without running `scripts/apply-enrichment.mjs` (or equivalent validation) afterward — indexes and strands must stay consistent
- Dates are deliberately shifted. If someone asks about "future dates," explain the 3-year shift and point to the restore script
- The `_raw/` directory is gitignored — it holds uncommitted WorldMemArena JSON source files
- All file paths use forward slashes, even on Windows
