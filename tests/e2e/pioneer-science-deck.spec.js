/* global game, THREE, Storage, DOMException */
import { test, expect } from '@playwright/test';
import { installPioneerFunctionalProfile, applyPioneerFunctionalProfile, waitForQuantumSimulationCompletion, softwareFunctionalProfile, forceSwiftShader, swiftShaderLaunchOptions } from './helpers/pioneer-functional-profile.js';

if (forceSwiftShader) test.use({ launchOptions: swiftShaderLaunchOptions });
test.beforeEach(async ({ page }) => { await installPioneerFunctionalProfile(page); });

const panels = [
    ['megastructures','megastructure-dashboard'],['multiverse','multiverse-dashboard'],
    ['chrono','chrono-dashboard'],['neural','neural-calibration-dashboard'],
    ['sim','sim-dashboard'],['quantum','quantum-dashboard'],['dna','dna-dashboard'],
    ['comm','neural-dashboard'],['planet-viewer','planet-3d-modal']
];

async function ready(page) {
    await page.goto('/exoplanet-pioneer.html',{waitUntil:'domcontentloaded'});
    await applyPioneerFunctionalProfile(page);
    await page.waitForFunction(()=>window.game?.runtime?.frameCount>2);
    const skip=page.locator('#ep-tutorial-skip');if(await skip.isVisible())await skip.click();
    await page.evaluate(()=>game.setTimeSpeed(0,{silent:true}));
    await page.locator('#ep-data-toggle').click();
}
async function open(page,action,id){
    await page.locator(`#ep-open-${action}`).click();
    await expect(page.locator(`#${id}`)).toHaveAttribute('data-science-open','true');
}

for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    test(`all nine Science Deck tools occupy the viewport and close by keyboard on ${name}`,async({page},testInfo)=>{
        test.setTimeout(120000);
        await page.setViewportSize(viewport);const errors=[];
        page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
        await ready(page);
        for(const [action,id] of panels){
            await open(page,action,id);
            if(action==='planet-viewer')await expect(page.locator('#planet-3d-modal')).toHaveCSS('opacity','1');
            if(action==='neural')await expect(page.locator('#neural-calibration-status')).toContainText('Calibration complete');
            if(action==='quantum')await expect(page.locator('#qubit-view-container canvas')).toBeVisible();
            if(action==='sim')await expect(page.locator('#recursive-container canvas')).toBeVisible();
            const metrics=await page.locator(`#${id}`).evaluate(panel=>{
                const rect=panel.getBoundingClientRect(),close=panel.querySelector('[data-science-close]'),button=close?.getBoundingClientRect();
                const hit=button&&document.elementFromPoint(button.x+button.width/2,button.y+button.height/2);
                const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
                const contrasts=Array.from(panel.querySelectorAll('button:not([disabled])')).filter(node=>node.getClientRects().length).map(node=>{const style=getComputedStyle(node),fg=luminance(style.color),bg=luminance(style.backgroundColor);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});
                return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:innerWidth,height:innerHeight,hit:!!hit&&close.contains(hit),focus:panel.contains(document.activeElement),contrast:Math.min(...contrasts),closeTarget:Math.min(button.width,button.height)};
            });
            expect(metrics.left).toBeGreaterThanOrEqual(0);expect(metrics.right).toBeLessThanOrEqual(metrics.width);
            expect(metrics.top).toBeGreaterThanOrEqual(0);expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);
            expect(metrics.hit).toBe(true);expect(metrics.focus).toBe(true);
            expect(metrics.contrast).toBeGreaterThanOrEqual(4.5);expect(metrics.closeTarget).toBeGreaterThanOrEqual(44);
            await page.screenshot({path:testInfo.outputPath(`${action}-${name}.png`)});
            await page.keyboard.press('Escape');await expect(page.locator(`#${id}`)).toBeHidden();
            await expect(page.locator(`#ep-open-${action}`)).toBeFocused();
        }
        expect(errors).toEqual([]);
    });
}

