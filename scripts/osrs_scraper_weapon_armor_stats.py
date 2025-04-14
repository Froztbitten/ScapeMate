import requests
import json
import re
import time
import os

# --- Configuration ---
API_BASE_URL = "https://oldschool.runescape.wiki/api.php"
INPUT_FILE = "osrs_all_items.json"
OUTPUT_FILE = "osrs_all_items_with_stats.json"
TEMP_OUTPUT_FILE = "osrs_all_items_with_stats_temp.json" # Temporary file for partial saving
REQUEST_DELAY = 0.6  # Delay between API calls

session = requests.Session()
session.headers.update({
    'User-Agent': 'OSRSItemStatsParser/1.0 (https://example.com/your-project; your-email@example.com) - Contact me if issues arise'
    # PLEASE customize the User-Agent string
})

# --- Regex patterns for parsing Combat Stat parameters ---
STAT_PATTERNS = {
    "id": re.compile(r"id\s*=\s*(\d+)", re.I),
    # Attack Bonuses
    "stab_attack": re.compile(r"astab\s*=\s*([+-]?\d+)", re.I),
    "slash_attack": re.compile(r"aslash\s*=\s*([+-]?\d+)", re.I),
    "crush_attack": re.compile(r"acrush\s*=\s*([+-]?\d+)", re.I),
    "magic_attack": re.compile(r"amagic\s*=\s*([+-]?\d+)", re.I),
    "ranged_attack": re.compile(r"arange\s*=\s*([+-]?\d+)", re.I),
    # Defence Bonuses
    "stab_defence": re.compile(r"dstab\s*=\s*([+-]?\d+)", re.I),
    "slash_defence": re.compile(r"dslash\s*=\s*([+-]?\d+)", re.I),
    "crush_defence": re.compile(r"dcrush\s*=\s*([+-]?\d+)", re.I),
    "magic_defence": re.compile(r"dmagic\s*=\s*([+-]?\d+)", re.I),
    "ranged_defence": re.compile(r"drange\s*=\s*([+-]?\d+)", re.I),
    # Other Bonuses
    "melee_strength": re.compile(r"str\s*=\s*([+-]?\d+)", re.I),
    "ranged_strength": re.compile(r"rstr\s*=\s*([+-]?\d+)", re.I),
    "magic_damage": re.compile(r"mdmg\s*=\s*([+-]?\d+(?:\.\d+)?%?)", re.I),
    "prayer": re.compile(r"prayer\s*=\s*([+-]?\d+)", re.I),
    "slot": re.compile(r"slot\s*=\s*(\w+)", re.I),
    "speed": re.compile(r"speed\s*=\s*(\d+)", re.I),
    "attackrange": re.compile(r"attackrange\s*=\s*(\d+|\w+)", re.I),
    "combatstyle": re.compile(r"combatstyle\s*=\s*(\w+)", re.I)
}


def parse_stat_value(match):
    """Safely parses a numeric stat value from a regex match, defaulting to 0."""
    if not match:
        return 0
    value_str = match.group(1).strip()
    try:
        # Remove common non-numeric chars for stats before converting
        cleaned_value = value_str.replace('+', '').replace('%', '').strip()
        # Use float first in case of magic_dmg being decimal, then convert non-float stats to int
        num_val = float(cleaned_value)
        # Check if it has a decimal part - if not, return as int
        if num_val == int(num_val):
            return int(num_val)
        else:
            # Keep magic damage potentially as float if it had decimals (though wiki often uses integers for %)
            # For simplicity here, we'll cast all to int, assuming % means integer percentage points
            return int(num_val)
    except (ValueError, TypeError):
        try :
          return str(value_str)
        except (ValueError, TypeError):
            return 0  # Default to 0 if conversion fails


def fetch_and_parse_item_stats(item_name):
    """Fetches the wikitext for an item and parses its combat stats."""
    print(f"Fetching wikitext for '{item_name}'...")

    try:
        params = {
            "action": "parse",
            "format": "json",
            "page": item_name,
            "prop": "wikitext",
        }
        response = session.get(API_BASE_URL, params=params)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"  Network error fetching wikitext for '{item_name}': {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"  Error decoding JSON response for wikitext of '{item_name}': {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        return None

    if 'error' in data:
        print(f"  API Error for '{item_name}': {data['error'].get('info', 'Unknown')}")
        return None

    # Extract the wikitext content
    wikitext = data.get('parse', {}).get('wikitext', {}).get('*')

    if not wikitext:
        print(f"  No wikitext found for '{item_name}'.")
        return None

    # Parse the Combat Stats
    parsed_stats = {}
    try:
        for stat_key, pattern in STAT_PATTERNS.items():
            match = pattern.search(wikitext)
            parsed_stats[stat_key] = parse_stat_value(match)
    except re.error as e:
        print(f"  Regex error processing item '{item_name}': {e}")
        return None

    return parsed_stats

def save_partial_data(data):
    """Saves the current state of the data to a temporary JSON file."""
    try:
        with open(TEMP_OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"  Successfully saved partial data to {TEMP_OUTPUT_FILE}")
    except IOError as e:
        print(f"  Error writing partial data to file {TEMP_OUTPUT_FILE}: {e}")
    except Exception as e:
        print(f"  An unexpected error occurred during file writing: {e}")

# --- Main Execution ---
if __name__ == "__main__":
    print("Starting OSRS Item Stats Scraper...")

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            all_items_by_slot = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{INPUT_FILE}' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON in '{INPUT_FILE}'.")
        sys.exit(1)

    updated_items_by_slot = {}  # Create a new dictionary to store all updated data

    for slot_name, item_names in all_items_by_slot.items():
        print(f"\n\n--- Processing slot: {slot_name} ---")
        updated_items_by_slot[slot_name] = []  # Create an empty list for this slot
        for item_name in item_names:
            stats = fetch_and_parse_item_stats(item_name)
            if stats:
                updated_items_by_slot[slot_name].append({
                    "name": item_name,
                    "stats": stats
                })
                save_partial_data(updated_items_by_slot)  # Save after each item
            time.sleep(REQUEST_DELAY)
    # --- Write all data to a single JSON file ---
    print(f"\n\n--- Writing ALL item data to {OUTPUT_FILE} ---")
    try:
        if os.path.exists(TEMP_OUTPUT_FILE):
          os.rename(TEMP_OUTPUT_FILE, OUTPUT_FILE)
        print(f"  Successfully saved ALL items data to {OUTPUT_FILE}")
    except IOError as e:
        print(f"  Error writing to file {OUTPUT_FILE}: {e}")
    except Exception as e:
        print(f"  An unexpected error occurred during file writing: {e}")
    print("\nScript finished.")
