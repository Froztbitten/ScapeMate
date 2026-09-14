import unittest

import sync_osrs_data as sync


class EquipmentConversionTests(unittest.TestCase):
    def test_converts_equipment_and_magic_damage_units(self):
        raw = {
            "id": 42,
            "name": "Test staff",
            "image": "Test staff.png",
            "slot": "weapon",
            "isTwoHanded": True,
            "speed": 5,
            "category": "Powered Staff",
            "offensive": {"stab": 1, "slash": 2, "crush": 3, "magic": 4, "ranged": 5},
            "defensive": {"stab": 6, "slash": 7, "crush": 8, "magic": 9, "ranged": 10},
            "bonuses": {"str": 11, "ranged_str": 12, "magic_str": 135, "prayer": 2},
        }

        item = sync.convert_equipment([raw], {"Powered Staff": "Powered"})["42"]

        self.assertEqual(item["stats"]["slot"], "2h")
        self.assertEqual(item["stats"]["combatstyle"], "Powered")
        self.assertEqual(item["stats"]["magic_damage"], 13.5)


class MonsterConversionTests(unittest.TestCase):
    def test_preserves_duplicate_variant_names_with_stable_id_suffix(self):
        raw = [
            {"id": 2, "name": "Guard", "version": None, "skills": {}, "offensive": {}, "defensive": {}},
            {"id": 1, "name": "Guard", "version": None, "skills": {}, "offensive": {}, "defensive": {}},
        ]

        variants = sync.convert_monsters(raw)[0]["variants"]

        self.assertEqual(list(variants), ["No variant", "No variant (ID 2)"])
        self.assertEqual(variants["No variant"]["NPC_ID"], "1")

    def test_maps_flat_monster_fields_to_legacy_shape(self):
        raw = {
            "id": 7,
            "name": "Target",
            "version": "Hard",
            "image": "Target.png",
            "style": ["Magic", "Ranged"],
            "skills": {"def": 100, "hp": 200},
            "offensive": {},
            "defensive": {"standard": 50},
            "attributes": ["demon"],
            "weakness": {"element": "water", "severity": 40},
        }

        variant = sync.convert_monster_variant(raw)

        self.assertEqual(variant["Attack_style"], "Magic, Ranged")
        self.assertEqual(variant["Range_defence_bonus"], "50")
        self.assertEqual(variant["Elemental_weakness"], "Water")
        self.assertEqual(variant["Image"], "Target.png")


class OverrideTests(unittest.TestCase):
    def test_deep_patch_requires_documentation_and_merges(self):
        records = {"1": {"id": 1, "stats": {"speed": 4, "slot": "weapon"}}}
        sync.apply_patches(
            records,
            {
                "1": {
                    "reason": "The upstream record is temporarily incorrect.",
                    "source": "https://oldschool.runescape.wiki/",
                    "set": {"stats": {"speed": 5}},
                }
            },
            "equipment",
        )
        self.assertEqual(records["1"]["stats"], {"speed": 5, "slot": "weapon"})


if __name__ == "__main__":
    unittest.main()
