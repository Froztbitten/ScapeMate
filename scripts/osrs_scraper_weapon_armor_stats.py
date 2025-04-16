import requests
import json
import re
import time
import os
import sys

# --- Configuration ---
API_BASE_URL = "https://oldschool.runescape.wiki/api.php"
INPUT_FILE = "osrs_all_items.json"
OUTPUT_FILE = "../frontend/public/weapons_armor_with_stats.json"
TEMP_OUTPUT_FILE = "../frontend/public/osrs_all_items_with_stats_temp.json"  # Temporary file for partial saving
CATEGORIES_TO_FETCH = [ "Category:Weapons", "Category:Ammunition_slot_items", "Category:Body_slot_items", "Category:Cape_slot_items",
                       "Category:Feet_slot_items", "Category:Hands_slot_items", "Category:Head_slot_items", "Category:Legs_slot_items",
                       "Category:Neck_slot_items", "Category:Ring_slot_items", "Category:Shield_slot_items", ]
REQUEST_DELAY = 0.3
LIMIT_PER_REQUEST = 500

STAT_PATTERNS = {
    "id": re.compile(r"id1?\s*=\s*(\d+)", re.I),
    "image_name": re.compile(r"image1?\s*=\s*\[\[(File:([A-z ()\-'1-9]*)\.png)\]\]", re.I),
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
COSMETIC_SUFFIXES = ["(g)", "(t)", "(or)", "(sk)", "(b)", "(cr)", "(u)", "(guthix)", "(saradomin)", "(zamorak)",
                     "(amlodd)", "(cadarn)", "(crwys)", "(iorwerth)", "(ithell)", "(meilyr)", "(trahaearn)",
                     "(h1)", "(h2)", "(h3)", "(h4)", "(h5)", "(bh)", "(last man standing)", "(beta)", "(c)", "(deadman mode)"]  # Gold, Treasure, Ornament, Saradomin/Guthix/Zamorak kit
COSMETIC_KEYWORDS = [" ornament kit"]  # Include space to avoid partial matches like 'bracelet'

session = requests.Session()
session.headers.update({
    'User-Agent': 'ScapeMateScripts/1.0 (https://github.com/Froztbitten/ScapeMate; devonsphillips36@gmail.com) - Contact me if issues arise'
})


def get_all_category_members(session, category_title):
    members = {}  # Changed to a dictionary
    last_continue = {}  # Dictionary to hold continuation parameters

    while True:
        # Parameters for the API request
        params = {
            "action": "query",
            "format": "json",
            "list": "categorymembers",
            "cmtitle": category_title,
            "cmlimit": LIMIT_PER_REQUEST,
            **last_continue  # Add continuation parameters from the previous response
        }

        try:
            # Make the API request
            response = session.get(API_BASE_URL, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            data = response.json()

            # Check for API warnings or errors within the JSON response
            if 'warnings' in data:
                print(f"  API Warning for {category_title}: {data['warnings']}", file=sys.stderr)
            if 'error' in data:
                print(f"  API Error for {category_title}: {data['error']}", file=sys.stderr)
                return {}  # Return empty dictionary on error

            # Extract members from the current batch
            if 'query' in data and 'categorymembers' in data['query']:
                batch_members = data['query']['categorymembers']
                if not batch_members:
                  # Handle cases where category might be empty or query fails unexpectedly
                  print(f"  No members found in this batch for {category_title}.", file=sys.stderr)
                  # Check if this was the first request or if continuation was expected
                  if not last_continue:
                      print(f"  Category '{category_title}' might be empty or does not exist.", file=sys.stderr)
                  break  # Exit loop if no members found

                for member in batch_members:
                  if not member['title'].lower().endswith(tuple(COSMETIC_SUFFIXES)):
                    info = fetch_and_parse_item_stats(member.get('title'))
                    
                    stat_sum = 0
                    for key,value in info.items():
                      if key not in ['id','image_name','slot','combatstyle','speed','attackrange']:
                        stat_sum += value
                    
                    if stat_sum == 0:
                      print(f"  Skipping '{member.get('title')}' due to no stats.")
                      continue
                      
                    if not info:
                      print(f"  Skipping '{member.get('title')}' due to invalid or missing item info.")
                      continue
                      
                    item_id = info.get('id')
                    if not item_id:
                      print(f"  Skipping '{member.get('title')}' due to invalid or missing item id.")
                      print(f"  Value:\n  {info}")
                      continue

                    image_url = fetch_item_image(info.get('image_name'))
                    if not image_url:
                      print(f"  Skipping '{member.get('title')}' due to invalid or missing image.")
                      continue

                    del info['id']
                    del info['image_name']

                    members[int(item_id)] = {  # Use item_id as the key
                      "name": member.get('title'),
                      "id": item_id,
                      "image_url": image_url,
                      "stats": info
                    }

                    save_partial_data(members)  # Save after each item
                    time.sleep(REQUEST_DELAY)
            else:
                print(
                    f"  Unexpected response structure for {category_title}. 'query' or 'categorymembers' missing.",
                    file=sys.stderr)
                print(f"  Response data: {data}", file=sys.stderr)
                return {}  # Return empty dictionary on unexpected structure

            # Check for continuation
            if 'continue' in data:
                last_continue = data['continue']
                # Be polite, wait before the next request
                # print(f"    ...continuing fetch for {category_title}") # Optional progress indicator
                time.sleep(REQUEST_DELAY)
            else:
                # No more pages, break the loop
                break

        except requests.exceptions.RequestException as e:
            print(f"  Network Error fetching {category_title}: {e}", file=sys.stderr)
            return {}  # Return empty dictionary on network error
        except Exception as e:
            print(f"  An unexpected error occurred for {category_title}: {e}", file=sys.stderr)
            return {}  # Return empty dictionary on other errors

    return members

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
            # CHECK FOR MATCH HERE
            if match:
                if stat_key == 'image_name':
                    parsed_stats[stat_key] = str(match.group(1).strip())
                elif stat_key in ['slot', 'combatstyle']:
                    parsed_stats[stat_key] = str(match.group(1).strip())
                else:
                    value = parse_stat_number(match, stat_key)
                    parsed_stats[stat_key] = value
            else:
                parsed_stats[stat_key] = 0
    except re.error as e:
        print(f"  Regex error processing item '{item_name}': {e}")
        return None
    return parsed_stats

def parse_stat_number(match, stat_key):
    if not match:
        return 0
    else:
        value_str = match.group(1).strip()
        try:
            cleaned_value = value_str.replace('+', '').replace('%', '').strip()
            if stat_key != 'magic_damage':
                return int(cleaned_value)
            else:
                return float(cleaned_value)
        except (ValueError, TypeError):
            return 0

def fetch_item_image(item_name):
    if not item_name:
        print(f"  No image name provided.")
        return None
    try:
        params = {
            "action": "query",
            "format": "json",
            "titles": item_name,
            "prop": "imageinfo",
            "iiprop": "url"
        }
        response = session.get(API_BASE_URL, params=params)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        pages = data.get('query').get('pages')
        page_key = next(iter(pages.keys()), None)

        if page_key == "-1":
            print(f"  Item Image '{item_name}' not found in pages.")
            return None

        if pages[page_key].get('imageinfo'):
            return pages[page_key].get('imageinfo')[0].get('url')
        else:
            print(f"  No image found for item: '{item_name}'")
            return None
    except requests.exceptions.RequestException as e:
        print(f"  Network error fetching wikitext for '{item_name}': {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"  Error decoding JSON response for wikitext of '{item_name}': {e}")
        return None

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
    print("Starting OSRS Wiki Item Fetcher...")

    all_items = {}  # Changed to a dictionary

    # Iterate through the specified categories
    for category in CATEGORIES_TO_FETCH:
        print(f"\nFetching members for category: '{category}'")
        category_items = get_all_category_members(session, category)
        all_items.update(category_items)  # Update the all_items dictionary

    print(f"Total unique items found across all categories: {len(all_items)}")

    # --- Write all data to a single JSON file ---
    print(f"\n\n--- Writing ALL item data to {OUTPUT_FILE} ---")
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, indent=4, ensure_ascii=False)  # Dump the dictionary
        print(f"  Successfully saved ALL items data to {OUTPUT_FILE}")
        if os.path.exists(TEMP_OUTPUT_FILE):
          os.remove(TEMP_OUTPUT_FILE)
    except IOError as e:
        print(f"  Error writing to file {OUTPUT_FILE}: {e}")
    except Exception as e:
        print(f"  An unexpected error occurred during file writing: {e}")
    print("\nScript finished.")
