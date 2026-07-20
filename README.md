# Previously On — Benchmark Data

Seeded conversation datasets for [Previously On](https://github.com/previously-lab/agent).

## Source

All personas are derived from the [WorldMemArena](https://huggingface.co/datasets/LCZZZZ/WorldMemArena) benchmark
(arXiv:2605.29341, CC BY-NC 4.0), converted into Previously On's episodic memory format.

## Directory Structure

Each persona is a self-contained episodic memory store:

```
personal_14/                  # Caleb Martin Hebert
├── episodic/
│   ├── slices/
│   │   ├── YYYY/
│   │   │   ├── MM/
│   │   │   │   ├── DD/
│   │   │   │   │   └── HHMM.md      # time slice (YAML frontmatter + turns)
│   │   │   │   └── ...
│   │   │   └── _index.json          # monthly index
│   │   └── ...
│   └── strands.json                 # keyword → slice-path index
└── user/
    └── profile.md                   # persona profile
```

## Usage

Set `DEMO_MODE=true` in Previously On to read from this repository.
The app reads files via `raw.githubusercontent.com` — no GitHub token needed.

## Conversion

Run `scripts/batch-convert.mjs` in the Aftrbrez repo.

## License

CC BY-NC 4.0 (inherited from WorldMemArena).
