import requests
import xml.etree.ElementTree as ET
import json

def submit_to_indexnow():
    sitemap_path = 'sitemap.xml'
    api_key = '79aa2fca849a4efe98a254a197fb1533'
    host = 'adrianotothestar.com'
    submit_endpoint = 'https://api.indexnow.org/indexnow'

    # Parse sitemap
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        
        # Namespace map often needed for sitemaps
        namespaces = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        urls = []
        for url in root.findall('ns:url', namespaces):
            loc = url.find('ns:loc', namespaces)
            if loc is not None:
                urls.append(loc.text)
        
        print(f"Found {len(urls)} URLs in sitemap.")
        
        if not urls:
            print("No URLs found to submit.")
            return

        # Prepared payload
        payload = {
            "host": host,
            "key": api_key,
            "keyLocation": f"https://{host}/{api_key}.txt", # Optional but helpful
            "urlList": urls
        }
        
        headers = {
            "Content-Type": "application/json; charset=utf-8"
        }

        print("Submitting to IndexNow...")
        response = requests.post(submit_endpoint, data=json.dumps(payload), headers=headers)
        
        if response.status_code == 200:
            print("Submission successful! (HTTP 200)")
        elif response.status_code == 202:
            print("Submission accepted! (HTTP 202) - IndexNow is verifying the key in the background.")
        else:
            print(f"Submission failed. Status Code: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    submit_to_indexnow()
