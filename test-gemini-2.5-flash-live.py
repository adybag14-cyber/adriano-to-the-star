#!/usr/bin/env python3
"""
Test if gemini-2.5-flash-live (without preview) works
"""

import os
import sys
import requests
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'GEMINI_API_KEY_2')

print("Testing gemini-2.5-flash-live (without preview)")
print("=" * 60)

# Test 1: Try generateContent (REST API)
print("\n[TEST 1] Trying generateContent (REST API)...")
try:
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:generateContent"
    headers = {'Content-Type': 'application/json'}
    payload = {
        'contents': [{'parts': [{'text': 'Say hello'}]}],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 100
        }
    }
    
    response = requests.post(
        f"{api_url}?key={GEMINI_API_KEY}",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        print(f"   ✅ SUCCESS: {text[:100]}")
    else:
        print(f"   ❌ FAILED: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 2: Try bidiGenerateContent (Streaming API)
print("\n[TEST 2] Trying bidiGenerateContent (Streaming API)...")
try:
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:bidiGenerateContent"
    headers = {'Content-Type': 'application/json'}
    payload = {
        'contents': [{'parts': [{'text': 'Say hello'}]}],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 100
        }
    }
    
    response = requests.post(
        f"{api_url}?key={GEMINI_API_KEY}",
        headers=headers,
        json=payload,
        stream=True,
        timeout=30
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ SUCCESS: Streaming response received")
        response_text = ""
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        candidates = data.get('candidates', [])
                        if candidates:
                            content = candidates[0].get('content', {})
                            parts = content.get('parts', [])
                            if parts:
                                text = parts[0].get('text', '')
                                if text:
                                    response_text += text
                    except json.JSONDecodeError:
                        continue
        print(f"   Response: {response_text[:100]}")
    else:
        print(f"   ❌ FAILED: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 3: Compare with preview version
print("\n[TEST 3] Testing gemini-2.5-flash-live-preview for comparison...")
try:
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live-preview:generateContent"
    headers = {'Content-Type': 'application/json'}
    payload = {
        'contents': [{'parts': [{'text': 'Say hello'}]}],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 100
        }
    }
    
    response = requests.post(
        f"{api_url}?key={GEMINI_API_KEY}",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        print(f"   ✅ SUCCESS: {text[:100]}")
    else:
        print(f"   ❌ FAILED: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 60)
print("[TEST COMPLETE]")

