# OSRS data sync

`sync_osrs_data.py` downloads the free, open-source data produced by the OSRS
Wiki DPS calculator, converts it to ScapeMate's existing JSON format, validates
it, and replaces the public data files atomically.

Run it from the repository root:

```bash
python scripts/sync_osrs_data.py
python scripts/sync_osrs_data.py --check
python -m unittest discover -s scripts -p "test_*.py"
```

The download is pinned to one upstream commit so equipment, monsters, and item
aliases cannot come from different revisions. `--check` is offline and is run
by CI to catch malformed or hand-edited generated files.

## Exceptions

Put data exceptions in `osrs_data_overrides.json`; do not edit generated JSON.
An ID patch must contain a human-readable `reason`, a `source` URL, and the
nested fields under `set`. A `null` value removes a field. For example:

```json
"4151": {
  "reason": "Temporary correction while the upstream change is pending.",
  "source": "https://oldschool.runescape.wiki/w/Abyssal_whip",
  "set": { "stats": { "speed": 4 } }
}
```

Category aliases adapt upstream names to the combat-style keys already used by
the app. ID aliases come from upstream and are resolved at runtime, which keeps
saved loadouts working without adding duplicate cosmetic/degraded items to
search results.

Mechanics that change damage conditionally (set effects, charges, target-based
bonuses, and special attacks) belong in typed calculator code with tests, not
in the flat data overrides.
