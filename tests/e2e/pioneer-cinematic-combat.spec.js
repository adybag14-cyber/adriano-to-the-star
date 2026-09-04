/* global EnemyAI */
import { test, expect } from '@playwright/test';

test.describe('Pioneer cinematic engine and combat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/exoplanet-pioneer.html', { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => window.game?.cinematicRenderer && window.game?.planetMesh);
  });

  test('scenery fits the camera and retires world effects without touching terrain', async ({ page }) => {
    const result = await page.evaluate(() => {
      const game=window.game, environment=game.cinematicRenderer;
      const geometry=game.planetMesh.geometry;
      const high=environment.getDiagnostics();
      environment.setQuality('low');
      const low=environment.getDiagnostics();
      environment.attachWorld(null);
      const cleared=environment.lastPlanet===null&&!environment.aurora&&!environment.rings;
      environment.attachWorld(game.planetMesh);
      environment.setQuality('high');
      game.renderer.compile(game.scene,game.camera);
      return {high,low,far:game.camera.far,cleared,terrainKept:geometry===game.planetMesh.geometry,gl:game.renderer.getContext().getError()};
    });
    expect(result.high.skyRadius).toBeLessThan(result.far);
    expect(result.high.starCount).toBeGreaterThan(result.low.starCount);
    expect(result.cleared).toBe(true);
    expect(result.terrainKept).toBe(true);
    expect(result.gl).toBe(0);
  });

  test('enemy attack vectors hit their forward cone and fire cadence is independent of display rate', async ({ page }) => {
    const result=await page.evaluate(async()=>{
      await window.game.ensureCombatScene();
      const measure=(fps,archetype)=>{
        const directions=[];
        const scene={projectileSystem:{fire:(_p,direction)=>directions.push(direction.clone())}};
        const enemy=new EnemyAI(scene,{x:0,y:0,z:0},{archetype,speed:0});
        const player={mesh:new THREE.Object3D(),maxSpeed:52};player.mesh.position.z=-100;
        enemy.state='attack';enemy.stateTimer=10;
        for(let i=0;i<fps*5;i++)enemy.update(1/fps,player);
        const result={count:directions.length,minAlignment:Math.min(...directions.map(d=>d.dot(new THREE.Vector3(0,0,-1))))};
        const geometries=new Set(),materials=new Set();
        enemy.mesh.traverse(child=>{if(child.geometry)geometries.add(child.geometry);if(child.material)materials.add(child.material);});
        geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
        return result;
      };
      return {slow:measure(30,'fighter'),fast:measure(120,'fighter'),scout:measure(60,'scout'),ace:measure(60,'ace')};
    });
    expect(result.slow.count).toBeGreaterThan(0);
    expect(Math.abs(result.slow.count-result.fast.count)).toBeLessThanOrEqual(1);
    expect(result.slow.minAlignment).toBeGreaterThan(.975);
    expect(result.ace.count).toBeGreaterThan(result.scout.count);
  });

  test('explosions reuse one bounded GPU pool and compile without errors', async ({ page }) => {
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    const result=await page.evaluate(async()=>{
      await window.game.launchFighters([]);
      const combat=window.game.combatScene;
      const children=combat.scene.children.length;
      for(let i=0;i<100;i++)combat.createExplosion(new THREE.Vector3(i%10,0,-40),1.5);
      combat.visualEffects.update(.016);
      combat.renderer.compile(combat.scene,combat.camera);
      combat.renderer.render(combat.scene,combat.camera);
      const after=combat.scene.children.length;
      const diagnostics=combat.visualEffects.getDiagnostics();
      combat.visualEffects.reset();
      return {children,after,diagnostics,expired:Array.from(combat.visualEffects.attributes.birth.array).every(v=>v<0),gl:combat.renderer.getContext().getError()};
    });
    expect(result.after).toBe(result.children);
    expect(result.diagnostics.capacity).toBe(2048);
    expect(result.diagnostics.drawCalls).toBe(1);
    expect(result.diagnostics.explosions).toBe(100);
    expect(result.expired).toBe(true);
    expect(result.gl).toBe(0);
    expect(errors).toEqual([]);
    await page.evaluate(()=>window.game.retreatFromCombat());
  });
});
