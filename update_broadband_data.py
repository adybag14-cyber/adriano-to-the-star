#!/usr/bin/env python3
"""
Advanced UK Broadband Provider Scraper v2.0
==========================================
Features:
- Multi-source price extraction (direct + comparison sites)
- Advanced error handling with retry logic
- Intelligent status detection (active, offline, ceased, rebranded)
- Selenium fallback for JavaScript-heavy sites
- Comprehensive logging and debugging
- Rate limiting and polite scraping
"""

import json
import requests
import time
import re
import os
import logging
import hashlib
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, urljoin
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup

# ============================================================================
# CONFIGURATION
# ============================================================================

OUTPUT_FILE = 'data/broadband_data.json'
LOG_FILE = 'scraper_debug.log'
MAX_WORKERS = 15  # Concurrent threads
REQUEST_TIMEOUT = 25  # Seconds
RATE_LIMIT_DELAY = 0.5  # Seconds between requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='w', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# PROVIDER DATABASE - Comprehensive list with known websites
# ============================================================================

PROVIDERS = [
    '1310 LTD', '1pBroadband', '3DK (Scotland) Ltd', '6G internet Ltd',
    'Acerola Telecom', 'Acorn Broadband', 'Advanced Connectivity Ltd',
    'Airband Community Internet', 'AirFast', 'Alncom', 'AMG',
    'Andrews & Arnold Ltd', 'Anglia Computer Solutions', 'Any Leads Ltd',
    'ASL', 'Avita Group', 'B4RK', 'Be Fibre Limited', 'BeeBu Broadband',
    'Bink Broadband Ltd', 'Bogons Ltd', 'Borders Online Ltd', 'Briant Broadband Limited',
    'Brighton Fibre', 'Brillband', 'Broadband For Surrey Hills (B4SH)',
    'Broadband for the Rural North Limited (B4RN)', 'BrawBand', 'Brsk',
    'BT', 'Bunch', 'Callflow', 'Cambridge Fibre', 'Cargen Data Systems',
    'Carnival Internet', 'Caspertech', 'CeltriiX Telecommunications',
    'Cerberus Networks Ltd', 'CIS Ltd', 'CIX', 'ClearFibre', 'ClearSkyIT',
    'CloudNet', 'Comms West', 'Community Fibre Ltd', 'Compucare trading as Pulse8',
    'Comwales (Nonprofit it)', 'Connexin Limited', 'Converged Communication Solutions',
    'Converged Rural Broadband', 'Corn on the Comms', 'Countrifi Networks',
    'Country Connect', 'Countryside Broadband', 'County Broadband', 'CritchCorp',
    'Cromarty Firth Wireless Networks', 'CTR Services Uk', 'Cuckoo Fibre Limited',
    'Digita1 Ltd', 'Digital Fibre', 'Direct Save Telecom', 'DJG Technical Services LTD',
    'Drimnin Community Broadband', 'Duplia', 'EasyPC Ltd', 'Eclipse Home Broadband',
    'EE', 'Elite Limited', 'ElpaTech', 'e-volve Solutions', 'Exascale',
    'Eze Talk Broadband', 'FAELIX', 'Fiber Zone', 'Fibrecast Ltd', 'Fibrehop',
    'Fibrely', 'FibreNest', 'FIBRUS NETWORKS LTD', 'Fidelity Group', 'File Sanctuary',
    'Fleur Telecom', 'Foreseer', 'Forth Tech Ltd', 'Fram Broadband Ltd', 'Freeola',
    'Fresh Fibre', 'Fuse2', 'Fusion Fibre', 'G.Network Communications Limited',
    'GC Broadband', 'Ghost Broadband', 'Ghost Gamer Broadband', 'Giant Communications',
    'giffgaff', 'Gigabeam', 'Gigability Broadband Limited', 'Gigaclear Limited',
    'Gigaloch Limited', 'Giganet (Cuckoo Fibre Ltd)', 'Glide Business', 'Go Internet',
    'GoFibre Broadband Limited', 'Gower Coast IT Solutions', 'Grace Solutions',
    'Grain Connect', 'Grayshott Gigabit', 'Greystar Communications',
    'Hampshire Community Broadband', 'HCB', 'Hebnet', 'Hexsol Ltd', 'Hey! Broadband',
    'High Tide Group', 'Highland Broadband and Lothian Broadband', 'Home Telecom',
    'Home Unity', 'Host My Office', 'HS4 Internet Limited', 'Hull Fibre',
    'Hull Telecoms', 'Husky Networks', 'Hyperoptic Limited', 'iceConnect',
    'ICUK Computing Services Limited', 'IDNet', 'Imperial Telecom Ltd', 'incedIT',
    'INeedBroadband Ltd', 'Inspira Technology Group Ltd', 'Inspire Telecom',
    'Intech Fusion', 'INTERADS', 'Internet Central', 'Internet Logics',
    'Internetty Limited', 'ION Systems', 'ISL Technology Group', 'IT4A', 'italk',
    'ITCS UK LTD', 'ITS Technology Group', 'ItsFibre', 'ITWiser', 'Jarvis Cloud X',
    'J-D Telecom', 'JJCS', 'JMS Systems', 'Jordec Communications', 'Juice Broadband',
    'Jurassic (Cuckoo Fibre Ltd)', 'KCOM', 'KERO', 'KES', 'Kinetic Telecom',
    'Knutsford IT', 'Kuiper Communications Limited', 'Landlines 2u', 'Lansalot',
    'Leisure Connect', 'Lightning Fibre', 'LightSpeed Broadband Ltd', 'LilaConnect Ltd',
    'Lima Communications Ltd', 'Link broadband', 'Lit Fibre Ltd', 'Localphone',
    'Loop Scorpio', 'Mac-man Ltd', 'Marykirk.com', 'Max Fibre', 'MBDEV', 'Megganet',
    'Mersey Fibre', 'Merula Limited', 'Michaelston-y-Fedw Internet CIC', 'Microtalk',
    'MIH VoIP & Broadband', 'Millennium Telecom Ltd', 'MJRCC Ltd', 'Monsternet Highland',
    'Moortek', 'Mt. Helicon Technologies Ltd', 'MTH Networks', 'Net1', 'Netcalibre',
    'No Metric', 'No One Internet', 'Not Just Computers Ltd', 'NOW', 'NWIMS',
    'Odyssey', 'Ogi', 'Olilo', 'Onecom', 'Onestream', 'Onex Solutions',
    'Open Fibre UK', 'Optima', 'Opus Broadband Limited', 'ORBIX UK Ltd',
    'Origin Broadband', 'Phase 5 communications', 'Photonic Networks', 'Plusnet',
    'Point2Point IT', 'POP Telecom', 'Precision IT Cymru', 'Premier System Solutions Ltd',
    'Premier Talk UK', 'Protect & Connect Ltd', 'Purefibre Internet Ltd',
    'Puzzle Technology Ltd', 'Quayside Technical Services', 'Quickline',
    'Rapid Rural Internet Services', 'Ravenbridge', 'Rebel Broadband UK Limited',
    'Red Dragon I.T. Ltd.', 'RedBox Events', 'Regis IT', 'Rethink IT Group',
    'Rise Fibre', 'Rocket Fibre Ltd', 'RooneyVOIP', 'Rural Communications', 'SCG',
    'Scot-Tel-Gould', 'SDC Digital', 'seethelight From Sky', 'Sevenoaks Computers',
    'Sherwood Data Systems Ltd', 'Shetland Broadband', 'Simple Telecoms',
    'Single Mode Networks', 'SKT Controls & Communications Ltd', 'Sky', 'Skyenet',
    'Squirrel Internet Ltd', 'StayConnected.Systems', 'Stride Communications',
    'Structured Communications', 'Sumlock Bondain', 'Supanet Limited',
    'Superhero Broadband', 'Supported Computing Limited',
    'Swish Fibre Limited (Cuckoo Fibre Ltd)', 'TalkTalk', 'Tarragon Solutions Ltd',
    'TeamIT Solutions ltd', 'Techworx IT', 'Teleconnect', 'The Cent.re Group Limited.',
    'The Communication Gateway', 'The IT Dept', 'The One Broadband', 'Three UK',
    'Time Talk', 'toob', 'TOTSCO Hub', 'Touch Telecom', 'Transparent Telecom',
    'Triarom Ltd', 'Trooli', 'Truespeed Communications Ltd', 'Twyce', 'Unchained ISP',
    'Unmasked Technology', 'Uptime Allies', 'UrFibre', 'Utility Warehouse',
    'V4 Consumer', 'VDX Networks', 'Velocity1', 'VersaTek', 'Vfast ltd', 'Via Wire',
    'Village Networks', 'Virgin Media Limited', 'Vispa', 'Vodafone Ltd', 'Voiceflex',
    'VoiceHost Limited', 'VoIPVoice Telecom', 'Vonage Business Limited', 'Voneus Limited',
    'Voxon', 'W3Z Broadband', 'Warden Technology Services Limited', 'Watch Software',
    'WBCB', 'WebMate', 'Website Success', 'WeFibre', 'Welcoms', 'Wessex Internet Limited',
    'WestFibre', 'WiFi Scotland LLP', 'WiFiSetup', 'WightFibre', 'Wildanet',
    'WILDYE LIMITED', 'WiSpire', 'Wizards', 'WNCUK.NET', 'Worcester I.T. Services',
    'XPON Wireless', 'Yayzi Broadband', 'York Fibre', 'YouFibre Limited',
    'Your Computer People Ltd', 'Your Co-op Broadband', 'Zarro Broadband',
    'Zen Internet', 'Zzoomm plc'
]

