import requests
import json
import time
import sys

# Configuration
API_BASE_URL = "https://oldschool.runescape.wiki/api.php"
# List the categories and their corresponding output file names
CATEGORIES_AND_FILES = [
    {"category": "Category:Weapons", "slot": "weapon"},
    {"category": "Category:Weapons with Special attacks", "slot": "spec wep"},
    {"category": "Category:Head slot items", "slot": "head"},
    {"category": "Category:Body slot items", "slot": "body"},
    {"category": "Category:Legs slot items", "slot": "legs"},
    {"category": "Category:Feet slot items", "slot": "feet"},
    {"category": "Category:Cape slot items", "slot": "cape"},
    {"category": "Category:Neck slot items", "slot": "neck"},
    {"category": "Category:Hands slot items", "slot": "hands"},
    {"category": "Category:Ring slot items", "slot": "ring"},
    {"category": "Category:Ammunition slot items", "slot": "ammo"},
    {"category": "Category:Shield slot items", "slot": "shield"},
]
OUTPUT_FILE = "osrs_all_items.json"
REQUEST_LIMIT = "max"  # Or set a specific number like 500. 'max' uses the API's maximum allowed.

# --- Define patterns/keywords to identify cosmetic items by title ---
# List common indicators. Convert to lowercase for case-insensitive matching.
# We check endswith for suffixes and 'in' for keywords like 'ornament kit'.
COSMETIC_SUFFIXES = ["(g)", "(t)", "(or)", "(sk)", "(b)", "(cr)", "(u)", "(guthix)", "(saradomin)", "(zamorak)",
                     "(Amlodd)", "(Cadarn)", "(Crwys)", "(Iorwerth)", "(Ithell)", "(Meilyr)", "(Trahaearn)",
                     "(h1)", "(h2)", "(h3)", "(h4)", "(h5)"]  # Gold, Treasure, Ornament, Saradomin/Guthix/Zamorak kit
COSMETIC_KEYWORDS = [" ornament kit"]  # Include space to avoid partial matches like 'bracelet'


def fetch_and_filter_category_members(category_title):
    """Fetches all items in a category, filters out cosmetics, and returns the clean list."""
    print(f"\nAttempting to fetch ALL members for '{category_title}'...")

    # Parameters for the initial API request
    params = {
        "action": "query",
        "format": "json",
        "list": "categorymembers",
        "cmtitle": category_title,
        "cmlimit": REQUEST_LIMIT,
        "formatversion": 2  # Use format version 2 for simpler JSON structure
    }

    all_items_data = []  # List to store raw results from ALL pages
    page_count = 0
    total_fetched = 0

    try:
        # --- Loop to handle API pagination using 'cmcontinue' ---
        while True:
            page_count += 1
            print(f"  Fetching page {page_count}...")

            response = requests.get(API_BASE_URL, params=params, timeout=20)
            response.raise_for_status()
            api_data = response.json()

            if 'error' in api_data:
                print(f"API Error Reported: {api_data['error'].get('info', 'Unknown error')}")
                print(f"Code: {api_data['error'].get('code', 'N/A')}")
                return []  # return empty if there is an error

            query_results = api_data.get('query', {})
            members = query_results.get('categorymembers')

            if members:
                all_items_data.extend(members)
                current_page_fetched = len(members)
                total_fetched += current_page_fetched
                print(f"    Fetched {current_page_fetched} items on this page. Total fetched so far: {total_fetched}")
            else:
                print("  No members found on this page (or 'categorymembers' key missing).")
                if page_count == 1 and not all_items_data:
                    print("  Check if the category title is correct and the category is not empty.")

            continue_token = api_data.get('continue', {}).get('cmcontinue')

            if continue_token:
                params['cmcontinue'] = continue_token
                print(f"  Continue token found, preparing for next page...")
                time.sleep(0.5)
            else:
                print("\n  All pages fetched. No more 'cmcontinue' token found.")
                break

        # --- Filter and Process the collected data ---
        print(f"\n  Processing and filtering {len(all_items_data)} total items fetched...")
        processed_list = []
        skipped_count = 0

        for item in all_items_data:
            title = item.get('title')
            if not title:
                print("  Skipping entry with missing title:", item)
                skipped_count += 1
                continue  # Skip this item entirely

            lower_title = title.lower()  # Convert title to lowercase for easier matching
            is_cosmetic = False

            # Check for cosmetic suffixes
            for suffix in COSMETIC_SUFFIXES:
                if lower_title.endswith(suffix):
                    is_cosmetic = True
                    break  # Found a cosmetic suffix, no need to check others

            # If not flagged by suffix, check for keywords (like "ornament kit")
            if not is_cosmetic:
                for keyword in COSMETIC_KEYWORDS:
                    if keyword in lower_title:
                        is_cosmetic = True
                        break  # Found a cosmetic keyword

            # --- Apply the filter ---
            if is_cosmetic:
                print(f"    Filtering cosmetic/kit: '{title}'")
                skipped_count += 1
                # Do not add to processed_list, effectively removing it
            else:
                # If it's not identified as cosmetic, add its title to the final list
                processed_list.append(title)

        print(f"    Filtered down to {len(processed_list)} items (skipped {skipped_count} cosmetic/kit).")
        return processed_list

    # --- Error Handling ---
    except requests.exceptions.Timeout:
        print(f"Error: Request timed out while trying to reach {API_BASE_URL}")
    except requests.exceptions.RequestException as e:
        print(f"Error: Network or HTTP error fetching data: {e}")
        if 'response' in locals() and response is not None:
            print(f"HTTP Status Code: {response.status_code}")
    except json.JSONDecodeError:
        print("Error: Could not decode JSON response from the API.")
        try:
            print("Response Text:", response.text[:500] + "...")
        except NameError:
            print("Response object not available.")
    except KeyError as e:
        print(f"Error: Missing expected key '{e}' in API data structure during processing.")
        try:
            print("Problematic data structure might be:", api_data)
        except NameError:
            print("API data structure not available.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        return []  # Ensure an empty list is returned in the case of any exception
    return []


# --- Main Execution ---
if __name__ == "__main__":
    print("Starting OSRS Wiki Item Category Scraper...")

    all_items_by_slot = {}  # Dictionary to hold items grouped by slot

    for item_info in CATEGORIES_AND_FILES:
        category_title = item_info["category"]
        slot_name = item_info["slot"]

        print(f"\n\n--- Processing category: {category_title} (Slot: {slot_name}) ---")

        filtered_items = fetch_and_filter_category_members(category_title)

        if not filtered_items:
            print(f"  No non-cosmetic items found in {category_title}. Skipping.")
            continue

        all_items_by_slot[slot_name] = filtered_items  # Add the list to the dictionary

    # --- Write all data to a single JSON file ---
    print(f"\n\n--- Writing ALL item data to {OUTPUT_FILE} ---")
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_items_by_slot, f, indent=4, ensure_ascii=False)
        print(f"  Successfully saved ALL items data to {OUTPUT_FILE}")
    except IOError as e:
        print(f"  Error writing to file {OUTPUT_FILE}: {e}")
    except Exception as e:
        print(f"  An unexpected error occurred during file writing: {e}")

    print("\nScript finished.")
