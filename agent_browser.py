from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

class AgentBrowser:
    def __init__(self):
        self.driver = None

    def start_browser(self):
        if not self.driver:
            options = Options()
            options.add_argument("--start-maximized")
            # options.add_argument("--headless") # Keep headful for now so user can see
            
            self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    def open_url(self, url):
        self.start_browser()
        try:
            if not url.startswith("http"): url = "https://" + url
            self.driver.get(url)
            return f"Opened {url}"
        except Exception as e:
            return f"Error opening URL: {e}"

    def read_page(self):
        if not self.driver: return "Browser not started."
        try:
            # Extract simple text
            body = self.driver.find_element(By.TAG_NAME, "body").text
            return body[:2000] + "\n...(truncated)" # Limit context
        except Exception as e:
            return f"Error reading page: {e}"

    def click_element(self, selector):
        if not self.driver: return "Error: Browser not started. Use [[BROWSE: <url>]] first."
        try:
            # Try by text first, then css, then xpath
            elements = self.driver.find_elements(By.PARTIAL_LINK_TEXT, selector)
            if not elements:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
            if not elements:
                # Try as XPATH (assuming selector might be text content search)
                try:
                    elements = self.driver.find_elements(By.XPATH, f"//*[contains(text(), '{selector}')]")
                except: pass
            
            if elements:
                elements[0].click()
                return f"Clicked {selector}"
            return "Element not found."
        except Exception as e:
            return f"Error clicking: {e}"
            
    def type_text(self, selector, text):
        if not self.driver: return "Error: Browser not started. Use [[BROWSE: <url>]] first."
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, selector) 
            if not elements:
                 # Try finding input by generic tag if selector is vague
                elements = self.driver.find_elements(By.TAG_NAME, "input")
            
            if elements:
                # Naive: type in first found or specified
                elements[0].send_keys(text)
                return f"Typed '{text}' into {selector}"
            return "Input not found."
        except Exception as e:
            return f"Error typing: {e}"

    def close(self):
        if self.driver:
            self.driver.quit()
            self.driver = None
