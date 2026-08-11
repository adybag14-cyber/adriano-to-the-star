import { test, expect } from '@playwright/test';

test('verify cj3.js loads correctly with 40 second wait and check for errors', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  const warnings = [];
  const networkRequests = [];
  const networkErrors = [];

  // Capture console messages
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleMessages.push(message);
    
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  // Capture network requests
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers()
    });
  });

  // Capture network responses
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({
        url: response.url(),
        status: status,
        statusText: response.statusText()
      });
    }
  });

  // Navigate to the page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait 40 seconds for everything to load
  console.log('Waiting 40 seconds for page to load...');
  await page.waitForTimeout(40000);
  
  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: 'test-results/starsector-40sec-screenshot.png',
    fullPage: true 
  });

  // Log console messages
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
    if (msg.location) {
      console.log(`  Location: ${msg.location.url}:${msg.location.lineNumber}`);
    }
  });

  // Log errors
  console.log('\n=== ERRORS ===');
  if (errors.length > 0) {
    errors.forEach(err => {
      console.log(`ERROR: ${err}`);
    });
  } else {
    console.log('No errors found ✓');
  }

  // Log warnings
  console.log('\n=== WARNINGS ===');
  if (warnings.length > 0) {
    warnings.forEach(warn => {
      console.log(`WARNING: ${warn}`);
    });
  } else {
    console.log('No warnings found ✓');
  }

  // Log network errors
  console.log('\n=== NETWORK ERRORS ===');
  if (networkErrors.length > 0) {
    networkErrors.forEach(err => {
      console.log(`NETWORK ERROR: ${err.status} ${err.statusText} - ${err.url}`);
    });
  } else {
    console.log('No network errors found ✓');
  }

  // Log network requests summary
  console.log('\n=== NETWORK REQUESTS SUMMARY ===');
  console.log(`Total requests: ${networkRequests.length}`);
  
  // Count by resource type
  const resourceTypes = {};
  networkRequests.forEach(req => {
    resourceTypes[req.resourceType] = (resourceTypes[req.resourceType] || 0) + 1;
  });
  console.log('Requests by type:');
  Object.entries(resourceTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Check for cj3.js requests
  const cj3Requests = networkRequests.filter(r => r.url.includes('cj3.js'));
  console.log(`\ncj3.js requests: ${cj3Requests.length}`);
  cj3Requests.forEach(req => {
    console.log(`  ${req.method} ${req.url}`);
  });

  // Check if cheerpjInit is defined
  const cheerpjInitDefined = await page.evaluate(() => {
    return typeof window.cheerpjInit === 'function';
  });
  console.log(`\ncheerpjInit defined: ${cheerpjInitDefined}`);

  // Check if cheerpjRunMain is defined
  const cheerpjRunMainDefined = await page.evaluate(() => {
    return typeof window.cheerpjRunMain === 'function';
  });
  console.log(`cheerpjRunMain defined: ${cheerpjRunMainDefined}`);

  // Check if cheerpjRunJar is defined
  const cheerpjRunJarDefined = await page.evaluate(() => {
    return typeof window.cheerpjRunJar === 'function';
  });
  console.log(`cheerpjRunJar defined: ${cheerpjRunJarDefined}`);

  // Check if cjFileBlob is defined
  const cjFileBlobDefined = await page.evaluate(() => {
    return typeof window.cjFileBlob === 'function';
  });
  console.log(`cjFileBlob defined: ${cjFileBlobDefined}`);

  // Verify all required functions are defined
  expect(cheerpjInitDefined).toBe(true);
  expect(cheerpjRunMainDefined).toBe(true);
  expect(cheerpjRunJarDefined).toBe(true);
  expect(cjFileBlobDefined).toBe(true);

  // Verify no critical errors
  const criticalErrors = errors.filter(err => 
    err.includes('Uncaught') || 
    err.includes('SyntaxError') ||
    err.includes('TypeError') ||
    err.includes('ReferenceError')
  );
  
  console.log(`\nCritical errors: ${criticalErrors.length}`);
  if (criticalErrors.length > 0) {
    criticalErrors.forEach(err => {
      console.log(`  CRITICAL: ${err}`);
    });
  }

  // Final summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log('✓ All CheerpJ functions are available');
  console.log(`✓ Screenshot saved to test-results/starsector-40sec-screenshot.png`);
  console.log(`✓ Console messages captured: ${consoleMessages.length}`);
  console.log(`✓ Network requests captured: ${networkRequests.length}`);
  
  if (criticalErrors.length === 0 && networkErrors.filter(e => e.status >= 500).length === 0) {
    console.log('✓ No critical errors found');
  } else {
    console.log('⚠ Some errors found - see details above');
  }
});
