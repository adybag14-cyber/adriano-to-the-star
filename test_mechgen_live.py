import asyncio
from playwright.async_api import async_playwright
import os

async def test_mechgen():
    async with async_playwright() as p:
        print("🚀 Starting Playwright...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = await context.new_page()
        
        url = "https://adrianotothestar.com/mechgen.html"
        print(f"🌐 Navigating to {url}...")
        
        try:
            # Navigate with a generous timeout
            await page.goto(url, timeout=60000, wait_until="networkidle")
            
            # Check for title
            title = await page.title()
            print(f"📄 Page Title: {title}")
            
            # Verify "MECHGEN" is present
            await page.wait_for_selector('text=MECHGEN', timeout=10000)
            print("🏗️ Header found.")
            
            # The actual form is inside an iframe
            print("🔍 Locating iframe...")
            iframe_element = page.frame_locator('#mechgen-frame')
            
            # Wait for the iframe content to load
            # Based on the screenshot, it should have a "Reactants" label or textarea
            print("⌨️ Typing reactants inside iframe...")
            # Let's try to find the textarea inside the iframe
            reactants_textarea = iframe_element.locator('textarea').first
            await reactants_textarea.wait_for(timeout=20000)
            await reactants_textarea.fill('acetone and water')
            
            # Click Generate Mechanism inside iframe
            print("🔘 Clicking Generate Mechanism inside iframe...")
            generate_btn = iframe_element.locator('button:has-text("Generate Mechanism")')
            await generate_btn.click()
            
            # Wait for some result or indicator
            print("⏳ Waiting for processing (10s)...")
            await asyncio.sleep(10) # Wait for AI response and image generation
            
            # Take a screenshot
            screenshot_path = 'mechgen_live_success.png'
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved to {screenshot_path}")
            
            print("✅ Live test completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during test: {e}")
            # Take error screenshot if possible
            try:
                await page.screenshot(path='mechgen_error_v3.png', full_page=True)
                print("📸 Error screenshot saved to mechgen_error_v3.png")
            except:
                pass
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_mechgen())
