import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin, urlparse
import time

def download_file(url, save_path):
    """Download a file from URL to save_path"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded: {url}")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def scrape_wix_site(url, output_dir):
    """Advanced scraping of Wix website"""
    print(f"Fetching {url}...")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Create directories
    images_dir = os.path.join(output_dir, 'images')
    css_dir = os.path.join(output_dir, 'css')
    js_dir = os.path.join(output_dir, 'js')
    
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(css_dir, exist_ok=True)
    os.makedirs(js_dir, exist_ok=True)
    
    # Download all images
    print("\nDownloading images...")
    img_count = 0
    for img in soup.find_all('img'):
        img_url = img.get('src') or img.get('data-src')
        if img_url:
            if not img_url.startswith('http'):
                img_url = urljoin(url, img_url)
            
            # Generate filename
            filename = f"image_{img_count}.jpg"
            save_path = os.path.join(images_dir, filename)
            
            if download_file(img_url, save_path):
                img['src'] = f'images/{filename}'
                img_count += 1
            
            time.sleep(0.5)  # Be polite to the server
    
    # Download stylesheets
    print("\nDownloading stylesheets...")
    for link in soup.find_all('link', rel='stylesheet'):
        css_url = link.get('href')
        if css_url and css_url.startswith('http'):
            filename = os.path.basename(urlparse(css_url).path) or 'style.css'
            save_path = os.path.join(css_dir, filename)
            if download_file(css_url, save_path):
                link['href'] = f'css/{filename}'
    
    # Save the HTML
    html_path = os.path.join(output_dir, 'index_scraped.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print(f"\n✓ Scraping complete! Files saved to {output_dir}")
    print(f"✓ Downloaded {img_count} images")
    
    # Parse shop.js for product data
    print("\nExtracting product data from shop.js...")
    products = []
    shop_js_path = os.path.join(js_dir, 'shop.js')
    
    # If shop.js wasn't downloaded (maybe it's inline or named differently), try to find it in the soup
    if not os.path.exists(shop_js_path):
        print("shop.js not found in js directory, checking HTML scripts...")
        for script in soup.find_all('script'):
            if script.get('src') and 'shop.js' in script.get('src'):
                js_url = script.get('src')
                if not js_url.startswith('http'):
                    js_url = urljoin(url, js_url)
                download_file(js_url, shop_js_path)
                break
    
    if os.path.exists(shop_js_path):
        try:
            with open(shop_js_path, 'r', encoding='utf-8') as f:
                js_content = f.read()
            
            # Regex to find the products array
            # Looking for: this.products = [ ... ];
            # This is a simple regex and might need adjustment if the JS format changes
            match = re.search(r'this\.products\s*=\s*(\[\s*\{.*\}\s*\]);', js_content, re.DOTALL)
            if match:
                products_json_str = match.group(1)
                # Clean up the JS object to make it valid JSON
                # 1. Quote keys (id:, name:, etc.)
                products_json_str = re.sub(r'(\s)([a-zA-Z0-9_]+):', r'\1"\2":', products_json_str)
                # 2. Remove comments
                products_json_str = re.sub(r'//.*', '', products_json_str)
                # 3. Remove trailing commas
                products_json_str = re.sub(r',\s*([\]}])', r'\1', products_json_str)
                # 4. Handle single quotes to double quotes
                products_json_str = products_json_str.replace("'", '"')
                
                import json
                try:
                    products = json.loads(products_json_str)
                    print(f"✓ Found {len(products)} products")
                    
                    # Save to products.json
                    products_path = os.path.join(output_dir, 'products.json')
                    with open(products_path, 'w', encoding='utf-8') as f:
                        json.dump(products, f, indent=2)
                    print(f"✓ Saved products to {products_path}")
                except json.JSONDecodeError as e:
                    print(f"⚠ Failed to parse product JSON: {e}")
                    print("Raw string:", products_json_str[:200] + "...")
            else:
                print("⚠ Could not find 'this.products' in shop.js")
        except Exception as e:
            print(f"⚠ Error processing shop.js: {e}")
    else:
        print("⚠ shop.js not found, cannot extract products")

    return soup

if __name__ == "__main__":
    url = "https://adrianobaggiano.wixsite.com/adriano-to-the-star"
    output_dir = os.path.dirname(os.path.abspath(__file__))
    scrape_wix_site(url, output_dir)
