import json
import glob

keys_to_add = {
    "TMS_TITLE": "Trackmate Summary",
    "TMS_COM_PORT": "COM Port",
    "TMS_NO_PORT": "None",
    "TMS_PER_LANE_RELAYS": "Per Lane Relays",
    "TMS_PIT_ROW": "Pit Row",
    "TMS_YES": "Yes",
    "TMS_NO": "No"
}

files = glob.glob('client/src/assets/i18n/*.json')
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for key, val in keys_to_add.items():
        if key not in data:
            data[key] = val
            
    # Sort keys
    data = dict(sorted(data.items()))
    
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

print("Updated translation files.")
