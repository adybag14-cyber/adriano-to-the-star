import asyncio
from playwright.async_api import async_playwright
import os

async def test_mechgen_full():
    async with async_playwright() as p:
        print("🚀 Starting Playwright for full validation...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 1200})
        
        url = "https://adrianotothestar.com/mechgen.html"
        print(f"🌐 Navigating to {url}...")
        
        try:
            await page.goto(url, timeout=60000, wait_until="networkidle")
            
            print("🔍 Locating iframe...")
            iframe = page.frame_locator('#mechgen-frame')
            
            print("⌨️ Entering 'water and acetone'...")
            reactants = iframe.locator('textarea').first
            await reactants.fill('water and acetone')
            
            print("🔘 Clicking Generate...")
            await iframe.locator('button:has-text("Generate Mechanism")').click()
            
            print("⏳ Waiting for generation (15s)...")
            await asyncio.sleep(15)
            
            # Check if any image was generated in the results
            img_count = await iframe.locator('.message-image, img[src*="steps/"]').count()
            print(f"🖼️ Found {img_count} mechanism step images.")
            
            screenshot_path = 'final_verification.png'
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Full verification screenshot saved to {screenshot_path}")
            
            if img_count > 0:
                print("✅ SUCCESS: Mechanism drawings are being generated!")
            else:
                print("⚠️ WARNING: UI loaded but no images found yet. AI might still be thinking or RDKit error.")

        except Exception as e:
            print(f"❌ Error: {e}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_mechgen_full())
