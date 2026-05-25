import os
import json
import re

data_path = 'web/data.json'
desc_dir = 'web/description'
if not os.path.exists(desc_dir):
    desc_dir = 'web/descriptions'
assets_dir = 'web/assets'

with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Get all assets
all_assets = os.listdir(assets_dir)

def clean_description(text):
    lines = []
    for line in text.split('\n'):
        line = line.strip()
        # Remove markdown headers
        line = re.sub(r'^#+\s*', '', line)
        # Remove list bullets
        line = re.sub(r'^[\-\*]\s*', '', line)
        # Remove bold/italic markup
        line = line.replace('**', '').replace('*', '').replace('__', '').replace('_', '')
        lines.append(line)
    return '\n'.join(lines).strip()

def get_base_name(name):
    # Remove number prefix if present
    name = re.sub(r'^\d+\.\s*', '', name)
    return name.replace('/', '').replace('\\', '').replace("'", "").strip()

for d in data:
    loc_name = d['location_name']
    
    # Try exact name match
    txt_filename = f"{loc_name}.txt"
    txt_path = os.path.join(desc_dir, txt_filename)
    
    # Try stripping e.g. "1. COLONY HOUSE" -> "COLONY HOUSE.txt"
    if not os.path.exists(txt_path):
        clean_name = re.sub(r'^\d+\.\s*', '', loc_name)
        txt_filename = f"{clean_name}.txt"
        txt_path = os.path.join(desc_dir, txt_filename)
        
    # Try replacing slash with dash e.g. "Farway/Bottle Tree" -> "Farway-Bottle Tree.txt"
    if not os.path.exists(txt_path):
        clean_name = re.sub(r'^\d+\.\s*', '', loc_name).replace('/', '-')
        txt_filename = f"{clean_name}.txt"
        txt_path = os.path.join(desc_dir, txt_filename)
        
    if os.path.exists(txt_path):
        with open(txt_path, 'r', encoding='utf-8') as f:
            raw_text = f.read()
            d['description'] = clean_description(raw_text)
            print(f"Updated description for: {loc_name}")
    else:
        print(f"Warning: Description file not found for: {loc_name} ({txt_path})")

    # Update images dynamically
    base_name = get_base_name(loc_name)
    images = []
    
    if d['id'] == 'Bar':
        images = [f for f in all_assets if f.startswith('TOM BAR')]
    elif d['id'] == 'LiusHome':
        images = ['Liu_House.png']
    elif d['id'] == 'MatthewsHome':
        images = [f for f in ["MATTHEWS' HOME.png", "Matthews_House.png"] if f in all_assets]
    elif d['id'] == 'MyersHome':
        images = ['Myers_House.png']
    elif d['id'] == 'Diner':
        images = [f for f in all_assets if f.lower().startswith('diner')]
    elif d['id'] == 'LogCabins':
        images = [f for f in all_assets if f.startswith('Log Cabins') or f.startswith('Log_Cabins')]
    elif d['id'] == 'FarwayBottleTree':
        images = [f for f in all_assets if f.startswith('FarwayBottle Tree')]
    elif d['id'] == 'CrashSite':
        images = [f for f in all_assets if f.startswith('Crash Site')]
    else:
        images = [f for f in all_assets if f.startswith(base_name) and f.lower().endswith(('.png', '.jpeg', '.jpg', '.webp'))]
    
    d['images'] = ['assets/' + img for img in images]

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print('Updated data.json successfully with cleaned descriptions and images.')
