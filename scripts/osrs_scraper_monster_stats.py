import requests
import mwparserfromhell
import json
import os

API_ENDPOINT = "https://oldschool.runescape.wiki/api.php"
PAGE_TITLE = "Zulrah"
INFOBOX_MONSTER = "Infobox Monster"
VERSION = "version"
OUTPUT_FILE = "../frontend/public/monsters_bosses.json"
# FILTERED_BOSS_PROPERTIES = ['Assigned_by','Examine','Experience_bonus','Is_members_only','Is_variant_of',
#                             'Name','Release_date','Slayer_category','Slayer_experience','Uses_infobox',
#                             'Uses_skill','Version_anchor','_ERRC','_SKEY','All_Assigned_by','All_Examine',
#                             'All_Experience_bonus','All_Is_members_only','All_Is_variant_of','Name',
#                             'All_Release_date','All_Slayer_category','All_Slayer_experience','Uses_infobox',
#                             'Uses_skill','Version_anchor','_INST','_MDAT','_SOBJ',"All_Attack_bonus",
#                             "All_Attack_level","All_Attack_speed","All_Attack_style","All_Combat_level",
#                             "All_Crush_defence_bonus","All_Defence_level","All_Heavy_range_defence_bonus",
#                             "All_Hitpoints","All_Image","All_Immune_to_poison","All_Immune_to_venom",
#                             "All_Light_range_defence_bonus","All_Magic_Damage_bonus","All_Magic_attack_bonus",
#                             "All_Magic_defence_bonus","All_Magic_level","All_Max_hit","All_Monster_attribute",
#                             "All_NPC_ID","All_Name","All_Poisonous","All_Range_attack_bonus",
#                             "All_Range_defence_bonus","All_Ranged_Strength_bonus","All_Ranged_level","All_Size",
#                             "All_Slash_defence_bonus","All_Slayer_level","All_Stab_defence_bonus",
#                             "All_Standard_range_defence_bonus","All_Strength_bonus","All_Strength_level",
#                             "All_Uses_infobox","All_Uses_skill","_ASK","All_League_Region",
#                             "All_Elemental_weakness","All_Elemental_weakness_percent","All_Version_anchor"]
FILTERED_BOSS_PROPERTIES = ['Attack_bonus','Attack_level','Attack_speed','Attack_style','Combat_level',
                            'Crush_defence_bonus','Defence_level','Elemental_weakness','Elemental_weakness_percent',
                            'Heavy_range_defence_bonus','Hitpoints','Immune_to_poison','Immune_to_venom',
                            'Light_range_defence_bonus','Magic_Damage_bonus','Magic_attack_bonus',
                            'Magic_defence_bonus','Magic_level','Max_hit','Monster_attribute','NPC_ID','Name',
                            'Poisonous','Range_attack_bonus','Range_defence_bonus','Ranged_Strength_bonus',
                            'Ranged_level','Size','Slash_defence_bonus','Stab_defence_bonus',
                            'Standard_range_defence_bonus','Strength_bonus','Strength_level']

def fetch_page_wikitext(page_title):
    params_fetch = {
        "action": "parse",
        "page": page_title,
        "prop": "wikitext",
        "format": "json",
        "formatVERSION": "2"
    }
    try:
        response = requests.get(API_ENDPOINT, params=params_fetch, timeout=30)
        response.raise_for_status()
        data = response.json()

        if "parse" in data and "wikitext" in data["parse"]:
            wikitext = data['parse']['wikitext']['*']
            wikicode = mwparserfromhell.parse(wikitext)
            subobjects = parse_subject_for_subobjects(wikicode)
            
            subobject_results = {} # Collect data for all subobjects
            for subobject in subobjects:
                results = fetch_data_by_subject(page_title, subobject)
                if subobject == '':
                    subobject = 'No variant'
                subobject_results[subobject] = results
                
            boss = {}
            boss['name'] = page_title
            boss['variants'] = subobject_results
            
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

    return boss

def parse_subject_for_subobjects(wikitext):
    subobjects = []
    try:
        for template in wikitext.filter_templates():
            template_name_cleaned = template.name.strip().lower()

            if template_name_cleaned == INFOBOX_MONSTER.lower():
                for i in range(1, 6):  # Check for VERSION1, VERSION2, ..., VERSION5
                    param_name = f"{VERSION}{i}"
                    if template.has(param_name):
                        param_object = template.get(param_name)
                        param_value = param_object.value.strip_code().strip()
                        subobjects.append(param_value)

    except Exception as e:
        print(f"An error occurred during parsing: {e}")

    if len(subobjects) == 0:
        subobjects.append('')
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
            "formatVERSION": "2"
        }
        response = requests.get(API_ENDPOINT, params=params_fetch, timeout=30)
        response.raise_for_status()
        data_array = response.json()['query']['data']
        
        for item in data_array:
            property_name = item.get("property")
            if property_name is not None and property_name.lower() in FILTERED_BOSS_PROPERTIES.lower():
                subject_data[property_name] = item.get("dataitem")[0].get("item")

    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch wikitext for {subject}: {e}")
        exit()
    except Exception as e:
        print(f"An unexpected error occurred during fetch: {e}")
        exit()

    return subject_data

def save_data_to_json(data, filename):
    try:
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)
        print(f"Data successfully saved to {filename}")
    except Exception as e:
        print(f"Error saving data to JSON file: {e}")

def get_all_category_members():
    all_members = []
    cmcontinue = None
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Monsters",
        "cmlimit": "max",
        "format": "json",
        "formatversion": "2"
    }
    
    while True:
        if cmcontinue:
            params["cmcontinue"] = cmcontinue

        try:
            response = requests.get(API_ENDPOINT, params=params)
            response.raise_for_status()
            data = response.json()

            for member in data["query"]["categorymembers"]:
                all_members.append(member["title"])

            cmcontinue = data.get("continue", {}).get("cmcontinue")
            if not cmcontinue:
                break
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching category members: {e}")
            return [], None
        except Exception as e:
            print(f"An unexpected error occurred while fetching category members: {e}")
            return [], None
    
    print(f"Total members found: {len(all_members)}")
    return all_members

def get_all_monsters_and_bosses():
    all_data = []
    all_pages = set()

    members = get_all_category_members()
    all_pages.update(members)

    for page_title in all_pages:
        if ':' in page_title or 'disambiguation' in page_title.lower() or 'redirect' in page_title.lower():
            continue
        try:
            page_data = fetch_page_wikitext(page_title)
            if page_data:
                all_data.append(page_data)
                print(f"Successfully fetched data for {page_title}: {len(all_data)}/{len(all_pages)}")

        except Exception as e:
            print(f"An error occurred while fetching data for {page_title}: {e}")
    return all_data

if __name__ == "__main__":
    all_monsters_bosses_data = get_all_monsters_and_bosses()
    save_data_to_json(all_monsters_bosses_data, OUTPUT_FILE)