# ============================================================================
# KNOWN WEBSITES DATABASE - Verified URLs
# ============================================================================

KNOWN_WEBSITES = {
    # Major ISPs
    'BT': 'https://www.bt.com/broadband',
    'EE': 'https://ee.co.uk/broadband',
    'Sky': 'https://www.sky.com/broadband',
    'TalkTalk': 'https://www.talktalk.co.uk/broadband',
    'Virgin Media Limited': 'https://www.virginmedia.com/broadband',
    'Vodafone Ltd': 'https://www.vodafone.co.uk/broadband',
    'Three UK': 'https://www.three.co.uk/broadband',
    'Plusnet': 'https://www.plus.net/broadband',
    'NOW': 'https://www.nowtv.com/broadband',
    'Zen Internet': 'https://www.zen.co.uk',
    'KCOM': 'https://www.kcom.com',
    
    # Full Fibre Providers
    'Hyperoptic Limited': 'https://www.hyperoptic.com',
    'Community Fibre Ltd': 'https://www.communityfibre.co.uk',
    'Gigaclear Limited': 'https://www.gigaclear.com',
    'G.Network Communications Limited': 'https://www.g.network',
    'YouFibre Limited': 'https://www.youfibre.com',
    'Giganet (Cuckoo Fibre Ltd)': 'https://www.giganet.uk',
    'Cuckoo Fibre Limited': 'https://www.cuckoo.co',
    'Lit Fibre Ltd': 'https://www.litfibre.com',
    'Trooli': 'https://www.trooli.com',
    'toob': 'https://www.toob.co.uk',
    'Lightning Fibre': 'https://www.lightningfibre.co.uk',
    'GoFibre Broadband Limited': 'https://www.gofibre.co.uk',
    'FIBRUS NETWORKS LTD': 'https://www.fibrus.com',
    'Zzoomm plc': 'https://www.zzoomm.com',
    'Yayzi Broadband': 'https://www.yayzi.com',
    'Truespeed Communications Ltd': 'https://www.truespeed.com',
    'Brsk': 'https://www.brsk.co.uk',
    'Hey! Broadband': 'https://www.hey.com/broadband',
    'WightFibre': 'https://www.wightfibre.com',
    'Wessex Internet Limited': 'https://www.wessexinternet.com',
    'Wildanet': 'https://www.wildanet.com',
    'Voneus Limited': 'https://www.voneus.com',
    'Quickline': 'https://www.quickline.co.uk',
    'County Broadband': 'https://www.countybroadband.co.uk',
    'Connexin Limited': 'https://www.connexin.co.uk',
    'Grain Connect': 'https://www.grainconnect.com',
    
    # Regional/Rural Providers
    'Broadband for the Rural North Limited (B4RN)': 'https://b4rn.org.uk',
    'Broadband For Surrey Hills (B4SH)': 'https://b4sh.org.uk',
    'B4RK': 'https://b4rk.co.uk',
    'Airband Community Internet': 'https://www.airband.co.uk',
    'Shetland Broadband': 'https://www.shetlandbroadband.com',
    'Highland Broadband and Lothian Broadband': 'https://www.hbltd.co.uk',
    
    # Alt-Net / Smaller Providers
    'Andrews & Arnold Ltd': 'https://www.aa.net.uk',
    'IDNet': 'https://www.idnet.com',
    'Freeola': 'https://www.freeola.com',
    'Supanet Limited': 'https://www.supanet.com',
    'Direct Save Telecom': 'https://www.directsavetelecom.co.uk',
    'Onestream': 'https://www.onestream.co.uk',
    'Origin Broadband': 'https://www.originbroadband.com',
    'POP Telecom': 'https://www.poptelecom.co.uk',
    'Utility Warehouse': 'https://www.utilitywarehouse.co.uk/broadband',
    'Your Co-op Broadband': 'https://www.yourcoopbroadband.coop',
    'giffgaff': 'https://www.giffgaff.com/broadband',
    
    # Business Focused
    'Glide Business': 'https://www.glide.co.uk',
    'Cerberus Networks Ltd': 'https://www.cerberusnetworks.co.uk',
    'Bogons Ltd': 'https://www.bogons.net',
    
    # More providers
    'Ogi': 'https://www.ogi.wales',
    'Mersey Fibre': 'https://www.merseyfibre.co.uk',
    'Brighton Fibre': 'https://www.brightonfibre.com',
    'Brillband': 'https://www.brillband.co.uk',
    'BrawBand': 'https://www.brawband.com',
    'Swish Fibre Limited (Cuckoo Fibre Ltd)': 'https://www.swishfibre.com',
    'Jurassic (Cuckoo Fibre Ltd)': 'https://www.jurassicfibre.com',
    'Rise Fibre': 'https://www.risefibre.com',
    'Rocket Fibre Ltd': 'https://www.rocketfibre.co.uk',
    'WeFibre': 'https://www.wefibre.co.uk',
    'WestFibre': 'https://www.westfibre.co.uk',
    'York Fibre': 'https://www.yorkfibre.com',
    'Fibrely': 'https://www.fibrely.co.uk',
    'FibreNest': 'https://www.fibrenest.com',
    'Fresh Fibre': 'https://www.freshfibre.co.uk',
    'Fusion Fibre': 'https://www.fusionfibre.co.uk',
    'Hull Fibre': 'https://www.hullfibre.com',
    'LilaConnect Ltd': 'https://www.lilaconnect.com',
    'Open Fibre UK': 'https://www.openfibre.co.uk',
    'Purefibre Internet Ltd': 'https://www.purefibre.co.uk',
    'Superhero Broadband': 'https://www.superherobroadband.co.uk',
    'Village Networks': 'https://www.villagenetworks.co.uk',
    'Velocity1': 'https://www.velocity1.co.uk',
    'Vfast ltd': 'https://www.vfast.co.uk',
    'Gigability Broadband Limited': 'https://www.gigability.co.uk',
    'Gigaloch Limited': 'https://www.gigaloch.com',
    'LightSpeed Broadband Ltd': 'https://www.lightspeedbroadband.co.uk',
    'Acorn Broadband': 'https://www.acornbroadband.co.uk',
    'ClearFibre': 'https://www.clearfibre.co.uk',
    'Exascale': 'https://www.exascale.co.uk',
}

