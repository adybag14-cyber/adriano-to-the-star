import json
import os

# Read the original database file
input_file = r'C:\Users\adyba\Downloads\python (1).txt'
output_file = r'C:\Users\adyba\new-starsiadr-project\kepler_data_parsed.js'

print("Starting to parse database...")
all_planets = []
confirmed = []
candidates = []
false_positives = []

# Read and parse each line
with open(input_file, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            # Strip whitespace
            line = line.strip()
            if not line:
                continue
            
            # Parse JSON
            planet = json.loads(line)
            all_planets.append(planet)
            
            # Categorize by status
            status = planet.get('status', '')
            if status == 'Confirmed Planet':
                confirmed.append(planet)
            elif status == 'CANDIDATE':
                candidates.append(planet)
            elif status == 'FALSE POSITIVE':
                false_positives.append(planet)
                
        except json.JSONDecodeError as e:
            print(f"Error parsing line {line_num}: {e}")
            print(f"Line content: {line[:100]}")
        except Exception as e:
            print(f"Unexpected error on line {line_num}: {e}")

print(f"\nParsing complete!")
print(f"Total planets: {len(all_planets)}")
print(f"Confirmed: {len(confirmed)}")
print(f"Candidates: {len(candidates)}")
print(f"False Positives: {len(false_positives)}")

# Filter for high-quality planets (confirmed + high-confidence candidates)
high_quality = []
for planet in all_planets:
    status = planet.get('status', '')
    score = planet.get('score')
    
    # Include confirmed planets
    if status == 'Confirmed Planet':
        high_quality.append(planet)
    # Include candidates with score >= 0.5
    elif status == 'CANDIDATE' and score and score >= 0.5:
        high_quality.append(planet)

print(f"High-quality planets (confirmed + candidates score>=0.5): {len(high_quality)}")

# Generate JavaScript code
js_output = """// Kepler Exoplanet Database - Complete Dataset
// Parsed from NASA Kepler Mission Archive
// Total entries: {total}
// Confirmed Planets: {confirmed}
// Candidates: {candidates}
// False Positives: {false_positives}
// High-Quality Subset: {high_quality}

const KEPLER_DATABASE = {{
    allPlanets: {all_json},
    
    confirmed: {confirmed_json},
    
    candidates: {candidates_json},
    
    highQuality: {high_quality_json},
    
    stats: {{
        total: {total},
        confirmed: {confirmed},
        candidates: {candidates},
        falsePositives: {false_positives},
        highQuality: {high_quality}
    }}
}};

// Export for use in database-advanced.js
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = KEPLER_DATABASE;
}}
""".format(
    total=len(all_planets),
    confirmed=len(confirmed),
    candidates=len(candidates),
    false_positives=len(false_positives),
    high_quality=len(high_quality),
    all_json=json.dumps(all_planets, indent=2),
    confirmed_json=json.dumps(confirmed[:100], indent=2),  # First 100 confirmed
    candidates_json=json.dumps(candidates[:100], indent=2),  # First 100 candidates
    high_quality_json=json.dumps(high_quality, indent=2)  # All high-quality planets
)

# Write to output file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_output)

print(f"\nJavaScript data file generated: {output_file}")
print(f"File size: {len(js_output) / 1024:.2f} KB")
print("\nReady to integrate into database-advanced.js!")
