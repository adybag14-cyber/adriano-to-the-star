import { test, expect } from '@playwright/test';

test('MechGen mechanism generation test', async ({ page }) => {
  // 1. Navigate to the MechGen service directly
  console.log('Navigating to MechGen service...');
  await page.goto('https://mechgen-web-531866272848.europe-west2.run.app/');

  // 2. Fill in the reactants (no iframe needed when hitting direct)
  console.log('Filling in reactants...');
  await page.fill('#reactants', 'acetone + water');

  // 5. Select input kind
  await page.selectOption('#input_kind', 'english');

  // 6. Click Generate
  console.log('Clicking Generate Mechanism...');
  await page.click('#submit');

  // 7. Wait for results
  console.log('Waiting for result card...');
  const resultCard = page.locator('#result');
  
  // Extend timeout as mechanism generation takes time
  await expect(resultCard).toBeVisible({ timeout: 60000 });

  // 8. Check if steps are produced
  const stepsContainer = page.locator('#steps');
  const stepsCount = await stepsContainer.locator('.card').count();
  console.log(`Mechanism produced ${stepsCount} steps.`);

  // 9. Fetch the result JSON
  const jobIDFull = await page.evaluate(() => document.getElementById('job_id').textContent.replace('JOB ID: ', '').replace('...', ''));
  console.log(`Full Job ID snippet: ${jobIDFull}`);
  
  const resultLink = await page.getAttribute('#result_link', 'href');
  console.log(`Fetching result from: ${resultLink}`);
  
  const resultResponse = await page.request.get(`https://mechgen-web-531866272848.europe-west2.run.app${resultLink}`);
  const resultJson = await resultResponse.json();
  console.log('Result JSON:', JSON.stringify(resultJson, null, 2));

  // 10. Take a screenshot of the results
  await page.screenshot({ path: 'mechgen-direct-result.png', fullPage: true });

  // Basic assertion
  expect(stepsCount).toBeGreaterThan(0);
});