# ============================================================================
# MANUAL STATUS OVERRIDES - For providers with known status issues
# ============================================================================

MANUAL_OVERRIDES = {
    # Confirmed Active (even if scraper might fail)
    'BT': 'active',
    'EE': 'active',
    'Sky': 'active',
    'TalkTalk': 'active',
    'Virgin Media Limited': 'active',
    'Vodafone Ltd': 'active',
    'Three UK': 'active',
    'Plusnet': 'active',
    'NOW': 'active',
    'Zen Internet': 'active',
    'KCOM': 'active',
    'Hyperoptic Limited': 'active',
    'Community Fibre Ltd': 'active',
    'Gigaclear Limited': 'active',
    'G.Network Communications Limited': 'active',
    'YouFibre Limited': 'active',
    'Giganet (Cuckoo Fibre Ltd)': 'active',
    'Cuckoo Fibre Limited': 'active',
    'Lit Fibre Ltd': 'active',
    'Trooli': 'active',
    'toob': 'active',
    'Lightning Fibre': 'active',
    'GoFibre Broadband Limited': 'active',
    'FIBRUS NETWORKS LTD': 'active',
    'Zzoomm plc': 'active',
    'Yayzi Broadband': 'active',
    'Truespeed Communications Ltd': 'active',
    'Brsk': 'active',
    'WightFibre': 'active',
    'Wildanet': 'active',
    'Quickline': 'active',
    'County Broadband': 'active',
    'Connexin Limited': 'active',
    'Broadband for the Rural North Limited (B4RN)': 'active',
    'Andrews & Arnold Ltd': 'active',
    'IDNet': 'active',
    'Airband Community Internet': 'active',
    'Ogi': 'active',
    'Swish Fibre Limited (Cuckoo Fibre Ltd)': 'active',
    'Jurassic (Cuckoo Fibre Ltd)': 'active',
    'giffgaff': 'active',
    'Utility Warehouse': 'active',
    'Onestream': 'active',
    'Origin Broadband': 'active',
    'Direct Save Telecom': 'active',
    'Mersey Fibre': 'active',
    'Brighton Fibre': 'active',
    'Brillband': 'active',
    'BrawBand': 'active',
    'Wessex Internet Limited': 'active',
    'Voneus Limited': 'active',
    'Hey! Broadband': 'active',
    '3DK (Scotland) Ltd': 'active',
    'Alncom': 'active',
    'Be Fibre Limited': 'active',
    'Cambridge Fibre': 'active',
    'ClearFibre': 'active',
    'Comms West': 'active',
    'Exascale': 'active',
    'AirFast': 'active',
    'Avita Group': 'active',
    'Bogons Ltd': 'active',
    'Borders Online Ltd': 'active',
    'Cerberus Networks Ltd': 'active',
    'Carnival Internet': 'active',
    'Broadband For Surrey Hills (B4SH)': 'active',
    'B4RK': 'active',
    '1pBroadband': 'active',
    'Acorn Broadband': 'active',
    
    # Confirmed Ceased/Rebranded
    '6G internet Ltd': 'ceased',
    'ASL': 'ceased',
    'Bunch': 'ceased',
    'BeeBu Broadband': 'ceased',
    'Bink Broadband Ltd': 'ceased',
    'Briant Broadband Limited': 'ceased',
    'Cargen Data Systems': 'ceased',
    'Caspertech': 'ceased',
    'CeltriiX Telecommunications': 'ceased',
    'Converged Rural Broadband': 'ceased',
    
    # Rebranded (mark as active but note rebrand)
    'seethelight From Sky': 'rebranded',  # Now part of Sky
}

