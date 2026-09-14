#!/usr/bin/env python3
"""Synchronize app-ready OSRS equipment and monster data.

The source is the open Weird Gloop OSRS Wiki DPS calculator dataset.  This
script converts it to the legacy JSON shapes consumed by ScapeMate, applies
reviewable local exceptions, validates the result, and writes atomically.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import tempfile
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


REPOSITORY = "weirdgloop/osrs-dps-calc"
GITHUB_API = f"https://api.github.com/repos/{REPOSITORY}/commits/main"
SOURCE_FILES = {
    "equipment": "cdn/json/equipment.json",
    "monsters": "cdn/json/monsters.json",
    "aliases": "cdn/json/equipment_aliases.json",
}

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = REPO_ROOT / "frontend" / "public"
OVERRIDES_PATH = SCRIPT_DIR / "osrs_data_overrides.json"
OUTPUT_PATHS = {
    "equipment": PUBLIC_DIR / "weapons_armor_with_stats.json",
    "monsters": PUBLIC_DIR / "monsters_bosses.json",
    "aliases": PUBLIC_DIR / "equipment_aliases.json",
    "metadata": PUBLIC_DIR / "osrs_data_source.json",
}

MIN_EQUIPMENT = 5_000
MIN_MONSTER_VARIANTS = 2_500


class DataValidationError(ValueError):
    """Raised when source or generated data fails a safety check."""


def fetch_json(url: str, attempts: int = 3) -> Any:
    """Fetch JSON with a timeout and bounded retries."""
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json, application/json",
            "User-Agent": "ScapeMate-OSRS-data-sync/1.0",
        },
    )
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=45) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            if attempt < attempts - 1:
                time.sleep(2**attempt)
    raise RuntimeError(f"Unable to fetch {url}: {last_error}") from last_error


def load_sources() -> tuple[dict[str, Any], str]:
    """Pin all source downloads to one upstream commit for consistency."""
    commit = fetch_json(GITHUB_API)
    sha = commit.get("sha")
    if not isinstance(sha, str) or len(sha) != 40:
        raise DataValidationError("GitHub did not return a valid source commit SHA")

    sources: dict[str, Any] = {}
    for name, relative_path in SOURCE_FILES.items():
        url = f"https://raw.githubusercontent.com/{REPOSITORY}/{sha}/{relative_path}"
        sources[name] = fetch_json(url)
    return sources, sha


def stringify(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, list):
        return ", ".join(str(part) for part in value)
    return str(value)


def put_if_present(target: dict[str, str], key: str, value: Any) -> None:
    converted = stringify(value)
    if converted not in (None, ""):
        target[key] = converted


def wiki_image_url(filename: Any) -> str:
    if not isinstance(filename, str) or not filename:
        return ""
    return (
        "https://oldschool.runescape.wiki/w/Special:Redirect/file/"
        + quote(filename, safe="")
    )


def convert_equipment(
    raw_items: list[dict[str, Any]], category_aliases: dict[str, str]
) -> dict[str, dict[str, Any]]:
    converted: dict[str, dict[str, Any]] = {}
    for raw in raw_items:
        item_id = raw.get("id")
        name = raw.get("name")
        if not isinstance(item_id, int) or not isinstance(name, str) or not name:
            raise DataValidationError(f"Invalid equipment record: {raw!r}")
        if str(item_id) in converted:
            raise DataValidationError(f"Duplicate equipment ID {item_id}")

        offensive = raw.get("offensive") or {}
        defensive = raw.get("defensive") or {}
        bonuses = raw.get("bonuses") or {}
        category = raw.get("category")
        combat_style = category_aliases.get(category, category)
        slot = "2h" if raw.get("isTwoHanded") else raw.get("slot")

        stats = {
            "stab_attack": offensive.get("stab", 0),
            "slash_attack": offensive.get("slash", 0),
            "crush_attack": offensive.get("crush", 0),
            "magic_attack": offensive.get("magic", 0),
            "ranged_attack": offensive.get("ranged", 0),
            "stab_defence": defensive.get("stab", 0),
            "slash_defence": defensive.get("slash", 0),
            "crush_defence": defensive.get("crush", 0),
            "magic_defence": defensive.get("magic", 0),
            "ranged_defence": defensive.get("ranged", 0),
            "melee_strength": bonuses.get("str", 0),
            "ranged_strength": bonuses.get("ranged_str", 0),
            # Upstream stores tenths of a percentage point.
            "magic_damage": bonuses.get("magic_str", 0) / 10,
            "prayer": bonuses.get("prayer", 0),
            "slot": slot,
            "speed": raw.get("speed", 0),
            "combatstyle": combat_style,
        }
        converted[str(item_id)] = {
            "id": item_id,
            "name": name,
            "image_url": wiki_image_url(raw.get("image")),
            "stats": stats,
        }

    return dict(sorted(converted.items(), key=lambda pair: int(pair[0])))


def convert_monster_variant(raw: dict[str, Any]) -> dict[str, str]:
    skills = raw.get("skills") or {}
    offensive = raw.get("offensive") or {}
    defensive = raw.get("defensive") or {}
    immunity = raw.get("immunities") or {}
    weakness = raw.get("weakness") or {}
    variant: dict[str, str] = {}

    fields = {
        "NPC_ID": raw.get("id"),
        # The existing monster UI constructs the Wiki URL from this filename.
        "Image": raw.get("image"),
        "Combat_level": raw.get("level"),
        "Attack_speed": raw.get("speed"),
        "Attack_style": raw.get("style"),
        "Size": raw.get("size"),
        "Max_hit": raw.get("max_hit"),
        "Attack_level": skills.get("atk"),
        "Defence_level": skills.get("def"),
        "Hitpoints": skills.get("hp"),
        "Magic_level": skills.get("magic"),
        "Ranged_level": skills.get("ranged"),
        "Strength_level": skills.get("str"),
        "Attack_bonus": offensive.get("atk"),
        "Magic_attack_bonus": offensive.get("magic"),
        "Magic_Damage_bonus": offensive.get("magic_str"),
        "Range_attack_bonus": offensive.get("ranged"),
        "Ranged_Strength_bonus": offensive.get("ranged_str"),
        "Strength_bonus": offensive.get("str"),
        "Flat_armour": defensive.get("flat_armour"),
        "Crush_defence_bonus": defensive.get("crush"),
        "Magic_defence_bonus": defensive.get("magic"),
        "Heavy_range_defence_bonus": defensive.get("heavy"),
        "Standard_range_defence_bonus": defensive.get("standard"),
        # Preserve the field read by older calculator code.
        "Range_defence_bonus": defensive.get("standard"),
        "Light_range_defence_bonus": defensive.get("light"),
        "Slash_defence_bonus": defensive.get("slash"),
        "Stab_defence_bonus": defensive.get("stab"),
        "Monster_attribute": raw.get("attributes"),
        "Elemental_weakness": (
            weakness.get("element").capitalize()
            if isinstance(weakness.get("element"), str)
            else weakness.get("element")
        ),
        "Elemental_weakness_percent": weakness.get("severity"),
        "Burn_immune": immunity.get("burn"),
        "Is_slayer_monster": raw.get("is_slayer_monster"),
    }
    for key, value in fields.items():
        put_if_present(variant, key, value)
    return variant


def convert_monsters(raw_monsters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    ordered = sorted(
        raw_monsters,
        key=lambda monster: (
            str(monster.get("name", "")).casefold(),
            str(monster.get("version") or "").casefold(),
            int(monster.get("id", -1)),
        ),
    )
    for raw in ordered:
        name = raw.get("name")
        monster_id = raw.get("id")
        if not isinstance(name, str) or not name or not isinstance(monster_id, int):
            raise DataValidationError(f"Invalid monster record: {raw!r}")

        monster = grouped.setdefault(
            name, {"name": name, "variants": {}, "selectedVariant": None}
        )
        base_key = str(raw.get("version") or "").strip() or "No variant"
        key = base_key
        if key in monster["variants"]:
            key = f"{base_key} (ID {monster_id})"
            if key in monster["variants"]:
                raise DataValidationError(
                    f"Duplicate monster variant {name!r} / {base_key!r} / {monster_id}"
                )
        monster["variants"][key] = convert_monster_variant(raw)

    return sorted(grouped.values(), key=lambda monster: monster["name"].casefold())


def deep_merge(target: dict[str, Any], changes: dict[str, Any]) -> None:
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            deep_merge(target[key], value)
        elif value is None:
            target.pop(key, None)
        else:
            target[key] = copy.deepcopy(value)


def apply_patches(
    records: Any, patches: dict[str, dict[str, Any]], record_type: str
) -> None:
    if record_type == "equipment":
        by_id = {record_id: [record] for record_id, record in records.items()}
    else:
        by_id: dict[str, list[dict[str, Any]]] = {}
        for monster in records:
            for variant in monster["variants"].values():
                if "NPC_ID" in variant:
                    by_id.setdefault(variant["NPC_ID"], []).append(variant)

    for record_id, patch in patches.items():
        reason = patch.get("reason")
        source = patch.get("source")
        changes = patch.get("set")
        if not all(isinstance(value, str) and value.strip() for value in (reason, source)):
            raise DataValidationError(
                f"Override {record_type} {record_id} needs a reason and source"
            )
        if not isinstance(changes, dict):
            raise DataValidationError(
                f"Override {record_type} {record_id} needs a 'set' object"
            )
        if record_id not in by_id:
            raise DataValidationError(
                f"Override references missing {record_type} ID {record_id}"
            )
        for record in by_id[record_id]:
            deep_merge(record, changes)


def filter_records(
    equipment: dict[str, dict[str, Any]],
    monsters: list[dict[str, Any]],
    overrides: dict[str, Any],
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    equipment_exclusions = {str(value) for value in overrides["equipment"]["exclude_ids"]}
    equipment = {
        item_id: item
        for item_id, item in equipment.items()
        if item_id not in equipment_exclusions
    }

    monster_exclusions = {str(value) for value in overrides["monsters"]["exclude_ids"]}
    for monster in monsters:
        monster["variants"] = {
            key: variant
            for key, variant in monster["variants"].items()
            if variant.get("NPC_ID") not in monster_exclusions
        }
    monsters = [monster for monster in monsters if monster["variants"]]
    return equipment, monsters


def validate_outputs(
    equipment: dict[str, Any], monsters: list[dict[str, Any]], aliases: dict[str, int]
) -> None:
    valid_slots = {
        "2h",
        "ammo",
        "body",
        "cape",
        "feet",
        "hands",
        "head",
        "legs",
        "neck",
        "ring",
        "shield",
        "weapon",
    }
    known_combat_styles = set(load_json(PUBLIC_DIR / "combatStyles.json"))
    if len(equipment) < MIN_EQUIPMENT:
        raise DataValidationError(
            f"Equipment count dropped to {len(equipment)} (minimum {MIN_EQUIPMENT})"
        )
    for key, item in equipment.items():
        if str(item.get("id")) != key or not item.get("name"):
            raise DataValidationError(f"Invalid generated equipment record {key}")
        stats = item.get("stats")
        if not isinstance(stats, dict) or not stats.get("slot"):
            raise DataValidationError(f"Equipment {key} has no slot")
        if stats["slot"] not in valid_slots:
            raise DataValidationError(
                f"Equipment {key} has unsupported slot {stats['slot']!r}"
            )
        combat_style = stats.get("combatstyle")
        if combat_style and combat_style not in known_combat_styles:
            raise DataValidationError(
                f"Equipment {key} has unsupported combat style {combat_style!r}; "
                "add a documented category alias"
            )

    variant_count = 0
    for monster in monsters:
        if not monster.get("name") or not isinstance(monster.get("variants"), dict):
            raise DataValidationError("Invalid generated monster group")
        for variant in monster["variants"].values():
            monster_id = variant.get("NPC_ID")
            if not monster_id:
                raise DataValidationError("Monster variant has no NPC ID")
            if any(not isinstance(value, str) for value in variant.values()):
                raise DataValidationError(
                    f"Monster {monster_id} contains a non-string legacy field"
                )
            variant_count += 1
    if variant_count < MIN_MONSTER_VARIANTS:
        raise DataValidationError(
            f"Monster count dropped to {variant_count} (minimum {MIN_MONSTER_VARIANTS})"
        )

    unresolved = [canonical for canonical in aliases.values() if str(canonical) not in equipment]
    if unresolved:
        raise DataValidationError(
            f"{len(unresolved)} equipment aliases point to missing canonical records"
        )


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def write_json_atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json_bytes(value)
    with tempfile.NamedTemporaryFile(
        mode="wb", dir=path.parent, prefix=f".{path.name}.", delete=False
    ) as temporary:
        temporary.write(payload)
        temporary.flush()
        os.fsync(temporary.fileno())
        temporary_path = Path(temporary.name)
    os.replace(temporary_path, path)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def run_sync() -> None:
    overrides = load_json(OVERRIDES_PATH)
    sources, sha = load_sources()
    equipment = convert_equipment(
        sources["equipment"], overrides["equipment"]["category_aliases"]
    )
    monsters = convert_monsters(sources["monsters"])
    equipment, monsters = filter_records(equipment, monsters, overrides)
    apply_patches(equipment, overrides["equipment"]["patches"], "equipment")
    apply_patches(monsters, overrides["monsters"]["patches"], "monsters")

    raw_aliases = {
        str(alias): int(canonical)
        for alias, canonical in sources["aliases"].items()
        if str(alias) not in equipment
    }
    aliases = {
        alias: canonical
        for alias, canonical in raw_aliases.items()
        if str(canonical) in equipment
    }
    dropped_alias_count = len(raw_aliases) - len(aliases)
    aliases = dict(sorted(aliases.items(), key=lambda pair: int(pair[0])))
    validate_outputs(equipment, monsters, aliases)

    hashes = {
        "equipment": hashlib.sha256(json_bytes(equipment)).hexdigest(),
        "monsters": hashlib.sha256(json_bytes(monsters)).hexdigest(),
        "aliases": hashlib.sha256(json_bytes(aliases)).hexdigest(),
    }
    source_commit = sha
    if OUTPUT_PATHS["metadata"].exists():
        previous_metadata = load_json(OUTPUT_PATHS["metadata"])
        if previous_metadata.get("sha256") == hashes:
            source_commit = previous_metadata.get("source_commit", sha)

    metadata = {
        "source": f"https://github.com/{REPOSITORY}",
        "source_commit": source_commit,
        "equipment_count": len(equipment),
        "monster_variant_count": sum(len(m["variants"]) for m in monsters),
        "equipment_alias_count": len(aliases),
        "unresolved_alias_count": dropped_alias_count,
        "sha256": hashes,
    }

    write_json_atomic(OUTPUT_PATHS["equipment"], equipment)
    write_json_atomic(OUTPUT_PATHS["monsters"], monsters)
    write_json_atomic(OUTPUT_PATHS["aliases"], aliases)
    write_json_atomic(OUTPUT_PATHS["metadata"], metadata)
    print(
        f"Synced {len(equipment)} equipment records, "
        f"{metadata['monster_variant_count']} monster variants, and "
        f"{len(aliases)} equipment aliases from {sha[:12]} "
        f"({dropped_alias_count} unresolved upstream alias skipped)."
    )


def check_existing() -> None:
    equipment = load_json(OUTPUT_PATHS["equipment"])
    monsters = load_json(OUTPUT_PATHS["monsters"])
    aliases = load_json(OUTPUT_PATHS["aliases"])
    metadata = load_json(OUTPUT_PATHS["metadata"])
    validate_outputs(equipment, monsters, aliases)

    expected_hashes = {
        "equipment": hashlib.sha256(json_bytes(equipment)).hexdigest(),
        "monsters": hashlib.sha256(json_bytes(monsters)).hexdigest(),
        "aliases": hashlib.sha256(json_bytes(aliases)).hexdigest(),
    }
    if metadata.get("sha256") != expected_hashes:
        raise DataValidationError("Data files do not match osrs_data_source.json")
    expected_counts = {
        "equipment_count": len(equipment),
        "monster_variant_count": sum(len(m["variants"]) for m in monsters),
        "equipment_alias_count": len(aliases),
    }
    for field, expected in expected_counts.items():
        if metadata.get(field) != expected:
            raise DataValidationError(
                f"Metadata {field} is {metadata.get(field)!r}, expected {expected}"
            )
    print("Existing OSRS data files passed validation and checksum checks.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check", action="store_true", help="validate checked-in outputs without network access"
    )
    args = parser.parse_args()
    if args.check:
        check_existing()
    else:
        run_sync()


if __name__ == "__main__":
    main()
