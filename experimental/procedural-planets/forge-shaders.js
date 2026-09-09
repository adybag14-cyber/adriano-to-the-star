/* Planetary Forge v5: object-space geology, world-space light, physically scaled
   relief, GGX oceans and participating media. Procedural geography is fictional. */
export const fieldGLSL = `
float lattice(vec3 p) {
  p = mod(p, 289.0);
  p = fract(p * vec3(.1031,.11369,.13787));
  p += dot(p,p.yzx+19.19);
  return fract((p.x+p.y)*p.z);
}
float noise3(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(mix(lattice(i),lattice(i+vec3(1,0,0)),f.x),mix(lattice(i+vec3(0,1,0)),lattice(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(lattice(i+vec3(0,0,1)),lattice(i+vec3(1,0,1)),f.x),mix(lattice(i+vec3(0,1,1)),lattice(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  float value=0.0, amplitude=.52;
  for(int i=0;i<7;i++){value+=amplitude*noise3(p);p=p*2.07+vec3(13.1,7.7,3.2);amplitude*=.49;}
  return value;
}
float terrain(vec3 direction,float seed,float scale) {
  vec3 p=direction*scale+vec3(seed*.017,seed*.031,seed*.023);
  vec3 warp=vec3(noise3(p+17.0),noise3(p+43.0),noise3(p+91.0))-.5;
  p+=warp*.78;
  float continent=fbm(p);
  float tectonics=smoothstep(.43,.7,noise3(p*.66+22.0));
  float ridge=1.0-abs(noise3(p*7.0+4.0)*2.0-1.0);
  return clamp(continent*.87+ridge*ridge*tectonics*.19,0.0,1.0);
}
float terrainHeight(vec3 n,float seed,float scale,float water,float relief,float gas) {
  return gas>.5?0.0:max(0.0,terrain(n,seed,scale)-water)*relief;
}
float cloudCoverageAt(vec3 p,float seed,float time,float coverage) {
  if(coverage<.001)return 0.0;
  vec3 wind=p*28.0+vec3(time*.009,time*.001,0)+seed*.017;
  float structure=noise3(p*5.2+seed*.035)*.6+fbm(wind)*.4;
  float curl=noise3(wind*4.1+19.0)*.12;
  return smoothstep(.76-coverage*.43,.91-coverage*.43,structure+curl*.4);
}
vec2 sphereHit(vec3 ro,vec3 rd,float radius) {
  float b=dot(ro,rd),c=dot(ro,ro)-radius*radius,d=b*b-c;
  if(d<0.0)return vec2(-1.0);
  return vec2(-b-sqrt(d),-b+sqrt(d));
}
`;

export const terrainVertex = `
uniform float uSeed,uScale,uWater,uRelief,uGas;
varying vec3 vLocal,vWorld;
${fieldGLSL}
void main(){
  vec3 n=normalize(position);
  float height=terrainHeight(n,uSeed,uScale,uWater,uRelief,uGas);
  vec3 displaced=n*(1.0+height)-n*max(0.0,1.0-length(position));
  vLocal=n;vWorld=(modelMatrix*vec4(displaced,1.0)).xyz;
  gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
}`;

