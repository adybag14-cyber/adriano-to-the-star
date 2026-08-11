#!/usr/bin/env python3
"""
Parse Google Drive exoplanet data and create JavaScript array
"""
import json
import sys

def parse_google_drive_data(file_path, limit=100):
    """Parse the Google Drive JSON data and extract exoplanets"""
    confirmed_planets = []
    candidates = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or 'kepid' not in line:
                    continue
                    
                try:
                    # Fix escaped underscores in the JSON (they're escaped as \_)
                    fixed_line = line.replace('\\_', '_')
                    # Parse JSON line
                    planet = json.loads(fixed_line)
                    
                    # Filter by status
                    status = planet.get('status', '')
                    if status == 'Confirmed Planet':
                        confirmed_planets.append(planet)
                    elif status == 'CANDIDATE' and planet.get('score', 0) >= 0.7:
                        candidates.append(planet)
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing line {line_num}: {e}", file=sys.stderr)
                    continue
                    
    except FileNotFoundError:
        print(f"File not found: {file_path}", file=sys.stderr)
        return [], []
    
    # Limit results
    confirmed_planets = confirmed_planets[:limit]
    candidates = candidates[:30]  # Get 30 high-confidence candidates
    
    return confirmed_planets, candidates

def create_js_data(confirmed, candidates):
    """Create JavaScript data array"""
    all_planets = []
    
    # Add confirmed planets
    for p in confirmed:
        planet_data = {
            'kepid': p.get('kepid'),
            'kepoi_name': p.get('kepoi_name'),
            'kepler_name': p.get('kepler_name'),
            'koi_disposition': 'CONFIRMED',
            'koi_score': p.get('score', 1.0),
            'host_star': p.get('kepler_name', p.get('kepoi_name', '')).split(' ')[0] if p.get('kepler_name') else 'Unknown',
            'status': 'available',
            'disc_year': 2014  # Default year
        }
        all_planets.append(planet_data)
    
    # Add candidates
    for p in candidates:
        planet_data = {
            'kepid': p.get('kepid'),
            'kepoi_name': p.get('kepoi_name'),
            'kepler_name': None,
            'koi_disposition': 'CANDIDATE',
            'koi_score': p.get('score', 0.7),
            'host_star': p.get('kepoi_name', '').replace('.01', '').replace('.02', '').replace('.03', '') if p.get('kepoi_name') else 'Unknown',
            'status': 'available',
            'disc_year': 2013
        }
        all_planets.append(planet_data)
    
    return all_planets

if __name__ == '__main__':
    # Read from artifact file
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'gdrive_data.log'
    
    confirmed, candidates = parse_google_drive_data(file_path, limit=100)
    
    print(f"Confirmed planets: {len(confirmed)}")
    print(f"Candidates: {len(candidates)}")
    print(f"Total: {len(confirmed) + len(candidates)}")
    
    # Output first 10 as sample
    all_data = create_js_data(confirmed, candidates)
    print("\nFirst 10 planets:")
    for i, p in enumerate(all_data[:10], 1):
        print(f"{i}. {p['kepler_name'] or p['kepoi_name']} - {p['koi_disposition']} ({p['koi_score']:.2f})")
