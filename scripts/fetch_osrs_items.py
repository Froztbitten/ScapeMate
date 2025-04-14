import requests
import json
import sys

# URL for the OSRSBox complete item database (check if this URL is still valid)
OSRS_ITEMS_URL = "https://raw.githubusercontent.com/osrsbox/osrsbox-db/master/docs/items-complete.json"
OUTPUT_FILE = "osrs_weapons_armor.json"

# Define the equipment slots considered weapons or armor
# Using a set for efficient lookup
WEAPON_ARMOR_SLOTS = {
    "weapon", "2h",  # Weapons
    "head", "cape", "neck", "ammo", "body", "shield", "legs", "hands", "feet", "ring"  # Armor/Equipment
}

def fetch_json_data(url):
    """Fetches JSON data from the given URL."""
    print(f"Attempting to fetch data from: {url}")
    try:
        response = requests.get(url, timeout=30) # Add a timeout
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print("Successfully fetched raw item data.")
        # Parse JSON directly from the response
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}", file=sys.stderr)
        print("Response text was:", response.text[:500] + "...", file=sys.stderr) # Print part of response on error
        return None

def filter_items(all_items_data):
    """Filters the item data for weapons and armor based on equipment slot."""
    if not isinstance(all_items_data, dict):
        print("Error: Expected a dictionary for item data, got:", type(all_items_data), file=sys.stderr)
        return None

    filtered_list = []
    print("Filtering items based on equipment slot...")
    processed_count = 0
    total_items = len(all_items_data)

    # The keys are item IDs, the values are the item detail dictionaries
    for item_id, item in all_items_data.items():
        processed_count += 1
        # Check if item is a dictionary and has the 'equipable' key set to True
        if isinstance(item, dict) and item.get('equipable') is True:
            equipment_details = item.get('equipment')
            # Check if 'equipment' details exist and is a dictionary
            if isinstance(equipment_details, dict):
                slot = equipment_details.get('slot')
                # Check if the slot exists and is in our defined set
                if slot and slot in WEAPON_ARMOR_SLOTS:
                    filtered_list.append(item) # Add the whole item dictionary

        if processed_count % 1000 == 0 or processed_count == total_items:
             print(f"Processed {processed_count}/{total_items} items...")

    print(f"Finished filtering. Found {len(filtered_list)} weapon/armor items.")
    return filtered_list

def save_to_json(data, filename):
    """Saves the given data structure to a JSON file."""
    print(f"Attempting to save filtered data to: {filename}")
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            # Use indent for pretty printing the JSON output
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Successfully wrote data to {filename}")
        return True
    except IOError as e:
        print(f"Error writing to file {filename}: {e}", file=sys.stderr)
        return False
    except TypeError as e:
        print(f"Error serializing data to JSON: {e}", file=sys.stderr)
        return False


def main():
    """Main function to orchestrate fetching, filtering, and saving."""
    print("--- Starting OSRS Item Fetcher ---")

    # 1. Fetch data
    all_items = fetch_json_data(OSRS_ITEMS_URL)
    if all_items is None:
        print("Exiting due to fetch error.", file=sys.stderr)
        return # Exit if fetching failed

    # 2. Filter data
    filtered_weapons_armor = filter_items(all_items)
    if filtered_weapons_armor is None:
         print("Exiting due to filtering error.", file=sys.stderr)
         return # Exit if filtering failed

    # 3. Save data
    if filtered_weapons_armor: # Only save if we have something to save
        save_to_json(filtered_weapons_armor, OUTPUT_FILE)
    else:
        print("No weapon or armor items found matching the criteria.")

    print("--- OSRS Item Fetcher Finished ---")

# Standard Python entry point
if __name__ == "__main__":
    main()