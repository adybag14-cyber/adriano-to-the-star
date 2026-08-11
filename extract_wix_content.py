import re
import json

def extract_text_from_html(html_content):
    """Extract readable text from HTML, avoiding scripts and styles"""
    # Remove script tags and their content
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    # Remove style tags and their content
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    # Remove HTML comments
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Decode HTML entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Read each artifact file
files = {
    'general-5': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_017hRLVaM33QzxXjXpTDt8PS-59866378.log',
    'about-5': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_01MjyUPLoKxR5KeWk6mbLTR5-59870208.log',
    'database': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_01AQxZgZEEmRzvpmv1F5YgEz-59869968.log',
    'book-online': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_01YYb95iLZRwxNNxtTackonG-59867507.log',
    'single-project': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_01X4tHsfmTUppE4AgtMkTLkd-59866299.log',
    'team-3': r'C:\Users\adyba\.factory\artifacts\tool-outputs\fetch_url-toolu_bdrk_01XxmGV1dURGFAiUL4NMkd9S-59866300.log'
}

for page_name, file_path in files.items():
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract just the markdown/text content portion
            if 'Markdown content:' in content:
                markdown_section = content.split('Markdown content:')[1]
                text = extract_text_from_html(markdown_section)
                # Get first 500 chars of meaningful content
                words = text.split()[:200]
                print(f"\n{'='*60}")
                print(f"PAGE: {page_name}")
                print(f"{'='*60}")
                print(' '.join(words))
    except Exception as e:
        print(f"Error reading {page_name}: {e}")