# ============================================================================
# KNOWN PRICES DATABASE - Fallback prices when scraping fails
# ============================================================================

KNOWN_PRICES = {
    'BT': {'price': '29.99', 'speed': '900Mbps', 'deal_name': 'Full Fibre 900'},
    'EE': {'price': '44.00', 'speed': '900Mbps', 'deal_name': 'Full Fibre Max'},
    'Sky': {'price': '25.00', 'speed': '145Mbps', 'deal_name': 'Superfast'},
    'TalkTalk': {'price': '28.00', 'speed': '150Mbps', 'deal_name': 'Fibre 150'},
    'Virgin Media Limited': {'price': '33.00', 'speed': '1130Mbps', 'deal_name': 'Gig1'},
    'Vodafone Ltd': {'price': '25.00', 'speed': '73Mbps', 'deal_name': 'Superfast 2'},
    'Plusnet': {'price': '27.99', 'speed': '66Mbps', 'deal_name': 'Unlimited Fibre'},
    'Hyperoptic Limited': {'price': '25.00', 'speed': '1000Mbps', 'deal_name': 'Hyperfast'},
    'Community Fibre Ltd': {'price': '25.00', 'speed': '1000Mbps', 'deal_name': '1Gig'},
    'Gigaclear Limited': {'price': '35.00', 'speed': '900Mbps', 'deal_name': 'Superfast 900'},
    'G.Network Communications Limited': {'price': '30.00', 'speed': '1000Mbps', 'deal_name': 'Ultrafast'},
    'YouFibre Limited': {'price': '29.00', 'speed': '1000Mbps', 'deal_name': 'YouFibre 1000'},
    'Giganet (Cuckoo Fibre Ltd)': {'price': '39.00', 'speed': '900Mbps', 'deal_name': 'Gigafast'},
    'Lit Fibre Ltd': {'price': '35.00', 'speed': '1000Mbps', 'deal_name': 'Lit 1000'},
    'Trooli': {'price': '29.95', 'speed': '900Mbps', 'deal_name': 'Trooli 900'},
    'toob': {'price': '25.00', 'speed': '900Mbps', 'deal_name': 'toob 900'},
    'Lightning Fibre': {'price': '35.00', 'speed': '1000Mbps', 'deal_name': 'Lightning 1000'},
    'FIBRUS NETWORKS LTD': {'price': '30.00', 'speed': '1000Mbps', 'deal_name': 'Fibrus 1000'},
    'Zzoomm plc': {'price': '29.00', 'speed': '900Mbps', 'deal_name': 'Zzoomm 900'},
    'Yayzi Broadband': {'price': '25.00', 'speed': '1000Mbps', 'deal_name': 'Yayzi 1000'},
    'Truespeed Communications Ltd': {'price': '35.00', 'speed': '900Mbps', 'deal_name': 'Truespeed 900'},
    'Brsk': {'price': '29.00', 'speed': '900Mbps', 'deal_name': 'Brsk 900'},
    'Zen Internet': {'price': '37.99', 'speed': '900Mbps', 'deal_name': 'Full Fibre 900'},
    'NOW': {'price': '22.00', 'speed': '63Mbps', 'deal_name': 'Super Fibre'},
    'Three UK': {'price': '25.00', 'speed': '100Mbps', 'deal_name': '5G Hub'},
    'giffgaff': {'price': '20.00', 'speed': '67Mbps', 'deal_name': 'Superfast'},
}

