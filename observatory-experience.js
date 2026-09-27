/* Shared visual language. Decorative SVG/CSS only; no additional WebGL contexts,
 * animation loops, dependency bundles or fabricated scientific telemetry. */
(() => {
  'use strict';
  if(window.__observatoryExperienceLoaded)return;
  window.__observatoryExperienceLoaded=true;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let savedPause=false;
  try {savedPause=localStorage.getItem('ita-motion-paused')==='true';} catch { /* Private storage is optional. */ }
  window.__itaMotionPaused=savedPause;
  const apply=()=>{
    document.documentElement.dataset.motionPaused=String(savedPause || media.matches);
    document.documentElement.dataset.motionSystemReduced=String(media.matches);
    const button=document.getElementById('observatory-motion');
    if(button){button.textContent=media.matches ? 'Reduced motion' : savedPause ? 'Resume motion' : 'Pause motion';button.setAttribute('aria-pressed',String(savedPause || media.matches));button.disabled=media.matches;button.title=media.matches ? 'Reduced motion is enabled in your system settings.' : 'Pause decorative motion and automatic planet rotation';}
    window.__itaMotionPaused=savedPause;
    window.dispatchEvent(new CustomEvent('ita:motion-preference',{detail:{paused:savedPause || media.matches,userPaused:savedPause}}));
  };
  apply();media.addEventListener?.('change',apply);
  window.addEventListener('storage',event=>{if(event.key==='ita-motion-paused'){savedPause=event.newValue==='true';apply();}});
  const svg=(className,contents,viewBox='0 0 1000 1000')=>{
    const image=document.createElementNS('http://www.w3.org/2000/svg','svg');image.setAttribute('viewBox',viewBox);image.setAttribute('aria-hidden','true');image.setAttribute('focusable','false');image.classList.add(className);image.innerHTML=contents;return image;
  };
  const craft='<path d="M-12 0L-26 23H-21L-9 12H9L21 23H26L12 0Z"/><ellipse cy="-2" rx="19" ry="10"/><path d="M-26 5V29M26 5V29M-4 8V26H4V8"/><path class="observatory-engine-light" d="M-26 26V34M26 26V34"/>';
  function boot(){
    document.body.classList.add('observatory-experience');
    const button=document.createElement('button');button.type='button';button.id='observatory-motion';button.className='observatory-motion';button.addEventListener('click',()=>{savedPause=!savedPause;try{localStorage.setItem('ita-motion-paused',String(savedPause));}catch{}apply();});document.body.append(button);apply();
    const stage=document.querySelector('.hero-stage .stage-frame');
    if(stage){
      const image=svg('observatory-orbital-frame',`<g class="observatory-orbit-guides"><ellipse cx="500" cy="510" rx="370" ry="190" transform="rotate(-26 500 510)"/><ellipse cx="500" cy="510" rx="414" ry="278" transform="rotate(31 500 510)"/><path d="M65 310V190H185M815 190H935V310M65 720V835H185M815 835H935V720"/><path d="M480 94H520M500 74V114M480 925H520M500 905V945"/></g><g class="observatory-radial-ticks" transform="translate(500 510)">${Array.from({length:48},(_,i)=>`<path d="M0 -415V-${i%4===0?430:421}" transform="rotate(${i*7.5})"/>`).join('')}</g><g class="observatory-craft observatory-craft-a"><g transform="translate(740 230) rotate(38)">${craft}</g></g><g class="observatory-craft observatory-craft-b"><g transform="translate(230 735) rotate(-122) scale(.65)">${craft}</g></g><g class="observatory-orbit-signal"><circle cx="500" cy="510" r="362" stroke-dasharray="18 2255"/></g>`);
      stage.append(image);stage.dataset.observatoryScene='svg-orbital';
      const label=document.createElement('span');label.className='observatory-scene-label';label.textContent='ILLUSTRATIVE NAVIGATION FIELD';stage.append(label);
    }
    for(const header of document.querySelectorAll('.page-header, .section-header')){
      if(header.closest('.hero') || header.querySelector('.observatory-header-trace'))continue;
      const image=svg('observatory-header-trace','<path d="M4 46V24Q4 4 24 4H144M152 4H240M252 4H316M328 4H348"/><path d="M4 46H54M62 46H104"/><circle cx="364" cy="4" r="3"/>','0 0 380 58');header.append(image);
    }
    const animated=[...document.querySelectorAll('.observatory-orbital-frame, .observatory-header-trace')];
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.dataset.offscreen=String(!entry.isIntersecting);},{rootMargin:'80px'});animated.forEach(el=>observer.observe(el));window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});}
    const visibility=()=>{document.documentElement.dataset.motionHidden=String(document.hidden);};document.addEventListener('visibilitychange',visibility);visibility();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
