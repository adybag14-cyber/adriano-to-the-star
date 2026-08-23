"""Validate and optionally submit the production sitemap to IndexNow.

Submission is opt-in so local validation can never notify search engines by accident.
The existing, public root verification file is discovered without logging its key.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

HOST = "adrianotothestar.com"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_PATTERN = re.compile(r"^[A-Za-z0-9-]{8,128}$")
VERIFICATION_FILE = "70cf5dbdf5fa4e0f9e4f847c624468fe.txt"
TRANSIENT_CURL_EXIT_CODES = {5, 6, 7, 18, 28, 35, 52, 55, 56}


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


def submit_payload(payload: bytes) -> int:
    curl = shutil.which("curl.exe") or shutil.which("curl")
    if not curl:
        raise RuntimeError("Native curl is required for the IndexNow TLS transport.")
    command = [
        curl,
        "--silent",
        "--show-error",
        "--ipv4",
        "--http1.1",
        "--connect-timeout", "10",
        "--max-time", "30",
        "--output", os.devnull,
        "--write-out", "%{http_code}",
        "--request", "POST",
        "--header", "Content-Type: application/json; charset=utf-8",
        "--header", "Accept: application/json",
        "--header", "User-Agent: AdrianoToTheStar-IndexNow/1.0",
        "--data-binary", "@-",
        ENDPOINT,
    ]
    for attempt in range(1, 4):
        result = subprocess.run(command, input=payload, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if result.returncode == 0:
            try:
                status = int(result.stdout.decode("ascii").strip())
            except ValueError as error:
                raise RuntimeError("IndexNow transport returned an unreadable HTTP status.") from error
            if status in (200, 202):
                return status
            if status != 429 and status < 500:
                raise RuntimeError(f"IndexNow rejected the production URL batch with HTTP {status}.")
        elif result.returncode not in TRANSIENT_CURL_EXIT_CODES:
            raise RuntimeError(f"IndexNow curl transport failed with exit code {result.returncode}.")
        if attempt < 3:
            time.sleep(2 ** attempt)
    raise RuntimeError("IndexNow transport did not succeed after 3 bounded attempts.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submit", action="store_true", help="Perform the external IndexNow notification.")
    parser.add_argument("--sitemap", default="public/sitemap.xml", help="Generated sitemap to validate and submit.")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    sitemap = (root / args.sitemap).resolve()
    urls = sitemap_urls(sitemap)
    key, _ = verification_key(root)
    public_key_file = sitemap.parent / VERIFICATION_FILE
    if not public_key_file.is_file() or public_key_file.read_text(encoding="utf-8") != key:
        raise RuntimeError("The production artifact is missing the matching public IndexNow verification file.")
    print(f"Validated {len(urls)} canonical HTTPS URLs and matching source/public verification files.")
    if not args.submit:
        print("Dry run only. Pass --submit after the production health gate to notify IndexNow.")
        return 0

    payload = json.dumps({
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{public_key_file.name}",
        "urlList": urls,
    }).encode("utf-8")
    status = submit_payload(payload)
    print(f"IndexNow accepted the production URL batch (HTTP {status}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