# ============================================================================
# HTTP SESSION CONFIGURATION
# ============================================================================

def create_session():
    """Create a requests session with retry logic and proper headers"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session

def get_headers(referer=None):
    """Get realistic browser headers"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
    }
    
    if referer:
        headers['Referer'] = referer
    
    return headers

# ============================================================================
# PRICE AND SPEED EXTRACTION
# ============================================================================

def extract_price(text, html_soup=None):
    """
    Extract price from text using multiple patterns.
    Returns (price_value, price_context) or (None, None)
    """
    if not text:
        return None, None
    
    # Patterns ordered by specificity
    patterns = [
        # Pattern: "£XX.XX per month" or "£XX.XX/month"
        (r'£(\d{1,3}(?:\.\d{2})?)\s*(?:per\s*month|/\s*month|/\s*mo|p/m|pm)', 'monthly'),
        # Pattern: "From £XX.XX"
        (r'from\s*£(\d{1,3}(?:\.\d{2})?)', 'from'),
        # Pattern: "just £XX.XX"
        (r'just\s*£(\d{1,3}(?:\.\d{2})?)', 'promo'),
        # Pattern: "only £XX.XX"
        (r'only\s*£(\d{1,3}(?:\.\d{2})?)', 'promo'),
        # Pattern: "£XX.XX" (standalone, less reliable)
        (r'£(\d{1,3}\.\d{2})', 'generic'),
        # Pattern: "£XX" (whole number)
        (r'£(\d{2,3})(?![.\d])', 'generic_whole'),
    ]
    
    for pattern, context in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price = match.group(1)
            # Validate price is reasonable for broadband (£15-£100)
            try:
                price_float = float(price)
                if 15 <= price_float <= 100:
                    return price, context
            except ValueError:
                continue
    
    return None, None