test('engineering purchase changes actual instances and its complete transaction survives reload or rolls back',async({page})=>{
    await ready(page);
    await page.evaluate(()=>{game.resources.credits=2000;game.megastructureSystem.restore({swarmSatellites:0,matrioshkaStage:0});});
    await open(page,'megastructures','megastructure-dashboard');
    await page.locator('#btn-launch-satellite').click();
    expect(await page.evaluate(()=>({credits:game.resources.credits,count:game.megastructureSystem.swarmSatellites,instances:game.dysonSwarmMesh.count,anchored:game.dysonSwarmMesh.position.distanceTo(game.suns[0].mesh.position)<.01}))).toEqual({credits:1500,count:1,instances:1,anchored:true});
    await expect(page.locator('#swarm-count')).toHaveText('1');
    const rollback=await page.evaluate(()=>{
        const saved=localStorage.getItem('ep_save_v2'),original=Storage.prototype.setItem;
        Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};
        let purchased;try{purchased=game.megastructureSystem.launchSatellites(1);}finally{Storage.prototype.setItem=original;}
        return {purchased,credits:game.resources.credits,count:game.megastructureSystem.swarmSatellites,instances:game.dysonSwarmMesh.count,savedUnchanged:saved===localStorage.getItem('ep_save_v2')};
    });
    expect(rollback).toEqual({purchased:false,credits:1500,count:1,instances:1,savedUnchanged:true});
    await page.reload({waitUntil:'domcontentloaded'});await applyPioneerFunctionalProfile(page);await page.waitForFunction(()=>window.game?.runtime?.frameCount>2);
    expect(await page.evaluate(()=>({credits:game.resources.credits,count:game.megastructureSystem.swarmSatellites,instances:game.dysonSwarmMesh.count}))).toEqual({credits:1500,count:1,instances:1});
});

test('quantum tasks finish with real rewards, qubit works by keyboard and communication renders text safely',async({page})=>{
    test.setTimeout(softwareFunctionalProfile ? 120000 : 60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await ready(page);await open(page,'quantum','quantum-dashboard');
    await expect(page.locator('#qubit-view-container canvas')).toBeVisible();
    await page.evaluate(()=>{game.quantum.coherence=40;game.quantum.decayRate=0;});
    await page.locator('#qubit-view-container canvas').focus();await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>game.quantum.coherence)).toBe(65);
    await page.evaluate(()=>{game.quantum.coherence=100;for(const k of ['energy','minerals','data']){game.resources[k]=0;game.caps[k]=10000;}game.setTimeSpeed(1,{silent:true});});
    await page.locator('[data-task="Optimization"]').click();await page.locator('[data-task="Encryption"]').click();
    await waitForQuantumSimulationCompletion(page);
    const rewards=await page.evaluate(()=>({energy:game.resources.energy,minerals:game.resources.minerals,data:game.resources.data}));
    expect(rewards.energy).toBeGreaterThanOrEqual(500);expect(rewards.minerals).toBeGreaterThanOrEqual(200);expect(rewards.data).toBeGreaterThanOrEqual(500);
    await expect(page.locator('#quantum-task-status')).toContainText('complete');
    await page.keyboard.press('Escape');await open(page,'comm','neural-dashboard');
    const message='<img src=x onerror=alert(1)> status';
    await page.locator('#neural-chat-input').fill(message);await page.locator('#btn-neural-send').click();
    await expect(page.locator('#neural-chat-output')).toContainText(message);
    await expect(page.locator('#btn-neural-send')).toBeEnabled();
    expect(await page.locator('#neural-chat-output img').count()).toBe(0);
    await expect(page.locator('#neural-chat-output')).toContainText('Ship AI:');
    expect(errors).toEqual([]);
});

