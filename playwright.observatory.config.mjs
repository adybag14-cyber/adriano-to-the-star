import { defineConfig } from '@playwright/test';
const baseURL = process.env.OBS_BASE_URL || 'http://127.0.0.1:8097';
const parsed = new URL(baseURL);
if (!['127.0.0.1','localhost'].includes(parsed.hostname)) throw new Error('Candidate interaction tests only run against a local artifact. Use the read-only production capture command for the live website.');
export default defineConfig({
  testDir:'tests/observatory/browser', timeout:60000, expect:{timeout:15000}, fullyParallel:false,
  forbidOnly:!!process.env.CI, retries:0, workers:1,
  outputDir:'.artifacts/observatory/test-results',
  reporter:[['line'],['html',{outputFolder:'.artifacts/observatory/playwright-report',open:'never'}],['json',{outputFile:'.artifacts/observatory/tests.json'}]],
  use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure',serviceWorkers:'block'},
  projects:[
    {name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:950},deviceScaleFactor:1}},
    {name:'mobile',use:{browserName:'chromium',viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}}
  ]
});
