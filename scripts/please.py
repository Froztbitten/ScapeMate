import requests
import mwparserfromhell
import json

# Configure for your target wiki and page
# Using OSRS Wiki and a hypothetical page name for demonstration
API_ENDPOINT = "https://oldschool.runescape.wiki/api.php"
# Replace with a real page title known to use versioned parameters in its infobox
# For example, some bosses might have this structure. If not, this is hypothetical.
PAGE_TITLE = "Abyssal Sire" # Example: Zulrah has multiple forms/phases
TARGET_TEMPLATE_NAME = "Infobox Monster" # Or whatever the specific infobox name is
TARGET_SUBOBJECT_NAME = "version"

def fetch_page_wikitext(page_title):
    print(f"Fetching wikitext for page: {page_title}")
    params_fetch = {
        "action": "parse",
        "page": page_title,
        "prop": "wikitext",
        "format": "json",
        "formatversion": "2"
    }
    try:
        response = requests.get(API_ENDPOINT, params=params_fetch, timeout=30)
        response.raise_for_status()
        data = response.json()

        if "parse" in data and "wikitext" in data["parse"] :
            subobjects = parse_subject_for_subobjects(data["parse"]["wikitext"])
            for subobject in subobjects:
                results = fetch_data_by_subject(page_title, subobject)
        else:
            print("Error: Could not extract wikitext from API response.")
            print(json.dumps(data, indent=2))
            exit()

    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch wikitext for {page_title}: {e}")
        exit()
    except Exception as e:
        print(f"An unexpected error occurred during fetch: {e}")
        exit()
        
    return data

def parse_subject_for_subobjects(wikitext):
    subobjects = []
    try:
        wikicode = mwparserfromhell.parse(wikitext)

        for template in wikicode.filter_templates():
            template_name_cleaned = template.name.strip().lower()
            
            if template_name_cleaned == TARGET_TEMPLATE_NAME.lower():
                for i in range(1, 6): # Check for version1, version2, ..., version5
                    param_name = f"{TARGET_SUBOBJECT_NAME}{i}"
                    if template.has(param_name):
                        param_object = template.get(param_name)
                        param_value = param_object.value.strip_code().strip()
                        subobjects.append(param_value)

    except Exception as e:
        print(f"An error occurred during parsing: {e}")
        
    return subobjects

def fetch_data_by_subject(subject, subobject):
    subject_data = {}
    try:
        params_string = "{\"subject\":\"" + subject + "\",\"subobject\":\"" + subobject.replace(" ", "_") + "\",\"ns\":0}"
        params_fetch = {
            "action": "smwbrowse",
            "browse": "subject",
            "params": params_string,
            "format": "json",
            "formatversion": "2"
        }
        response = requests.get(API_ENDPOINT, params=params_fetch, timeout=30)
        response.raise_for_status()
        data_array = response.json()['query']['data']
        print(data_array)
        # for property in dataArray:
            


    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch wikitext for {subject}: {e}")
        exit()
    except Exception as e:
        print(f"An unexpected error occurred during fetch: {e}")
        exit()


    
    return subject_data
        
fetch_page_wikitext(PAGE_TITLE)