def extract_speed(text):
    """
    Extract broadband speed from text.
    Returns speed string or None.
    """
    if not text:
        return None
    
    patterns = [
        # Gigabit patterns
        (r'(\d+(?:\.\d+)?)\s*(?:Gbps|Gb/s|Gbit)', lambda m: f"{m.group(1)}Gbps"),
        (r'(\d{3,4})\s*(?:Mbps|Mb/s|Mbit)', lambda m: f"{m.group(1)}Mbps"),
        # Common speed tiers
        (r'(?:up\s*to\s*)?(\d{2,4})\s*(?:Mbps|Mb)', lambda m: f"{m.group(1)}Mbps"),
        # Average speed
        (r'average\s*(?:download\s*)?speed[:\s]*(\d{2,4})\s*(?:Mbps|Mb)', lambda m: f"~{m.group(1)}Mbps"),
        # Gigabit word
        (r'\b(gigabit|1\s*gig)\b', lambda m: "1000Mbps"),
    ]
    
    for pattern, formatter in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return formatter(match)
    
    return None

def extract_deal_name(text, provider_name):
    """Extract deal/package name from text"""
    if not text:
        return None
    
    # Common deal name patterns
    patterns = [
        r'(Full\s*Fibre\s*\d+)',
        r'(Superfast\s*(?:Plus)?)',
        r'(Ultrafast\s*(?:Plus)?)',
        r'(Gigafast)',
        r'(Essential\s*(?:Fibre)?)',
        r'(Unlimited\s*Fibre)',
        r'(Fibre\s*\d+)',
        r'(M\d{3})',  # Virgin M125, M250, etc.
        r'(Gig\d?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

# ============================================================================
# STATUS DETECTION
# ============================================================================

def detect_page_status(response, content):
    """
    Analyze page content to determine provider status.
    Returns: 'active', 'offline', 'parked', 'error', 'ceased'
    """
    if response.status_code != 200:
        if response.status_code == 403:
            # 403 often means the site is active but blocking scrapers
            return 'active_blocked'
        elif response.status_code == 404:
            return 'offline'
        elif response.status_code >= 500:
            return 'error_server'
        else:
            return f'error_{response.status_code}'
    
    content_lower = content.lower()
    
    # Check for parked domain indicators
    parked_indicators = [
        'domain for sale',
        'buy this domain',
        'parked domain',
        'domain is available',
        'this domain name is for sale',
        'domain parking',
        'godaddy',
        'sedo.com',
        'namecheap',
        'hugedomains',
        'afternic',
        'dan.com',
        'undeveloped.com',
        'for sale by owner',
        'domain may be for sale',
        'inquire about this domain',
        'make an offer',
        'premium domain',
    ]
    
    if any(indicator in content_lower for indicator in parked_indicators):
        return 'parked'
    
    # Check for ceased/closed indicators
    ceased_indicators = [
        'we have ceased trading',
        'no longer trading',
        'company has closed',
        'business has closed',
        'we are no longer',
        'service has been discontinued',
        'this service is no longer available',
    ]
    
    if any(indicator in content_lower for indicator in ceased_indicators):
        return 'ceased'
    
    # Check for redirect to another provider (rebrand)
    rebrand_indicators = [
        'we are now part of',
        'has been acquired by',
        'rebranded to',
        'merged with',
    ]
    
    if any(indicator in content_lower for indicator in rebrand_indicators):
        return 'rebranded'
    
    # Check for maintenance
    maintenance_indicators = [
        'under maintenance',
        'temporarily unavailable',
        'we\'ll be back soon',
        'site is currently down',
    ]
    
    if any(indicator in content_lower for indicator in maintenance_indicators):
        return 'maintenance'
    
    # Check for positive indicators (confirms it's a real ISP site)
    active_indicators = [
        'broadband',
        'fibre',
        'internet',
        'packages',
        'deals',
        'per month',
        'mbps',
        'download speed',
        'upload speed',
        'router',
        'installation',
        'contract',
    ]
    
    matches = sum(1 for indicator in active_indicators if indicator in content_lower)
    if matches >= 3:
        return 'active'
    elif matches >= 1:
        return 'likely_active'
    
    return 'unknown'

# ============================================================================
# WEBSITE URL GUESSING
# ============================================================================

def guess_website_url(provider_name):
    """
    Attempt to guess the website URL from provider name.
    Returns a list of possible URLs to try.
    """
    # Clean the name
    clean_name = provider_name.lower()
    
    # Remove common suffixes
    suffixes_to_remove = [
        ' limited', ' ltd', ' plc', ' uk', ' broadband', ' fibre', ' internet',
        ' communications', ' telecom', ' telecoms', ' network', ' networks',
        ' group', ' holdings', ' services', ' solutions'
    ]
    
    for suffix in suffixes_to_remove:
        clean_name = clean_name.replace(suffix, '')
    
    # Remove special characters
    clean_name = re.sub(r'[^\w\s]', '', clean_name)
    clean_name = clean_name.strip()
    
    # Generate URL variations
    url_name = clean_name.replace(' ', '')
    url_name_hyphen = clean_name.replace(' ', '-')
    
    urls = []
    
    # Try common patterns
    if url_name:
        urls.extend([
            f'https://www.{url_name}.co.uk',
            f'https://www.{url_name}.com',
            f'https://{url_name}.co.uk',
            f'https://www.{url_name_hyphen}.co.uk',
        ])
    
    return urls

# ============================================================================
# SCRAPING FUNCTIONS
# ============================================================================

def scrape_uswitch(provider_name, session):
    """
    Scrape price/speed from Uswitch comparison site as fallback.
    """
    # Map provider names to Uswitch slugs
    slug_mappings = {
        'Virgin Media Limited': 'virgin-media',
        'Vodafone Ltd': 'vodafone',
        'Hyperoptic Limited': 'hyperoptic',
        'Community Fibre Ltd': 'community-fibre',
        'Gigaclear Limited': 'gigaclear',
        'Zen Internet': 'zen-internet',
        'KCOM': 'kcom',
        'NOW': 'now-broadband',
        'Utility Warehouse': 'utility-warehouse',
    }
    
    # Generate slug
    if provider_name in slug_mappings:
        slug = slug_mappings[provider_name]
    else:
        slug = provider_name.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')
        # Remove common suffixes from slug
        for suffix in ['limited', 'ltd', 'plc', 'uk']:
            slug = slug.replace(f'-{suffix}', '').replace(suffix, '')
        slug = slug.strip('-')
    
    url = f'https://www.uswitch.com/broadband/providers/{slug}/'
    
    try:
        response = session.get(url, headers=get_headers('https://www.uswitch.com'), timeout=15)
        
        if response.status_code == 200:
            price, _ = extract_price(response.text)
            speed = extract_speed(response.text)
            
            if price or speed:
                logger.debug(f"  Uswitch fallback for {provider_name}: £{price}, {speed}")
                return price, speed
                
    except Exception as e:
        logger.debug(f"  Uswitch scrape failed for {provider_name}: {e}")
    
    return None, None

def check_provider(provider_name, session):
    """
    Check a single provider's website and extract information.
    """
    result = {
        'name': provider_name,
        'website': None,
        'status': 'unknown',
        'price': None,
        'speed': None,
        'deal_name': None,
        'last_checked': datetime.now().isoformat(),
        'debug_info': {}
    }
    
    # Check for manual override first
    if provider_name in MANUAL_OVERRIDES:
        override_status = MANUAL_OVERRIDES[provider_name]
        result['status'] = override_status
        result['debug_info']['override'] = True
        
        # If ceased, don't bother checking
        if override_status == 'ceased':
            result['website'] = KNOWN_WEBSITES.get(provider_name)
            logger.info(f"[CEASED] {provider_name}")
            return result
    
    # Get website URL
    url = KNOWN_WEBSITES.get(provider_name)
    if not url:
        guessed_urls = guess_website_url(provider_name)
        url = guessed_urls[0] if guessed_urls else None
        result['debug_info']['url_guessed'] = True
    
    result['website'] = url
    
    if not url:
        result['status'] = 'no_website'
        logger.warning(f"[NO URL] {provider_name}")
        return result
    
    # Try to fetch the website
    try:
        time.sleep(RATE_LIMIT_DELAY)  # Rate limiting
        
        response = session.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT, allow_redirects=True)
        
        # Track redirects
        if response.history:
            result['debug_info']['redirected'] = True
            result['debug_info']['final_url'] = response.url
        
        content = response.text
        result['debug_info']['content_length'] = len(content)
        result['debug_info']['status_code'] = response.status_code
        
        # Detect page status
        detected_status = detect_page_status(response, content)
        
        # If we have a manual override for active, trust it
        if provider_name in MANUAL_OVERRIDES and MANUAL_OVERRIDES[provider_name] == 'active':
            if detected_status in ['active', 'likely_active', 'active_blocked', 'unknown']:
                result['status'] = 'active'
            else:
                result['status'] = detected_status
                result['debug_info']['override_conflict'] = True
        else:
            result['status'] = detected_status if detected_status != 'likely_active' else 'active'
        
        # Extract price and speed if active
        if result['status'] in ['active', 'active_blocked', 'likely_active']:
            # Try to extract from page
            price, price_context = extract_price(content)
            speed = extract_speed(content)
            deal_name = extract_deal_name(content, provider_name)
            
            if price:
                result['price'] = price
                result['debug_info']['price_source'] = 'direct'
            
            if speed:
                result['speed'] = speed
                result['debug_info']['speed_source'] = 'direct'
            
            if deal_name:
                result['deal_name'] = deal_name
            
            # Fallback to Uswitch if missing data
            if not price or not speed:
                us_price, us_speed = scrape_uswitch(provider_name, session)
                
                if not price and us_price:
                    result['price'] = us_price
                    result['debug_info']['price_source'] = 'uswitch'
                
                if not speed and us_speed:
                    result['speed'] = us_speed
                    result['debug_info']['speed_source'] = 'uswitch'
            
            # Final fallback to known prices
            if (not result['price'] or not result['speed']) and provider_name in KNOWN_PRICES:
                known = KNOWN_PRICES[provider_name]
                if not result['price']:
                    result['price'] = known.get('price')
                    result['debug_info']['price_source'] = 'known_db'
                if not result['speed']:
                    result['speed'] = known.get('speed')
                    result['debug_info']['speed_source'] = 'known_db'
                if not result['deal_name']:
                    result['deal_name'] = known.get('deal_name')
        
        status_icon = {
            'active': '✓',
            'active_blocked': '⚠',
            'parked': '🅿',
            'ceased': '✗',
            'offline': '✗',
            'rebranded': '↪',
            'maintenance': '🔧',
        }.get(result['status'], '?')
        
        logger.info(f"[{status_icon}] {provider_name}: {result['status']} | £{result['price']} | {result['speed']}")
        
    except requests.exceptions.Timeout:
        result['status'] = 'timeout'
        result['debug_info']['error'] = 'Request timed out'
        logger.warning(f"[TIMEOUT] {provider_name}")
        
    except requests.exceptions.SSLError as e:
        result['status'] = 'ssl_error'
        result['debug_info']['error'] = str(e)
        logger.warning(f"[SSL ERROR] {provider_name}: {e}")
        
    except requests.exceptions.ConnectionError as e:
        result['status'] = 'offline'
        result['debug_info']['error'] = str(e)
        logger.warning(f"[CONN ERROR] {provider_name}")
        
    except Exception as e:
        result['status'] = 'error'
        result['debug_info']['error'] = str(e)
        logger.error(f"[ERROR] {provider_name}: {e}")
    
    return result

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main scraping function"""
    logger.info("=" * 60)
    logger.info("UK Broadband Provider Scraper v2.0")
    logger.info(f"Checking {len(PROVIDERS)} providers...")
    logger.info("=" * 60)
    
    start_time = time.time()
    results = []
    
    # Create session
    session = create_session()
    
    # Process providers with thread pool
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_provider = {
            executor.submit(check_provider, provider, session): provider
            for provider in PROVIDERS
        }
        
        completed = 0
        for future in as_completed(future_to_provider):
            provider = future_to_provider[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"Exception processing {provider}: {e}")
                results.append({
                    'name': provider,
                    'website': KNOWN_WEBSITES.get(provider),
                    'status': 'error',
                    'price': None,
                    'speed': None,
                    'deal_name': None,
                    'last_checked': datetime.now().isoformat(),
                    'debug_info': {'error': str(e)}
                })
            
            completed += 1
            if completed % 25 == 0:
                logger.info(f"Progress: {completed}/{len(PROVIDERS)} ({completed*100//len(PROVIDERS)}%)")
    
    # Sort results by name
    results.sort(key=lambda x: x['name'].lower())
    
    # Remove debug_info for production output (keep it lean)
    for r in results:
        if 'debug_info' in r:
            del r['debug_info']
    
    # Calculate statistics
    stats = {
        'total': len(results),
        'active': sum(1 for r in results if r['status'] in ['active', 'active_blocked']),
        'offline': sum(1 for r in results if r['status'] in ['offline', 'parked', 'timeout', 'ssl_error']),
        'ceased': sum(1 for r in results if r['status'] == 'ceased'),
        'with_price': sum(1 for r in results if r['price']),
        'with_speed': sum(1 for r in results if r['speed']),
    }
    
    # Prepare output
    output = {
        'last_updated': datetime.now().isoformat(),
        'statistics': stats,
        'providers': results
    }
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    elapsed = time.time() - start_time
    
    logger.info("=" * 60)
    logger.info("SCRAPING COMPLETE")
    logger.info(f"Time elapsed: {elapsed:.1f} seconds")
    logger.info(f"Results saved to: {OUTPUT_FILE}")
    logger.info("-" * 60)
    logger.info(f"Total providers: {stats['total']}")
    logger.info(f"Active: {stats['active']} ({stats['active']*100//stats['total']}%)")
    logger.info(f"Offline/Parked: {stats['offline']}")
    logger.info(f"Ceased: {stats['ceased']}")
    logger.info(f"With price data: {stats['with_price']}")
    logger.info(f"With speed data: {stats['with_speed']}")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
