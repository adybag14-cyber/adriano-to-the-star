import requests
from bs4 import BeautifulSoup
import json
import re

def extract_clean_content(url):
    """Fetch and extract clean readable content from Wix pages"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html5lib')
        
        # Remove script, style, and navigation elements
        for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'iframe']):
            tag.decompose()
        
        # Find main content area
        content = {}
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            content['page_title'] = title_tag.text.strip()
        
        # Extract all headings
        content['headings'] = []
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            text = heading.get_text(strip=True)
            if text and len(text) > 2 and 'wix' not in text.lower() and 'cookie' not in text.lower():
                content['headings'].append({
                    'level': heading.name,
                    'text': text
                })
        
        # Extract paragraphs
        content['paragraphs'] = []
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            if text and len(text) > 20:
                # Skip common footer/header text
                if not any(skip in text.lower() for skip in ['cookie', 'wix.com', 'get started', 'skip to', 'bottom of page', 'top of page']):
                    content['paragraphs'].append(text)
        
        # Extract lists
        content['lists'] = []
        for ul in soup.find_all(['ul', 'ol']):
            items = [li.get_text(strip=True) for li in ul.find_all('li')]
            if items and any(len(item) > 10 for item in items):
                content['lists'].append(items)
        
        # Extract images
        content['images'] = []
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '')
            if 'wixstatic.com/media' in src and alt:
                content['images'].append({
                    'src': src,
                    'alt': alt
                })
        
        # Extract links
        content['links'] = []
        for a in soup.find_all('a'):
            href = a.get('href', '')
            text = a.get_text(strip=True)
            if text and href and 'wix.com' not in href and len(text) > 3:
                content['links'].append({
                    'text': text,
                    'href': href
                })
        
        return content
    except Exception as e:
        return {'error': str(e)}

# All Wix pages to extract
pages = {
    'home': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star',
    'business-promise': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/general-5',
    'education': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/general-5',
    'projects': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/single-project',
    'about': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/about-5',
    'database': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/database',
    'book-online': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/book-online',
    'loyalty': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/loyalty',
    'events': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/event-list',
    'shop': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/category/all-products',
    'groups': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/groups',
    'members': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/members',
    'followers': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/followers',
    'forum': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/forum',
    'blog': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/blog',
    'team': 'https://adrianobaggiano.wixsite.com/adriano-to-the-star/team-3'
}

print("Extracting content from all Wix pages...")
print("=" * 80)

all_content = {}
for page_name, url in pages.items():
    print(f"\nProcessing: {page_name}")
    print(f"URL: {url}")
    content = extract_clean_content(url)
    all_content[page_name] = content
    
    if 'error' in content:
        print(f"  ERROR: {content['error']}")
    else:
        print(f"  [OK] Headings: {len(content.get('headings', []))}")
        print(f"  [OK] Paragraphs: {len(content.get('paragraphs', []))}")
        print(f"  [OK] Images: {len(content.get('images', []))}")
        print(f"  [OK] Links: {len(content.get('links', []))}")

# Save to JSON file for analysis
with open('wix_content_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(all_content, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 80)
print("Content saved to wix_content_extracted.json")
print("\nNow displaying key content for each page:")
print("=" * 80)

for page_name, content in all_content.items():
    if 'error' not in content:
        print(f"\n\n{80 * '='}")
        print(f"PAGE: {page_name.upper()}")
        print(f"{80 * '='}")
        
        if content.get('headings'):
            print("\n--- HEADINGS ---")
            for h in content['headings'][:10]:
                print(f"  {h['level'].upper()}: {h['text']}")
        
        if content.get('paragraphs'):
            print("\n--- KEY PARAGRAPHS ---")
            for p in content['paragraphs'][:5]:
                print(f"  • {p[:150]}..." if len(p) > 150 else f"  • {p}")
        
        if content.get('images'):
            print(f"\n--- IMAGES ({len(content['images'])}) ---")
            for img in content['images'][:3]:
                print(f"  • {img['alt']}: {img['src'][:80]}...")
