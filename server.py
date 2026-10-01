import os
import json
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Load the dataset
dataset_path = os.path.join(os.path.dirname(__file__), 'bikes.json')
with open(dataset_path, 'r', encoding='utf-8') as f:
    bikes = json.load(f)

# Define columns and pre-calculate metrics
numeric_keys = ['price', 'displacement', 'power', 'torque', 'mileage', 'weight', 'seat_height']
stats = {}

for key in numeric_keys:
    vals = [b[key] for b in bikes if b.get(key) is not None]
    if vals:
        stats[key] = {
            'min': float(min(vals)),
            'max': float(max(vals)),
            'avg': float(sum(vals) / len(vals)),
            'range': float(max(vals) - min(vals) if max(vals) - min(vals) > 0 else 1.0)
        }
    else:
        stats[key] = {'min': 0.0, 'max': 1.0, 'avg': 0.5, 'range': 1.0}

def get_cleaned_value(bike, key):
    val = bike.get(key)
    if val is None:
        return stats[key]['avg']
    return float(val)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/bikes', methods=['GET'])
def get_all_bikes():
    # Return minimal details for search suggestions
    simple_bikes = [{
        'id': b['id'],
        'name': b['name'],
        'brand': b['brand']
    } for b in bikes]
    return jsonify(simple_bikes)

@app.route('/api/bike/<int:bike_id>', methods=['GET'])
def get_bike_by_id(bike_id):
    bike = next((b for b in bikes if b['id'] == bike_id), None)
    if not bike:
        return jsonify({'error': 'Bike not found'}), 404
    return jsonify(bike)

@app.route('/api/recommend', methods=['POST'])
def recommend_bikes():
    data = request.json or {}
    target_id = data.get('bike_id')
    active_criteria = data.get('criteria', ['price', 'displacement', 'power', 'mileage'])
    brand_boost = data.get('brand_boost', False)

    # Find target bike
    target_bike = next((b for b in bikes if b['id'] == target_id), None)
    if not target_bike:
        return jsonify({'error': 'Target bike not found'}), 404

    recommendations = []

    # If no criteria selected, default to all
    if not active_criteria:
        active_criteria = ['price', 'displacement', 'power', 'mileage']

    for bike in bikes:
        # Exclude the target bike itself
        if bike['id'] == target_id:
            continue

        total_distance = 0.0
        weight_sum = 0.0

        for crit in active_criteria:
            if crit == 'power':
                # Power similarity covers power & torque
                t_p = get_cleaned_value(target_bike, 'power')
                c_p = get_cleaned_value(bike, 'power')
                dist_p = abs(t_p - c_p) / stats['power']['range']

                t_t = get_cleaned_value(target_bike, 'torque')
                c_t = get_cleaned_value(bike, 'torque')
                dist_t = abs(t_t - c_t) / stats['torque']['range']

                # Combined performance distance
                dist = (dist_p + dist_t) / 2.0
                weight = 1.0
            elif crit in stats:
                t_val = get_cleaned_value(target_bike, crit)
                c_val = get_cleaned_value(bike, crit)
                dist = abs(t_val - c_val) / stats[crit]['range']
                weight = 1.0
            else:
                continue

            total_distance += dist * weight
            weight_sum += weight

        # Calculate average distance
        avg_distance = total_distance / weight_sum if weight_sum > 0 else 0.5
        
        # Calculate similarity percentage
        similarity = (1.0 - avg_distance) * 100.0

        # Apply Brand Boost if active and same brand
        if brand_boost and bike['brand'].lower() == target_bike['brand'].lower():
            similarity += 15.0
            # Cap at 99% to ensure no recommended bike matches the target 100% identically
            if similarity > 99.0:
                similarity = 99.0

        # Clip similarity between 0 and 100
        similarity = max(0.0, min(100.0, similarity))

        # Add to matching list
        bike_copy = bike.copy()
        bike_copy['similarity'] = round(similarity, 1)
        recommendations.append(bike_copy)

    # Sort recommendations by similarity score descending
    recommendations.sort(key=lambda x: x['similarity'], reverse=True)

    # Pick top 5
    top_5 = recommendations[:5]

    return jsonify({
        'target_bike': target_bike,
        'recommendations': top_5
    })

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, port=5000)
