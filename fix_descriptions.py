import re
import json

data_path = 'web/data.json'
tscn_path = 'lixo/main.tscn'
gd_path = 'lixo/main.gd'

gd_descriptions = {}
try:
    with open(gd_path, 'r', encoding='utf-8') as f:
        in_dict = False
        for line in f:
            if 'var location_descriptions = {' in line:
                in_dict = True
                continue
            if in_dict:
                if '}' in line:
                    break
                m = re.search(r'"([^"]+)": "(.*)",?', line)
                if m:
                    gd_descriptions[m.group(1)] = m.group(2).replace('\\"', '"')
except Exception as e:
    print("Error reading gd:", e)

with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(tscn_path, 'r', encoding='utf-8') as f:
    tscn_content = f.read()

blocks = re.finditer(r'\[node name="([^"]+)" parent="MarkerManager" instance=ExtResource\(".*?"\)\].*?(?=\[node|\Z)', tscn_content, re.DOTALL)
desc_map = {}
for match in blocks:
    node_id = match.group(1)
    node_body = match.group(0)
    
    desc_match = re.search(r'description = "((?:\\"|[^"])*)"', node_body)
    if desc_match:
        desc_text = desc_match.group(1).replace('\\"', '"')
        # Godot might use literal newlines, we preserve them
        desc_map[node_id] = desc_text

for loc in data:
    node_id = loc.get('id')
    loc_name = loc.get('location_name')
    
    new_desc = loc.get('description', '')
    
    if node_id in desc_map and desc_map[node_id] and desc_map[node_id] != "Placeholder description.":
        new_desc = desc_map[node_id]
    elif loc_name in gd_descriptions:
        new_desc = gd_descriptions[loc_name]
        
    # Formatting line breaks for HTML (optional, but CSS white-space: pre-wrap handles it)
    if new_desc:
        loc['description'] = new_desc

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Fixed descriptions")
