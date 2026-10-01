import csv
import json
import math

def clean_float(val):
    if not val or val.strip().lower() == 'nan' or val.strip() == '':
        return None
    try:
        # Remove any non-numeric characters except dots and minus
        clean_val = ''.join(c for c in val if c.isdigit() or c in '.-')
        return float(clean_val)
    except ValueError:
        return None

def clean_int(val):
    if not val or val.strip().lower() == 'nan' or val.strip() == '':
        return None
    try:
        clean_val = ''.join(c for c in val if c.isdigit() or c == '-')
        return int(clean_val)
    except ValueError:
        return None

def clean_str(val):
    if not val or val.strip().lower() == 'nan' or val.strip() == '':
        return None
    return val.strip()

bikes = []

with open('bikesCleaned.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Use mileage-owner reported as primary, and mileage-arai as fallback
        mileage_owner = clean_float(row.get('mileage - owner reported'))
        mileage_arai = clean_float(row.get('mileage - arai'))
        mileage = mileage_owner if mileage_owner is not None else mileage_arai

        bike = {
            'id': clean_int(row.get('')),
            'name': clean_str(row.get('name')),
            'brand': clean_str(row.get('brand')),
            'price': clean_float(row.get('price')),
            'power': clean_float(row.get('max power')),
            'torque': clean_float(row.get('max torque')),
            'cooling': clean_str(row.get('cooling system')),
            'transmission': clean_str(row.get('transmission')),
            'transmission_type': clean_str(row.get('transmission type')),
            'displacement': clean_float(row.get('displacement')),
            'cylinders': clean_int(row.get('cylinders')),
            'tank_capacity': clean_float(row.get('fuel tank capacity')),
            'mileage': mileage,
            'top_speed': clean_float(row.get('top speed')),
            'braking': clean_str(row.get('braking system')),
            'weight': clean_float(row.get('kerb weight')),
            'clearance': clean_float(row.get('ground clearance')),
            'seat_height': clean_float(row.get('seat height')),
            'chassis': clean_str(row.get('chassis type'))
        }
        
        # Only add bikes that have a valid name and brand
        if bike['name'] and bike['brand']:
            bikes.append(bike)

# Output JSON
with open('bikes.json', 'w', encoding='utf-8') as f:
    json.dump(bikes, f, indent=2)

print(f"Successfully converted {len(bikes)} bikes to bikes.json")