export const terrainFragment = `
precision highp float;
uniform float uSeed,uScale,uWater,uRelief,uGas,uTemperature,uTime,uLights,uCloudCoverage,uCloudDensity,uClouds,uDay;
uniform vec3 uSun;
uniform mat3 uRotation;
varying vec3 vLocal,vWorld;
${fieldGLSL}
float Dggx(float nDotH,float roughness){float a=roughness*roughness,a2=a*a;float d=nDotH*nDotH*(a2-1.0)+1.0;return a2/(3.14159265*d*d+.000001);}
float Gsmith(float nDotV,float roughness){float k=(roughness+1.0);k=k*k*.125;return nDotV/(nDotV*(1.0-k)+k+.00001);}
void main(){
  vec3 p=normalize(vLocal),N0=normalize(uRotation*p),V=normalize(cameraPosition-vWorld),L=normalize(uSun),H=normalize(V+L);
  float elevation=terrain(p,uSeed,uScale),land=smoothstep(uWater-.001,uWater+.004,elevation);
  float height=max(0.0,elevation-uWater)*uRelief;
  float footprint=max(length(dFdx(p)),length(dFdy(p)));
  float fine=0.0,weight=1.0;
  vec3 detail=p*1800.0+uSeed;
  for(int i=0;i<7;i++){
    float frequency=1800.0*pow(2.03,float(i));
    float resolve=1.0-smoothstep(.25,1.4,footprint*frequency);
    fine+=(noise3(detail)-.5)*weight*resolve;detail=detail*2.03+7.1;weight*=.48;
  }
  // Evaluate the macro normal in the spherical domain. Screen derivatives of
  // displaced coarse triangles produce visible polygon-shaped biome patches.
  vec3 tangent=normalize(cross(abs(p.y)<.95?vec3(0,1,0):vec3(1,0,0),p)),bitangent=cross(p,tangent);
  float epsilon=clamp(footprint*.5,.00005,.002);
  float dhT=(terrainHeight(normalize(p+tangent*epsilon),uSeed,uScale,uWater,uRelief,uGas)-height)/epsilon;
  float dhB=(terrainHeight(normalize(p+bitangent*epsilon),uSeed,uScale,uWater,uRelief,uGas)-height)/epsilon;
  vec3 macroNormal=normalize(uRotation*normalize(p-tangent*dhT-bitangent*dhB));
  float bump=land*fine*.000055;
  if(land<.5)bump=(noise3(p*2300.0+vec3(uTime*.08,0,uTime*.04))-.5)*.000004*(1.0-smoothstep(.2,1.0,footprint*2300.0));
  vec3 dx=dFdx(vWorld),dy=dFdy(vWorld),rx=cross(dy,N0),ry=cross(N0,dx);
  float determinant=dot(dx,rx);
  vec3 N=normalize(macroNormal-(rx*dFdx(bump)+ry*dFdy(bump))*sign(determinant)/max(abs(determinant),.00000000001));
  float slope=clamp(length(N-N0)*1.5,0.0,1.0);
  float latitude=abs(p.y),temperature=uTemperature+18.0-65.0*pow(latitude,1.8)-height*6371.0*6.5;
  float moisture=fbm(p*5.2+uSeed*.1);
  vec3 basalt=vec3(.085,.074,.064),desert=vec3(.32,.224,.118),soil=vec3(.12,.079,.043);
  vec3 vegetation=mix(vec3(.016,.04,.009),vec3(.043,.084,.022),moisture);
  vec3 ground=mix(desert,soil,smoothstep(.3,.68,moisture));
  float temperate=smoothstep(258.0,280.0,temperature)*(1.0-smoothstep(310.0,338.0,temperature));
  ground=mix(ground,vegetation,temperate*smoothstep(.32,.53,moisture));
  ground=mix(ground,basalt,slope*.85);
  float snow=(1.0-smoothstep(247.0,272.0,temperature))*(1.0-slope*.5);
  ground=mix(ground,vec3(.63,.73,.8),snow);
  ground*=.88+noise3(p*260.0+uSeed)*.18+fine*.06;
  float coast=1.0-smoothstep(.002,.018,abs(elevation-uWater));
  ground=mix(ground,vec3(.34,.29,.19),coast*.6*(1.0-snow));
  vec3 ocean=mix(vec3(.0015,.006,.014),vec3(.008,.055,.065),coast);
  if(uTemperature>650.0){ground=mix(vec3(.021,.013,.01),vec3(.1,.034,.012),moisture);ocean=vec3(.18,.016,.001);}
  if(uTemperature<220.0){ocean=vec3(.14,.25,.32);ground=mix(ground,vec3(.42,.58,.67),.6);}
  vec3 albedo=mix(ocean,ground,land);
  float roughness=mix(.075,.83,land),metal=0.0;
  if(uGas>.5){
    float belt=sin(p.y*95.0+fbm(p*8.0+uSeed)*7.0+uTime*.007);
    float storm=fbm(vec3(p.x*36.0+uTime*.01,p.y*16.0,p.z*36.0)+uSeed);
    albedo=mix(vec3(.18,.115,.064),vec3(.52,.43,.32),smoothstep(-.8,.8,belt*.6+storm*.65));
    albedo=mix(albedo,vec3(.6,.53,.42),pow(storm,5.0));roughness=.95;N=N0;
  }
  float nL=max(dot(N,L),0.0),nV=max(dot(N,V),.001),nH=max(dot(N,H),0.0),vH=max(dot(V,H),0.0);
  vec3 F0=mix(vec3(.02),vec3(.045),land),F=F0+(1.0-F0)*pow(1.0-vH,5.0);
  vec3 specular=Dggx(nH,roughness)*Gsmith(nV,roughness)*Gsmith(nL,roughness)*F/max(4.0*nL*nV,.001);
  float cloudShadow=1.0;
  if(uClouds>.5 && uGas<.5){
    vec3 localSun=transpose(uRotation)*L;
    float incidence=max(.2,dot(p,localSun));
    vec3 projected=normalize(p+localSun*.0015/incidence)*1.0015;
    // The ground shadow and visible volume sample the identical seeded field.
    float cover=cloudCoverageAt(projected,uSeed,uTime,uCloudCoverage);
    cloudShadow=exp(-cover*uCloudDensity*1.8/incidence);
  }
  vec3 sun=vec3(1.0,.958,.89)*3.1;
  vec3 colour=(albedo/3.14159265*(1.0-F)+specular)*sun*nL*cloudShadow;
  colour+=albedo*(.012+.025*max(N0.y,0.0));
  if(uTemperature>650.0)colour+=vec3(2.8,.22,.015)*(1.0-land)*.85;
  float night=1.0-smoothstep(-.2,.03,dot(N0,L));
  if(uLights>.5 && land>.5 && uGas<.5){float settlements=step(.82,noise3(p*260.0+uSeed))*step(.58,moisture);colour+=vec3(1.5,.8,.24)*settlements*night*.12;}
  gl_FragColor=vec4(colour,1.0);
}`;

