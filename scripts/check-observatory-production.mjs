import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Run after the production HTML propagation gate. Verify the same release-keyed
// pointer and immutable data URLs used by visitors, never accept an old fallback.
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const base=new URL(option('--base','https://adrianotothestar.com/'));
const version=option('--version',process.env.CI_COMMIT_SHORT_SHA);
if(!version || !/^[a-zA-Z0-9_-]{1,80}$/.test(version))throw new Error('A valid deployed asset version is required');
if(!['adrianotothestar.com','www.adrianotothestar.com','127.0.0.1','localhost'].includes(base.hostname))throw new Error('Unexpected production origin');
if(!['127.0.0.1','localhost'].includes(base.hostname)&&base.protocol!=='https:')throw new Error('Production must use HTTPS');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localRoot=path.join(root,'data','observatory');
const remoteRoot=new URL('data/observatory/',base);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const safePath=name=>typeof name==='string'&&/^[a-zA-Z0-9_./-]+\.json$/.test(name)&&!name.startsWith('/')&&!name.split('/').includes('..');
const checked=[];
async function verify(name,expectedHash,{pointer=false}={}){
 if(!safePath(name))throw new Error('Invalid observatory asset path');
 const url=new URL(name,remoteRoot);if(pointer)url.searchParams.set('v',version);
 if(url.origin!==base.origin||!url.pathname.startsWith(remoteRoot.pathname))throw new Error('Observatory asset escaped its origin');
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Observatory production asset ${url.pathname}${url.search} returned HTTP ${response.status}`);
 if(new URL(response.url).origin!==base.origin)throw new Error('Unexpected observatory redirect');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length>8*1024*1024||sha256(bytes)!==expectedHash)throw new Error(`Observatory production hash mismatch: ${name}`);
 checked.push({path:name,bytes:bytes.length,sha256:expectedHash});
 return JSON.parse(bytes.toString('utf8'));
}
const localPointer=await fs.readFile(path.join(localRoot,'current.json'));
const pointer=await verify('current.json',sha256(localPointer),{pointer:true});
if(pointer.schemaVersion!==1||!safePath(pointer.manifest?.path))throw new Error('Invalid observatory pointer');
const manifest=await verify(pointer.manifest.path,pointer.manifest.sha256);
if(manifest.releaseId!==pointer.releaseId||!Array.isArray(manifest.parts)||!manifest.details)throw new Error('Invalid observatory manifest');
const descriptors=[...manifest.parts,...Object.values(manifest.details)];
if(descriptors.length>96)throw new Error('Unexpected observatory shard count');
let cursor=0;
await Promise.all([0,1,2].map(async()=>{
 while(cursor<descriptors.length){
  const descriptor=descriptors[cursor++];
  if(!safePath(descriptor.path)||!/^[a-f0-9]{64}$/.test(descriptor.sha256))throw new Error('Invalid shard descriptor');
  await verify(path.posix.dirname(pointer.manifest.path)+'/'+descriptor.path,descriptor.sha256);
 }
}));
console.log(JSON.stringify({ok:true,origin:base.origin,version,releaseId:manifest.releaseId,objects:manifest.statistics.objects,verifiedAssets:checked.length,verifiedBytes:checked.reduce((sum,item)=>sum+item.bytes,0),policy:'release-keyed pointer; all immutable catalogue and evidence hashes match'},null,2));
