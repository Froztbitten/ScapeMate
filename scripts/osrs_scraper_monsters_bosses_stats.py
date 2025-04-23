import requests
from bs4 import BeautifulSoup
import json
import time
import os

# --- Configuration ---
API_URL = "https://oldschool.runescape.wiki/w/"  # Changed to base URL for direct page access
CATEGORIES = [
    # "Category:Monsters",
    "Category:Bosses"
]
OUTPUT_FILENAME = "osrs_monster_boss_data.json"
# Be polite: Set a delay between page fetch requests (in seconds)
REQUEST_DELAY = 0.5  # Increased delay as fetching content is heavier
# Define headers including a User-Agent
HEADERS = {
    "User-Agent": "ScapeMateScripts/1.0 (https://github.com/Froztbitten/ScapeMate; devonsphillips36@gmail.com) - Contact me if issues arise"
}

# --- Function to get Category Members ---
def get_category_members(category_name):
    """Fetches all members (page titles) from a specific category using the API."""
    members = set()
    params = {
        "action": "query", "format": "json", "list": "categorymembers",
        "cmtitle": category_name, "cmlimit": "1", "formatversion": "2"
    }
    cmcontinue = None
    request_count = 0

    print(f"Fetching members for {category_name}...")
    while True:
        current_params = params.copy()
        if cmcontinue:
            current_params["cmcontinue"] = cmcontinue

        try:
            response = requests.get(
                "https://oldschool.runescape.wiki/api.php",
                params=current_params,
                headers=HEADERS,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            request_count += 1

            if request_count > 2:
                break
            if "query" in data and "categorymembers" in data["query"]:
                for member in data["query"]["categorymembers"]:
                    page_title = member["title"]
                    if (page_title != "Boss"
                        and "File:" not in page_title
                        and "Category:" not in page_title):
                        members.add(member["title"])
            if "continue" in data and "cmcontinue" in data["continue"]:
                cmcontinue = data["continue"]["cmcontinue"]
                time.sleep(0.1)  # Small delay even between categorymember pages
            else:
                break  # No more pages
        except requests.exceptions.RequestException as e:
            print(
                f"  ERROR fetching members for {category_name}: {e}. Stopping for this category.")
            break
        except Exception as e:
            print(
                f"  UNEXPECTED ERROR fetching members for {category_name}: {e}. Stopping for this category.")
            break

    print(
        f"Finished fetching {len(members)} members for {category_name} in {request_count} requests.")
    return members

# --- Function to Fetch and Parse a Single Page ---
def fetch_and_parse_page(page_title):
    page_data = {
        "boss": page_title,
        "infoboxes": []  # List to hold multiple infoboxes
    }

    # --- Fetch ---
    try:
        params = {
            "action": "parse",
            "page": page_title,
            "prop": "text",
            "format": "json",
            "redirects": "true",
        }
        response = requests.get(
            "https://oldschool.runescape.wiki/api.php",
            params=params,
            headers=HEADERS,
            timeout=30
        )
        # --- Parse ---
        soup = BeautifulSoup(response.json()['parse']['text']['*'], "html.parser")

        # Find all infoboxes
        infobox = soup.find("table", class_="infobox-monster")
        if infobox:
            header = infobox.select('span[data-switch-anchor]')
            for head in header:
                print(f'    Extracting multiple infoboxes: {head.getText()}')
                page_data["infoboxes"].append(fetch_and_parse_infoboxes(page_title, head.getText()))
                print('    Adding returned infoboxes as new monster entries')
        else:
            print("infobox-monster not found")

    except requests.exceptions.RequestException as e:
        print(f"RequestException: {e}")
    except Exception as e:
        print(f"Unexpected Fetch Error: {e}")

    return page_data

def fetch_and_parse_infoboxes(page_title, data_switch):
    infobox_data = {}
    try:
        params = {
            "action": "parse",
            "page": page_title + '#' + data_switch,
            "prop": "text",
            "format": "json",
            "redirects": "true",
        }
        response = requests.get(
            "https://oldschool.runescape.wiki/api.php",
            params=params,
            headers=HEADERS,
            timeout=30
        )
        # --- Parse ---
        soup = BeautifulSoup(response.json()['parse']['text']['*'], "html.parser")
        
        # Find all infoboxes
        infobox = soup.find("table", class_="infobox-monster")
        
        if infobox:
            print(infobox.prettify())
        else:
            print("infobox-monster not found")

    except requests.exceptions.RequestException as e:
        print(f"RequestException: {e}")
    except Exception as e:
        print(f"Unexpected Fetch Error: {e}")
        
    return infoboxData


# ----------------- Main Execution ----------------------

# 1. Get all unique monster/boss names
print("--- Step 1: Fetching all monster and boss names ---")
all_names = set()
for category in CATEGORIES:
    category_names = get_category_members(category)
    all_names.update(category_names)

# Convert set to list for ordered processing and progress tracking
sorted_names = sorted(list(all_names))
total_names = len(sorted_names)
print(f"\nFound {total_names} unique names to process.")

# List to store results for all pages
all_pages_data = []

# 2. Loop through each name, fetch, parse, and collect data
print(
    f"\n--- Step 2: Fetching and parsing data for each page (Delay={REQUEST_DELAY}s/page) ---")

if os.path.exists(OUTPUT_FILENAME):
    print(
        f"Warning: Output file '{OUTPUT_FILENAME}' already exists. It will be overwritten.")

for i, page_title in enumerate(sorted_names):
    print(f"Processing {i+1}/{total_names}: {page_title}...")

    page_result = fetch_and_parse_page(page_title)
    all_pages_data.append(page_result)

    # Print status for the current page
    if page_result["fetch_status"] == "filtered":
        print(f"  -> Filtered: {page_result.get('error', 'Unknown filter error')}")
    elif page_result["fetch_status"] != "success":
        print(
            f"  -> Fetch Failed: {page_result.get('error', 'Unknown fetch error')}")
    elif page_result["parse_status"] != "success":
        print(
            f"  -> Parse Failed: {page_result.get('error', 'Unknown parse error')}")
    else:
        print(f"  -> Success.")

    # IMPORTANT: Wait before the next request
    time.sleep(REQUEST_DELAY)

# 3. Write collected data to JSON file
print(f"\n--- Step 3: Writing all collected data to {OUTPUT_FILENAME} ---")
try:
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        json.dump(all_pages_data, f, indent=4, ensure_ascii=False)
    print("Successfully wrote all data to JSON file.")

except IOError as e:
    print(f"Error writing to JSON file {OUTPUT_FILENAME}: {e}")
except Exception as e:
    print(f"An unexpected error occurred writing JSON: {e}")

print("\n--- Script Finished ---")
