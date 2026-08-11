(() => {
'use strict';

class PioneerRayTracingRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.vao = null;
        this.mode = 'standard';
        this.renderScale = 0.65;
        this.maxSamples = 64;
        this.sampleIndex = 0;
        this.lastSignature = '';
        this.supported = null;
        this.failureReason = '';
        this.uniforms = {};
        this._sceneBackground = undefined;
        this._clearColor = null;
        this._clearAlpha = 1;
        this._planetMaterial = null;
        this._planetMaterialState = null;
    }

    getCapability() {
        if (this.supported !== null) return { supported: this.supported, reason: this.failureReason };
        try {
            const probe = document.createElement('canvas');
            const gl = probe.getContext('webgl2', { alpha: true, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
            this.supported = !!gl;
            this.failureReason = gl ? '' : 'WebGL2 is unavailable in this browser/GPU configuration.';
            gl?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
        } catch (error) {
            this.supported = false;
            this.failureReason = error?.message || 'Unable to initialize WebGL2.';
        }
        return { supported: this.supported, reason: this.failureReason };
    }

    isActive() { return this.mode === 'raytraced' || this.mode === 'pathtraced'; }
    isPathTracing() { return this.mode === 'pathtraced'; }

    setQuality({ renderScale, maxSamples } = {}) {
        const scale = Number(renderScale);
        if (Number.isFinite(scale)) this.renderScale = Math.max(0.35, Math.min(1, scale));
        const samples = Number(maxSamples);
        if (Number.isFinite(samples)) this.maxSamples = Math.max(8, Math.min(512, Math.round(samples)));
        this.resize(true);
        this.resetAccumulation();
    }

    setMode(nextMode, options = {}) {
        const normalized = ['standard', 'raytraced', 'pathtraced'].includes(nextMode) ? nextMode : 'standard';
        this.setQuality(options);
        if (normalized !== 'standard' && (!this.getCapability().supported || !this.ensureInitialized())) {
            this.mode = 'standard';
            this.restoreCompositeState();
            return { ok: false, mode: 'standard', reason: this.failureReason || 'Experimental renderer unavailable.' };
        }
        this.mode = normalized;
        if (this.isActive()) this.applyCompositeState();
        else this.restoreCompositeState();
        this.resetAccumulation();
        return { ok: true, mode: this.mode, reason: '' };
    }

    ensureInitialized() {
        if (this.gl && this.program && this.canvas) return true;
        if (!this.getCapability().supported) return false;
        try {
            const canvas = document.createElement('canvas');
            canvas.id = 'ep-raytracing-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:0';
            const gl = canvas.getContext('webgl2', {
                alpha: true, antialias: false, depth: false, stencil: false,
                premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'
            });
            if (!gl) throw new Error('WebGL2 context creation failed.');

            const vs = `#version 300 es
precision highp float;
const vec2 P[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
void main(){gl_Position=vec4(P[gl_VertexID],0.,1.);}`;

            const fs = `#version 300 es
precision highp float; precision highp int;
out vec4 outColor;
uniform vec2 uResolution;
uniform vec3 uCameraPos,uCameraForward,uCameraRight,uCameraUp;
uniform float uTanHalfFov,uAspect;
uniform vec3 uPlanetCenter; uniform mat3 uWorldToPlanet;
uniform float uPlanetRadius,uSeed,uRelief,uWater,uIce,uAtmosphere,uTemperature;
uniform vec3 uSunDirection,uWaterColor,uSandColor,uLowlandColor,uRockColor,uSnowColor;
uniform int uMode; uniform float uSampleIndex;
const float PI=3.141592653589793;
float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h31(i),b=h31(i+vec3(1,0,0)),c=h31(i+vec3(0,1,0)),d=h31(i+vec3(1,1,0)),e=h31(i+vec3(0,0,1)),g=h31(i+vec3(1,0,1)),h=h31(i+vec3(0,1,1)),j=h31(i+vec3(1,1,1));return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,j,f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=(n3(p)*2.-1.)*a;p=p*2.03+vec3(7.7,-4.3,11.1);a*=.49;}return v;}
float ridge(vec3 p){float v=0.,a=.58,w=0.;for(int i=0;i<4;i++){float n=1.-abs(n3(p)*2.-1.);n*=n;v+=n*a;w+=a;p=p*2.13+vec3(-3.8,9.4,5.1);a*=.48;}return v/max(w,.0001);}
vec3 seededDir(float i,float s){float u=h11(uSeed*.013+i*17.17+s),v=h11(uSeed*.021+i*29.31+s*1.7),y=u*2.-1.,a=v*PI*2.,r=sqrt(max(0.,1.-y*y));return vec3(cos(a)*r,y,sin(a)*r);}
float craters(vec3 n){float f=0.;for(int i=0;i<6;i++){vec3 c=seededDir(float(i),2.7);float r=.055+h11(uSeed+float(i)*9.1)*.09;float q=sqrt(max(0.,2.-2.*clamp(dot(n,c),-1.,1.)))/r;if(q<1.){float b=1.-q*q;f-=b*b*.10;}if(q<1.34)f+=.035*exp(-pow((q-1.04)/.13,2.));}return f;}
float surfH(vec3 n){vec3 w=normalize(n+vec3(fbm(n*1.7+4.1),fbm(n*1.7-9.3),fbm(n*1.7+15.8))*.055);float macro=fbm(w*1.15+uSeed*.0009),r=ridge(w*4.1+uSeed*.0017),detail=fbm(w*18.-uSeed*.0023),land=smoothstep(.49,.78,r+macro*.12);float h=mix(-.34,.92*land*land,land)+detail*.055+craters(n);return clamp(h*uRelief,-.46,1.28);}
float mapS(vec3 p){vec3 l=uWorldToPlanet*(p-uPlanetCenter);float r=length(l);return r-(uPlanetRadius+surfH(l/max(r,.0001)));}
bool traceS(vec3 ro,vec3 rd,out vec3 hp){float t=max(0.,length(ro-uPlanetCenter)-uPlanetRadius-2.5);for(int i=0;i<72;i++){hp=ro+rd*t;float d=mapS(hp);if(abs(d)<.018)return true;t+=clamp(d*.72,.018,3.8);if(t>900.)break;}return false;}
vec3 normalS(vec3 p){float e=.045;vec2 h=vec2(e,0);return normalize(vec3(mapS(p+h.xyy)-mapS(p-h.xyy),mapS(p+h.yxy)-mapS(p-h.yxy),mapS(p+h.yyx)-mapS(p-h.yyx)));}
float shadowS(vec3 p,vec3 l){float t=.10,v=1.;for(int i=0;i<18;i++){float h=mapS(p+l*t);if(h<.008)return .20;v=min(v,9.*h/max(t,.05));t+=clamp(h,.08,2.8);if(t>34.)break;}return clamp(v,.20,1.);}
float aoS(vec3 p,vec3 n){float o=0.,w=1.;for(int i=1;i<=4;i++){float d=float(i)*.16;o+=(d-mapS(p+n*d))*w;w*=.58;}return clamp(1.-o*.70,.46,1.);}
vec3 stars(vec3 d){vec3 c=mix(vec3(.001,.004,.016),vec3(.005,.013,.034),pow(max(d.y*.5+.5,0.),1.5));vec3 cell=floor(d*620.);float s=step(.9978,h31(cell)),b=step(.99955,h31(cell+17.3));return c+vec3(.62,.75,1.)*s*.60+vec3(1.,.86,.64)*b*1.35;}
vec3 sky(vec3 d){vec3 c=stars(d);float sun=smoothstep(.99982,.99996,dot(normalize(d),normalize(uSunDirection)));return c+vec3(1.,.73,.38)*sun*2.4;}
vec3 randUnit(vec2 s){float z=h21(s)*2.-1.,a=h21(s+vec2(11.7,37.1))*PI*2.,r=sqrt(max(0.,1.-z*z));return vec3(r*cos(a),r*sin(a),z);}
vec3 shade(vec3 p,vec3 rd,vec2 ps){vec3 N=normalS(p),lp=uWorldToPlanet*(p-uPlanetCenter),sn=normalize(lp),sphereN=normalize(transpose(uWorldToPlanet)*sn);float h=length(lp)-uPlanetRadius,micro=fbm(sn*47.+uSeed*.0031),mineral=ridge(sn*22.-uSeed*.0047),slope=clamp(1.-dot(N,sphereN),0.,.55)/.55,basin=1.-smoothstep(-.12,.12,h),water=basin*smoothstep(.11,.38,uWater),coast=smoothstep(-.10,.02,h)*(1.-smoothstep(.02,.14,h)),sed=smoothstep(-.18,.10,h)*(1.-water),rock=max(smoothstep(.42,.78,h+mineral*.12),slope*.82),snow=smoothstep(mix(.98,.24,uIce),mix(.98,.24,uIce)+.20,h+micro*.05);vec3 alb=mix(uRockColor*.58,uSandColor*.84,.58+micro*.14);alb=mix(alb,uWaterColor*(.78+micro*.05),water);alb=mix(alb,uSandColor*(.92+micro*.08),sed);alb=mix(alb,uLowlandColor*(.90+micro*.10),smoothstep(.04,.30,h));alb=mix(alb,uRockColor*(.80+mineral*.16),rock);alb=mix(alb,uSnowColor,snow*(.25+uIce*.75));alb=mix(alb,uSandColor*1.08,coast*.30);alb=mix(alb,alb*vec3(1.12,.78,.58),smoothstep(350.,850.,uTemperature)*.28);vec3 L=normalize(uSunDirection);if(uMode==2)L=normalize(L+randUnit(ps+vec2(uSampleIndex*.17,uSampleIndex*.37))*.0065);vec3 V=normalize(-rd);float ndl=max(dot(N,L),0.),sh=ndl>0.?shadowS(p+N*.06,L):0.,ao=aoS(p,N),rough=mix(.79-micro*.06,.09,water);rough=mix(rough,.24,snow*uIce);vec3 H=normalize(L+V);float spec=pow(max(dot(N,H),0.),mix(24.,150.,1.-rough))*mix(.08,1.25,water),fr=pow(1.-max(dot(N,V),0.),5.);vec3 bounce=uMode==2?sky(normalize(N+randUnit(ps+vec2(91.,uSampleIndex*1.13))))*alb*.34:vec3(.035,.055,.085)*alb;vec3 col=alb*(.07+ndl*sh*.93)*ao+vec3(1.,.78,.52)*spec*sh+bounce;col=mix(col,sky(reflect(-V,N)),fr*mix(.04,.68,water));col+=vec3(.20,.45,.88)*pow(1.-max(dot(N,V),0.),3.6)*clamp(uAtmosphere,0.,1.45)*.16;return max(col,vec3(0));}
void main(){vec2 px=gl_FragCoord.xy,j=vec2(0);if(uMode==2)j=vec2(h21(px+vec2(uSampleIndex,13.1)),h21(px.yx+vec2(7.7,uSampleIndex)))-.5;vec2 ndc=((px+j)/uResolution)*2.-1.;ndc.x*=uAspect;vec3 rd=normalize(uCameraForward+uCameraRight*ndc.x*uTanHalfFov+uCameraUp*ndc.y*uTanHalfFov),hp,col;if(traceS(uCameraPos,rd,hp))col=shade(hp,rd,px+vec2(uSeed,uSampleIndex));else col=sky(rd);col=col/(col+vec3(1));col=pow(col,vec3(1./2.2));outColor=vec4(col,1);}`;

            this.canvas = canvas;
            this.gl = gl;
            this.program = this.createProgram(gl, vs, fs);
            this.vao = gl.createVertexArray();
            gl.bindVertexArray(this.vao);
            this.cacheUniforms();
            const container = this.game?.container;
            const mainCanvas = this.game?.renderer?.domElement;
            if (!container || !mainCanvas) throw new Error('Pioneer render surface is not ready.');
            container.insertBefore(canvas, mainCanvas);
            this.resize(true);
            return true;
        } catch (error) {
            this.failureReason = error?.message || String(error);
            this.supported = false;
            console.warn('Experimental ray/path renderer unavailable:', error);
            this.disposeContextOnly();
            return false;
        }
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader) || 'Shader compile failure';
            gl.deleteShader(shader);
            throw new Error(info);
        }
        return shader;
    }

    createProgram(gl, vsSource, fsSource) {
        const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const program = gl.createProgram();
        gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program) || 'Program link failure';
            gl.deleteProgram(program); throw new Error(info);
        }
        return program;
    }

    cacheUniforms() {
        const names = ['uResolution','uCameraPos','uCameraForward','uCameraRight','uCameraUp','uTanHalfFov','uAspect','uPlanetCenter','uWorldToPlanet','uPlanetRadius','uSeed','uRelief','uWater','uIce','uAtmosphere','uTemperature','uSunDirection','uWaterColor','uSandColor','uLowlandColor','uRockColor','uSnowColor','uMode','uSampleIndex'];
        names.forEach(name => { this.uniforms[name] = this.gl.getUniformLocation(this.program, name); });
    }

    resize(force = false) {
        if (!this.canvas || !this.gl || !this.game?.container) return;
        const w = Math.max(1, this.game.container.clientWidth || innerWidth || 1);
        const h = Math.max(1, this.game.container.clientHeight || innerHeight || 1);
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        const tw = Math.max(1, Math.round(w * dpr * this.renderScale));
        const th = Math.max(1, Math.round(h * dpr * this.renderScale));
        if (!force && this.canvas.width === tw && this.canvas.height === th) return;
        this.canvas.width = tw; this.canvas.height = th;
        this.gl.viewport(0, 0, tw, th);
        this.resetAccumulation();
    }

    applyCompositeState() {
        if (!this.ensureInitialized()) return;
        const game = this.game, main = game?.renderer?.domElement, container = game?.container;
        if (!main || !container) return;
        if (this._sceneBackground === undefined) {
            this._sceneBackground = game.scene?.background?.clone?.() || game.scene?.background || null;
            this._clearColor = new THREE.Color();
            game.renderer.getClearColor(this._clearColor);
            this._clearAlpha = game.renderer.getClearAlpha();
        }
        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
        main.style.position = 'relative'; main.style.zIndex = '1'; main.style.background = 'transparent';
        this.canvas.style.display = 'block';
        game.scene.background = null;
        game.renderer.setClearColor(0x000000, 0);
        this.syncHiddenPlanetMaterial();
    }

    syncHiddenPlanetMaterial() {
        const material = this.game?.planetMesh?.material;
        if (!this.isActive() || !material || this._planetMaterial === material) return;
        this.restoreHiddenPlanetMaterial();
        this._planetMaterial = material;
        this._planetMaterialState = { colorWrite: material.colorWrite, depthWrite: material.depthWrite, depthTest: material.depthTest };
        material.colorWrite = false; material.depthWrite = true; material.depthTest = true; material.needsUpdate = true;
    }

    restoreHiddenPlanetMaterial() {
        if (!this._planetMaterial || !this._planetMaterialState) return;
        Object.assign(this._planetMaterial, this._planetMaterialState);
        this._planetMaterial.needsUpdate = true;
        this._planetMaterial = null; this._planetMaterialState = null;
    }

    restoreCompositeState() {
        this.restoreHiddenPlanetMaterial();
        if (this.canvas) this.canvas.style.display = 'none';
        if (this.game?.scene && this._sceneBackground !== undefined) this.game.scene.background = this._sceneBackground;
        if (this.game?.renderer && this._clearColor) this.game.renderer.setClearColor(this._clearColor, this._clearAlpha);
        this._sceneBackground = undefined; this._clearColor = null;
    }

    palette() {
        const p = this.game?.planetMesh?.userData?.terrain?.physicalProfile || {};
        const type = String(p.worldType || this.game?.currentWorldType || 'planet').toLowerCase();
        if (type === 'moon') return { water:[.15,.16,.18],sand:[.31,.32,.34],low:[.43,.44,.46],rock:[.55,.55,.56],snow:[.78,.80,.82] };
        if (type === 'ice' || type === 'frozen') return { water:[.025,.18,.30],sand:[.42,.57,.65],low:[.38,.58,.70],rock:[.30,.39,.46],snow:[.88,.95,1] };
        if (type === 'lava' || type === 'volcanic' || Number(p.estimatedSurfaceTemperatureK||0)>850) return { water:[.28,.035,.01],sand:[.46,.15,.045],low:[.22,.09,.045],rock:[.12,.09,.08],snow:[1,.42,.08] };
        return { water:[.025,.31,.49],sand:[.70,.60,.43],low:[.35,.43,.34],rock:[.39,.38,.36],snow:[.90,.94,.97] };
    }

    signature() {
        const g=this.game,c=g?.camera,p=g?.planetMesh,s=p?.userData?.uniforms?.sunDirection?.value;
        if(!c||!p)return 'missing';
        const r=(v,n=3)=>Number(v||0).toFixed(n), q=c.quaternion, pos=c.position, sun=s||{x:1,y:0,z:0};
        const rot=this.isPathTracing()?[0,0,0]:[p.rotation.x,p.rotation.y,p.rotation.z];
        return [this.canvas?.width,this.canvas?.height,this.mode,r(pos.x),r(pos.y),r(pos.z),r(q.x,4),r(q.y,4),r(q.z,4),r(q.w,4),r(rot[0],4),r(rot[1],4),r(rot[2],4),r(sun.x,4),r(sun.y,4),r(sun.z,4),g.currentWorldSeed,g.currentWorldType].join('|');
    }

    resetAccumulation() {
        this.sampleIndex=0; this.lastSignature='';
        if(this.gl){this.gl.disable(this.gl.BLEND);this.gl.clearColor(0,0,0,1);this.gl.clear(this.gl.COLOR_BUFFER_BIT);}
        this.updateStatusUI();
    }

    updateStatusUI() {
        const el=document.getElementById('ep-raytrace-status'); if(!el)return;
        if(!this.isActive()){el.textContent='Standard rasterized renderer active.';el.style.color='#94a3b8';return;}
        el.style.color='#67e8f9';
        el.textContent=this.isPathTracing()?`Path-traced photo accumulation: ${Math.min(this.sampleIndex,this.maxSamples)}/${this.maxSamples} samples${this.game?.timeScale===0?'':' Â· pause simulation for convergence'}`:`Ray-traced lighting active at ${Math.round(this.renderScale*100)}% internal resolution.`;
    }

    render() {
        if(!this.isActive()||!this.ensureInitialized())return false;
        this.applyCompositeState(); this.syncHiddenPlanetMaterial(); this.resize(false);
        const g=this.game,c=g?.camera,p=g?.planetMesh; if(!c||!p)return false;
        const sig=this.signature();
        if(sig!==this.lastSignature){this.sampleIndex=0;this.lastSignature=sig;this.gl.disable(this.gl.BLEND);this.gl.clearColor(0,0,0,1);this.gl.clear(this.gl.COLOR_BUFFER_BIT);}
        if(this.isPathTracing()&&this.sampleIndex>=this.maxSamples){this.updateStatusUI();return true;}
        const gl=this.gl; gl.useProgram(this.program); gl.bindVertexArray(this.vao);
        const f=new THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion).normalize(),r=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion).normalize(),up=new THREE.Vector3(0,1,0).applyQuaternion(c.quaternion).normalize(),center=new THREE.Vector3();p.getWorldPosition(center);p.updateMatrixWorld(true);
        const inv=new THREE.Matrix4().copy(p.matrixWorld); if(typeof inv.invert==='function')inv.invert();else inv.getInverse(p.matrixWorld); const m3=new THREE.Matrix3().setFromMatrix4(inv);
        const prof=p.userData?.terrain?.physicalProfile||{}, uni=p.userData?.uniforms||{}, sun=uni.sunDirection?.value||new THREE.Vector3(1,0,0), pal=this.palette();
        gl.uniform2f(this.uniforms.uResolution,this.canvas.width,this.canvas.height);gl.uniform3f(this.uniforms.uCameraPos,c.position.x,c.position.y,c.position.z);gl.uniform3f(this.uniforms.uCameraForward,f.x,f.y,f.z);gl.uniform3f(this.uniforms.uCameraRight,r.x,r.y,r.z);gl.uniform3f(this.uniforms.uCameraUp,up.x,up.y,up.z);gl.uniform1f(this.uniforms.uTanHalfFov,Math.tan(THREE.MathUtils.degToRad(c.fov*.5)));gl.uniform1f(this.uniforms.uAspect,c.aspect||this.canvas.width/this.canvas.height);gl.uniform3f(this.uniforms.uPlanetCenter,center.x,center.y,center.z);gl.uniformMatrix3fv(this.uniforms.uWorldToPlanet,false,m3.elements);gl.uniform1f(this.uniforms.uPlanetRadius,50);gl.uniform1f(this.uniforms.uSeed,Number(g.currentWorldSeed||12345));gl.uniform1f(this.uniforms.uRelief,Number(prof.reliefScale||1));gl.uniform1f(this.uniforms.uWater,Number(prof.waterPotential||0));gl.uniform1f(this.uniforms.uIce,Number(prof.icePotential||0));gl.uniform1f(this.uniforms.uAtmosphere,Number(prof.atmosphereRetention||0));gl.uniform1f(this.uniforms.uTemperature,Number(prof.estimatedSurfaceTemperatureK||280));gl.uniform3f(this.uniforms.uSunDirection,sun.x,sun.y,sun.z);gl.uniform3fv(this.uniforms.uWaterColor,pal.water);gl.uniform3fv(this.uniforms.uSandColor,pal.sand);gl.uniform3fv(this.uniforms.uLowlandColor,pal.low);gl.uniform3fv(this.uniforms.uRockColor,pal.rock);gl.uniform3fv(this.uniforms.uSnowColor,pal.snow);gl.uniform1i(this.uniforms.uMode,this.isPathTracing()?2:1);gl.uniform1f(this.uniforms.uSampleIndex,this.sampleIndex);
        if(this.isPathTracing()&&this.sampleIndex>0){const w=1/(this.sampleIndex+1);gl.enable(gl.BLEND);gl.blendColor(0,0,0,w);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);}else gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES,0,3);gl.disable(gl.BLEND);this.sampleIndex++;this.updateStatusUI();return true;
    }

    disposeContextOnly(){if(this.gl){if(this.program)this.gl.deleteProgram(this.program);if(this.vao)this.gl.deleteVertexArray(this.vao);this.gl.getExtension?.('WEBGL_lose_context')?.loseContext?.();}this.canvas?.remove?.();this.canvas=null;this.gl=null;this.program=null;this.vao=null;this.uniforms={};}
    dispose(){this.mode='standard';this.restoreCompositeState();this.disposeContextOnly();}
}

window.PioneerRayTracingRenderer=PioneerRayTracingRenderer;
})();