test('secondary controls change real states, cancel calibration and stop panel refresh on close',async({page})=>{
    await ready(page);await open(page,'neural','neural-calibration-dashboard');
    await page.keyboard.press('Escape');
    await expect.poll(()=>page.evaluate(()=>game.neural.calibrationInterval)).toBe(null);
    await open(page,'neural','neural-calibration-dashboard');
    await expect(page.locator('#neural-calibration-status')).toContainText('Calibration complete');
    await page.keyboard.press('Escape');
    await open(page,'multiverse','multiverse-dashboard');
    await page.locator('#breach-heavy-btn').click();
    await expect.poll(()=>page.evaluate(()=>game.universe.getActiveContext().gravity)).toBeGreaterThan(9.81);
    await expect(page.locator('#uni-name')).not.toHaveText('Prime Universe');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(()=>window.multiInterval)).toBe(null);
    await page.evaluate(()=>{
        game.temporal.history=Array.from({length:60},(_,i)=>({day:i+1,timeOfDay:3,resources:{...game.resources,minerals:1000+i},timeline:'test'}));
    });
    await open(page,'chrono','chrono-dashboard');
    await page.locator('#btn-chrono-rewind').click();
    expect(await page.evaluate(()=>({day:game.day,minerals:game.resources.minerals}))).toEqual({day:51,minerals:1050});
    await page.locator('#btn-chrono-entropy').click();await expect(page.locator('#btn-chrono-entropy')).toHaveAttribute('aria-pressed','true');
    await page.locator('#btn-chrono-entropy').click();await expect(page.locator('#btn-chrono-entropy')).toHaveAttribute('aria-pressed','false');
    await page.keyboard.press('Escape');expect(await page.evaluate(()=>window.chronoInterval)).toBe(null);
    await open(page,'sim','sim-dashboard');await expect(page.locator('#btn-toggle-twin')).toBeDisabled();
    await page.keyboard.press('Escape');expect(await page.evaluate(()=>game.recursion.isRunning)).toBe(false);
    await open(page,'sim','sim-dashboard');expect(await page.locator('#recursive-container canvas').count()).toBe(1);await page.keyboard.press('Escape');
    await open(page,'dna','dna-dashboard');await expect(page.locator('#btn-time-jump')).toBeDisabled();await expect(page.locator('#dna-sequence-display')).not.toContainText('NaN');await page.keyboard.press('Escape');
    await open(page,'planet-viewer','planet-3d-modal');
    await page.evaluate(()=>window.__planetViewer.camera.position.set(3,2,7));
    await page.locator('#reset-view-btn').click();
    const camera=await page.evaluate(()=>window.__planetViewer.camera.position.toArray());
    camera.forEach((value,index)=>expect(value).toBeCloseTo([0,0,5][index],8));
    await page.keyboard.press('Escape');
});

test('database shared viewer gates unavailable modules and preserves reset, focus and failure feedback',async({page},testInfo)=>{
    test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/database.html',{waitUntil:'domcontentloaded'});
    const trigger=page.locator('.view-3d-btn').first();await expect(trigger).toBeVisible({timeout:60000});await trigger.click();
    const modal=page.locator('#planet-3d-modal');await expect(modal).toBeVisible();await expect(modal).toHaveAttribute('role','dialog');
    await expect(page.locator('#ar-mode-btn')).toBeDisabled();await expect(page.locator('#ar-mode-btn')).toHaveText('AR unavailable');
    const states=await page.evaluate(()=>[['surface-view-btn','planetSurfaceViz','visualizePlanet'],['orbital-view-btn','orbitalMechanics','addPlanet'],['governance-btn','colonyGovernanceSystem','showGovernanceUI'],['combat-btn','tacticalCombatSystem','startBattle']].map(([id,key,method])=>({available:typeof window[key]?.[method]==='function',disabled:document.getElementById(id).disabled})));
    states.forEach(state=>expect(state.disabled).toBe(!state.available));
    const close=page.locator('#close-3d-btn');await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(close).toBeFocused();
    await page.evaluate(()=>window.planet3DViewer.camera.position.set(3,2,7));await page.locator('#reset-view-btn').click();
    const position=await page.evaluate(()=>window.planet3DViewer.camera.position.toArray());position.forEach((value,index)=>expect(value).toBeCloseTo([0,0,5][index],8));
    await page.evaluate(()=>{document.getElementById('canvas-container').requestFullscreen=()=>Promise.reject(new Error('Declined'));});
    const fullscreen=page.locator('#cardboard-btn');
    if(await fullscreen.isEnabled()){await fullscreen.click();await expect(page.locator('#xr-support-banner')).toContainText('unavailable or was declined');}
    const hit=await close.evaluate(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});expect(hit).toBe(true);
    await page.screenshot({path:testInfo.outputPath('database-viewer.png')});
    await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(trigger).toBeFocused();expect(errors).toEqual([]);
});