export const volumeVertex = `varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
export const cloudFragment = `
precision highp float;
uniform vec3 uCamera,uSunLocal;
uniform float uSeed,uTime,uCoverage,uDensity;
varying vec3 vLocal;
${fieldGLSL}
float densityAt(vec3 p){
  if(uCoverage<.001)return 0.0;
  float altitude=(length(p)-1.0003)/.0025;
  float layer=smoothstep(0.0,.18,altitude)*(1.0-smoothstep(.55,1.0,altitude));
  return cloudCoverageAt(p,uSeed,uTime,uCoverage)*layer*uDensity;
}
void main(){
  vec3 ro=uCamera,rd=normalize(vLocal-ro);
  vec2 shell=sphereHit(ro,rd,1.0028);if(shell.y<0.0)discard;
  vec2 ground=sphereHit(ro,rd,1.0003);
  float start=max(shell.x,0.0),finish=ground.x>0.0?ground.x:shell.y;
  if(finish<=start)discard;
  float stepSize=(finish-start)/24.0,T=1.0;vec3 sum=vec3(0);
  float cosine=dot(-rd,uSunLocal),g=.55;
  float phase=(1.0-g*g)/pow(max(.02,1.0+g*g-2.0*g*cosine),1.5);
  for(int i=0;i<24;i++){
    vec3 p=ro+rd*(start+(float(i)+.5)*stepSize);
    float density=densityAt(p),shadow=0.0;
    for(int j=1;j<=6;j++)shadow+=densityAt(p+uSunLocal*float(j)*.0006)*.7;
    float attenuation=exp(-density*stepSize*1400.0);
    vec3 light=vec3(.008,.014,.025)+vec3(1.0,.965,.92)*exp(-shadow)*max(0.0,dot(normalize(p),uSunLocal))*(.95+phase*.12);
    sum+=T*(1.0-attenuation)*light;T*=attenuation;
    if(T<.015)break;
  }
  float alpha=1.0-T;if(alpha<.005)discard;gl_FragColor=vec4(sum/max(alpha,.001),alpha);
}`;

export const atmosphereFragment = `
precision highp float;
uniform vec3 uCamera,uSunLocal;
uniform float uDensity;
varying vec3 vLocal;
${fieldGLSL}
void main(){
  vec3 ro=uCamera,rd=normalize(vLocal-ro);vec2 outer=sphereHit(ro,rd,1.035);
  if(outer.y<0.0)discard;
  vec2 ground=sphereHit(ro,rd,1.0);
  float start=max(outer.x,0.0),finish=ground.x>0.0?ground.x:outer.y;
  float ds=(finish-start)/20.0;vec3 optical=vec3(0),sum=vec3(0);
  vec3 beta=vec3(5.8,13.5,33.1)*uDensity*4.2;
  float cosine=dot(rd,uSunLocal),rayleigh=.0596831*(1.0+cosine*cosine);
  for(int i=0;i<20;i++){
    vec3 p=ro+rd*(start+(float(i)+.5)*ds);float h=max(0.0,length(p)-1.0);
    float density=exp(-h/.0013);
    vec2 sunHit=sphereHit(p,uSunLocal,1.035);float sunDepth=0.0;
    for(int j=0;j<4;j++){vec3 q=p+uSunLocal*(float(j)+.5)*max(sunHit.y,0.0)/4.0;sunDepth+=exp(-max(0.0,length(q)-1.0)/.0013)*max(sunHit.y,0.0)/4.0;}
    float day=smoothstep(-.12,.02,dot(normalize(p),uSunLocal));
    optical+=beta*density*ds;
    sum+=exp(-optical-beta*sunDepth)*beta*density*ds*rayleigh*day*3.6;
  }
  gl_FragColor=vec4(sum,1.0);
}`;

export const compositeVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
export const compositeFragment = `
uniform sampler2D uScene;uniform vec2 uPixel;uniform float uExposure;varying vec2 vUv;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main(){
  vec3 colour=texture2D(uScene,vUv).rgb,bloom=vec3(0);
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)bloom+=max(vec3(0),texture2D(uScene,vUv+vec2(float(x),float(y))*uPixel*3.0).rgb-1.0);
  colour=aces((colour+bloom*.016)*uExposure);
  gl_FragColor=vec4(pow(colour,vec3(1.0/2.2)),1.0);
}`;
