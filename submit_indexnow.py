"""Validate and optionally submit the production sitemap to IndexNow.

Submission is opt-in so local validation can never notify search engines by accident.
The existing, public root verification file is discovered without logging its key.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

HOST = "adrianotothestar.com"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_PATTERN = re.compile(r"^[A-Za-z0-9-]{8,128}$")
VERIFICATION_FILE = "79aa2fca849a4efe98a254a197fb1533.txt"


def sitemap_urls(path: Path) -> list[str]:
    root = ET.parse(path).getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text.strip() for node in root.findall("s:url/s:loc", namespace) if node.text]
    if not urls:
        raise RuntimeError("The sitemap contains no URLs.")
    if len(urls) > 10_000:
        raise RuntimeError("IndexNow accepts at most 10,000 URLs per request.")
    invalid = [url for url in urls if urlparse(url).scheme != "https" or urlparse(url).hostname != HOST]
    if invalid:
        raise RuntimeError("The sitemap contains a URL outside the production HTTPS host.")
    if len(urls) != len(set(urls)):
        raise RuntimeError("The sitemap contains duplicate URLs.")
    return urls


def verification_key(root: Path) -> tuple[str, Path]:
    candidate = root / VERIFICATION_FILE
    stem = candidate.stem
    if not candidate.is_file() or not KEY_PATTERN.fullmatch(stem):
        raise RuntimeError("The configured IndexNow root verification file is missing or invalid.")
    if candidate.read_text(encoding="utf-8").strip() != stem:
        raise RuntimeError("The configured IndexNow verification file does not match its public filename.")
    return stem, candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submit", action="store_true", help="Perform the external IndexNow notification.")
    parser.add_argument("--sitemap", default="public/sitemap.xml", help="Generated sitemap to validate and submit.")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    sitemap = (root / args.sitemap).resolve()
    urls = sitemap_urls(sitemap)
    key, key_file = verification_key(root)
    print(f"Validated {len(urls)} canonical HTTPS URLs and an existing root verification file.")
    if not args.submit:
        print("Dry run only. Pass --submit after the production health gate to notify IndexNow.")
        return 0

    payload = json.dumps({
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key_file.name}",
        "urlList": urls,
    }).encode("utf-8")
    request = urllib.request.Request(ENDPOINT, data=payload, headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"IndexNow rejected the production URL batch with HTTP {error.code}.") from error
    if status not in (200, 202):
        raise RuntimeError(f"IndexNow returned unexpected HTTP {status}.")
    print(f"IndexNow accepted the production URL batch (HTTP {status}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
