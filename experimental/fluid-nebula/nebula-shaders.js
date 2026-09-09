export const vertex=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const header=`#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 vUv;out vec4 colour;uniform vec2 uTexel;
`;
const noise=`
uniform sampler3D uNoise;
float field(vec3 p){return texture(uNoise,p*.023).r*.54+texture(uNoise,p*.051+3.1).r*.28+texture(uNoise,p*.113+7.3).r*.12+texture(uNoise,p*.247+11.7).r*.06;}
`;
export const shaders={
  copy:header+`uniform sampler2D uSource;void main(){colour=texture(uSource,vUv);}`,
  initialize:header+noise+`uniform float uSeed,uVelocityMode,uAspect;
    void main(){
      vec2 p=(vUv-.5)*vec2(uAspect,1.0);
      float cloud=field(vec3(p*8.0,uSeed*.001));
      float ridges=1.0-abs(field(vec3(p*25.0,uSeed*.003))*2.0-1.0);
      float envelope=exp(-dot(p*vec2(.95,1.45),p*vec2(.95,1.45))*3.5);
      float density=smoothstep(.32,.7,cloud)*envelope*(.35+ridges*.8);
      if(uVelocityMode>.5){
        vec2 v=vec2(-p.y,p.x)*.14*exp(-dot(p,p)*1.7);
        v+=vec2(sin(p.y*7.0),cos(p.x*5.0))*.013;
        colour=vec4(v,0,1);
      }else{
        float ionization=clamp(envelope*.55+cloud*.5,0.0,1.0);
        vec3 emissions=vec3(.55+cloud*.7,.08+ionization*1.2,.08+(1.0-ionization)*.9);
        colour=vec4(emissions*density,density);
      }
    }`,
  advect:header+`uniform sampler2D uVelocity,uSource;uniform float uDt,uDecay;
    void main(){vec2 departure=vUv-uDt*texture(uVelocity,vUv).xy;colour=texture(uSource,clamp(departure,uTexel*.5,1.0-uTexel*.5))*exp(-uDecay*abs(uDt));}`,
  correct:header+`uniform sampler2D uVelocity,uSource,uOriginal,uBackward;uniform float uDt,uDecay;
    void main(){
      vec2 departure=vUv-uDt*texture(uVelocity,vUv).xy;
      vec2 p=(floor(departure/uTexel-.5)+.5)*uTexel;
      vec4 a=texture(uOriginal,p),b=texture(uOriginal,p+vec2(uTexel.x,0)),c=texture(uOriginal,p+vec2(0,uTexel.y)),d=texture(uOriginal,p+uTexel);
      vec4 lo=min(min(a,b),min(c,d)),hi=max(max(a,b),max(c,d));
      vec4 corrected=texture(uSource,vUv)+.5*(texture(uOriginal,vUv)-texture(uBackward,vUv));
      colour=clamp(corrected,lo,hi)*exp(-uDecay*uDt);
    }`,
  curl:header+`uniform sampler2D uVelocity;
    void main(){float l=texture(uVelocity,vUv-vec2(uTexel.x,0)).y,r=texture(uVelocity,vUv+vec2(uTexel.x,0)).y;
      float b=texture(uVelocity,vUv-vec2(0,uTexel.y)).x,t=texture(uVelocity,vUv+vec2(0,uTexel.y)).x;
      colour=vec4((r-l)/(2.0*uTexel.x)-(t-b)/(2.0*uTexel.y),0,0,1);}`,
  forces:header+`uniform sampler2D uVelocity,uCurl,uDye;uniform float uDt,uTurbulence;
    void main(){
      float l=abs(texture(uCurl,vUv-vec2(uTexel.x,0)).r),r=abs(texture(uCurl,vUv+vec2(uTexel.x,0)).r);
      float b=abs(texture(uCurl,vUv-vec2(0,uTexel.y)).r),t=abs(texture(uCurl,vUv+vec2(0,uTexel.y)).r),c=texture(uCurl,vUv).r;
      vec2 gradient=vec2(r-l,t-b);gradient/=length(gradient)+.00001;
      vec2 force=vec2(gradient.y,-gradient.x)*c*uTurbulence*min(uTexel.x,uTexel.y);
      vec2 velocity=texture(uVelocity,vUv).xy+force*uDt;
      velocity*=exp(-uDt*.006);
      if(vUv.x<uTexel.x||vUv.x>1.0-uTexel.x)velocity.x=0.0;
      if(vUv.y<uTexel.y||vUv.y>1.0-uTexel.y)velocity.y=0.0;
      colour=vec4(velocity,0,1);
    }`,
  divergence:header+`uniform sampler2D uVelocity;
    void main(){vec2 l=texture(uVelocity,vUv-vec2(uTexel.x,0)).xy,r=texture(uVelocity,vUv+vec2(uTexel.x,0)).xy;
      vec2 b=texture(uVelocity,vUv-vec2(0,uTexel.y)).xy,t=texture(uVelocity,vUv+vec2(0,uTexel.y)).xy;
      colour=vec4((r.x-l.x)/(2.0*uTexel.x)+(t.y-b.y)/(2.0*uTexel.y),0,0,1);}`,
  pressure:header+`uniform sampler2D uPressure,uDivergence;
    void main(){float l=texture(uPressure,vUv-vec2(uTexel.x,0)).r,r=texture(uPressure,vUv+vec2(uTexel.x,0)).r;
      float b=texture(uPressure,vUv-vec2(0,uTexel.y)).r,t=texture(uPressure,vUv+vec2(0,uTexel.y)).r;
      vec2 h=uTexel*uTexel;float p=((l+r)*h.y+(b+t)*h.x-texture(uDivergence,vUv).r*h.x*h.y)/(2.0*(h.x+h.y));colour=vec4(p,0,0,1);}`,
  project:header+`uniform sampler2D uVelocity,uPressure;
    void main(){float l=texture(uPressure,vUv-vec2(uTexel.x,0)).r,r=texture(uPressure,vUv+vec2(uTexel.x,0)).r;
      float b=texture(uPressure,vUv-vec2(0,uTexel.y)).r,t=texture(uPressure,vUv+vec2(0,uTexel.y)).r;
      vec2 v=texture(uVelocity,vUv).xy-vec2(r-l,t-b)/(2.0*uTexel);
      colour=vec4(v,0,1);}`,
  splat:header+`uniform sampler2D uSource;uniform vec2 uPoint,uImpulse;uniform float uRadius,uDyeMode,uAspect;
    void main(){vec2 p=(vUv-uPoint)*vec2(uAspect,1.0);float g=exp(-dot(p,p)/uRadius);vec4 base=texture(uSource,vUv);
      colour=uDyeMode>.5?base+vec4(.8,.35,.5,1.0)*g*.18:base+vec4(uImpulse*g,0,0);}`,
  render:header+noise+`uniform sampler2D uDye;uniform float uTime,uAspect,uExposure,uDensity,uSteps,uPalette,uSeed;
    float mass(vec3 p){vec2 uv=p.xy/vec2(uAspect,1.0)*.5+.5;if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return 0.0;
      float edge=smoothstep(0.0,.15,min(uv.x,1.0-uv.x))*smoothstep(0.0,.15,min(uv.y,1.0-uv.y));
      float base=texture(uDye,uv).a;float depth=exp(-p.z*p.z*2.0);float volume=field(p*8.0+vec3(0,0,uTime*.035));return base*depth*smoothstep(.19,.72,volume)*uDensity*edge;}
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    vec3 stars(vec2 uv){vec2 grid=uv*vec2(350.0*uAspect,350.0);vec2 cell=floor(grid),p=fract(grid)-.5;float random=hash(cell+uSeed);
      float star=step(.997,random)*exp(-dot(p,p)*150.0)*(.3+pow(random,20.0));return vec3(1.0,.91,.81)*star;}
    vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
    void main(){
      vec2 xy=(vUv-.5)*vec2(uAspect,1.0)*2.5;float stepSize=2.0/uSteps;vec3 T=vec3(1),total=vec3(0);
      vec3 lightPosition=vec3(-.18,.12,.3);
      for(int i=0;i<48;i++){
        if(float(i)>=uSteps)break;
        vec3 p=vec3(xy,1.0-(float(i)+.5)*stepSize);
        vec2 uv=p.xy/vec2(uAspect,1.0)*.5+.5;
        vec4 bands=texture(uDye,uv);float density=mass(p);
        float dustFraction=pow(smoothstep(.42,.65,field(p*9.0+7.0)),2.0);
        float dust=dustFraction*density;
        vec3 direction=lightPosition-p;float distance=length(direction);direction/=max(distance,.001);
        float shadow=0.0;for(int j=1;j<=4;j++)shadow+=mass(p+direction*(float(j)*.11))*.25;
        vec3 emission=uPalette<.5?vec3(bands.r+bands.b*.3,bands.g*.6,bands.g*.85):vec3(bands.b*1.2,bands.r*.6,bands.g*1.1);
        emission/=max(bands.a,.02);
        vec3 illumination=vec3(.09,.15,.26)+vec3(1.0,.77,.47)*exp(-shadow*3.0)/(1.0+distance*distance*3.0);
        float extinction=density*.9+dust*3.0;vec3 attenuation=exp(-extinction*stepSize*vec3(2.0,2.4,3.0));
        total+=T*(1.0-attenuation)*(emission*.15*(1.0-dustFraction*.92)+illumination*.035);T*=attenuation;
        if(max(T.r,max(T.g,T.b))<.008)break;
      }
      vec3 background=stars(vUv);
      vec2 source=xy-vec2(-.18,.12);float r2=dot(source,source);
      background+=vec3(1.0,.87,.67)*(.00005/(r2+.0003)+exp(-r2*3000.0)*4.0);
      total+=T*background;
      colour=vec4(pow(aces(total*uExposure),vec3(1.0/2.2)),1.0);
    }`
};
