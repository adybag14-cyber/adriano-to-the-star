import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const out = path.resolve('.artifacts/audit-20260904/bonsai-live');
await fs.mkdir(out, {recursive:true});
const result = { startedAt:new Date().toISOString(), origin:process.env.BASE_URL || 'http://127.0.0.1:8095', model:'bonsai-1.7b-gguf', mocked:false, browser:'installed Chrome, fresh isolated profile', errors:[], requests:[], failures:[] };
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-webgpu','--ignore-gpu-blocklist']});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const page = await context.newPage();
const deadline = setTimeout(()=>browser.close(),290_000);
page.on('pageerror',error=>result.errors.push(error.message));
page.on('requestfailed',request=>result.failures.push({url:request.url(),error:request.failure()?.errorText}));
page.on('response',response=>{if(/huggingface.co|cdn.jsdelivr.net.*bitgpu/.test(response.url())) result.requests.push({url:response.url(),status:response.status()});});
try {
  await page.goto(`${result.origin}/stellar-ai.html`,{waitUntil:'domcontentloaded'});
  result.gpu = await page.evaluate(async()=>{
    const adapter = await navigator.gpu?.requestAdapter();
    return adapter ? {available:true,vendor:adapter.info?.vendor,description:adapter.info?.description} : {available:false};
  });
  console.log('GPU',JSON.stringify(result.gpu));
  if (!result.gpu.available) throw new Error('No WebGPU adapter in isolated Chrome');
  await page.locator('#bonsai-model').selectOption('bonsai-1.7b-gguf');
  await page.locator('#bonsai-load').click();
  let previous = '';
  const started = Date.now();
  while (Date.now()-started < 240_000) {
    const state = await page.locator('#bonsai-status').evaluate(node=>({text:node.textContent,state:node.dataset.state}));
    if (state.text !== previous) { console.log(state.text); previous=state.text; }
    if (await page.evaluate(()=>window.stellarBonsai.isReady())) { result.loaded=true; break; }
    if(state.state==='error') throw new Error(state.text);
    await page.waitForTimeout(1000);
  }
  if (!result.loaded) throw new Error('Model did not become ready within240seconds');
  await page.locator('#message-input').fill('Reply with one sentence: what is an exoplanet?');
  await page.locator('#send-btn').click();
  await page.waitForFunction(()=>document.querySelector('.ai-message .message-text')?.textContent&&!document.querySelector('.ai-message .message-text').textContent.includes('Generating locally'),null,{timeout:40_000});
  result.reply = await page.locator('.ai-message .message-text').last().innerText();
  result.generated = !/Unable to complete|offline demo|curated offline/i.test(result.reply);
  result.status = await page.locator('#bonsai-status').innerText();
  await page.waitForFunction(()=>{
    const message=document.querySelector('.ai-message');
    return message && Number(getComputedStyle(message).opacity) >= .99;
  },null,{timeout:5000});
  await page.locator('.ai-message').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(out,'real-model-reply.png')});
} catch(error) {
  result.error=error.message;
  try {result.lastFailure=await page.evaluate(()=>window.stellarBonsai?.lastFailure?.());await page.screenshot({path:path.join(out,'load-result.png')});} catch {}
} finally {
  clearTimeout(deadline);
  result.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2));
  await browser.close();
}
console.log(JSON.stringify(result,null,2));
if(!result.generated) process.exitCode=1;
