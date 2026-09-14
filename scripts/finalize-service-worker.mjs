import { writeFileSync } from 'node:fs';

const OUT = 'dist/client/sw.js';
const SITE_PATH = '/mithila-vajji-anga';
const buildId = (process.env.GITHUB_SHA || 'local-build').slice(0, 12);
const cacheName = `mva-${buildId}`;

const core = [
  `${SITE_PATH}/`,
  `${SITE_PATH}/en/`,
  `${SITE_PATH}/history/`,
  `${SITE_PATH}/philosophy/`,
  `${SITE_PATH}/literature/`,
  `${SITE_PATH}/panji/`,
  `${SITE_PATH}/en/philosophy/`,
  `${SITE_PATH}/en/literature/`,
  `${SITE_PATH}/en/panji/`,
  `${SITE_PATH}/records/`,
  `${SITE_PATH}/accessibility/`,
  `${SITE_PATH}/offline/`,
  `${SITE_PATH}/records-index.json`,
];

const source = `const CACHE=${JSON.stringify(cacheName)};
const SITE_PATH=${JSON.stringify(SITE_PATH)};
const CORE=${JSON.stringify(core)};
const OFFLINE=SITE_PATH+'/offline/';

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(CORE.map(async path=>{
      try{
        const response=await fetch(new Request(path,{cache:'reload'}));
        if(response.ok) await cache.put(path,response.clone());
      }catch{}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('mva-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window'});
    clients.forEach(client=>client.postMessage({type:'MVA_SW_UPDATED',cache:CACHE}));
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok) await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request)) || (await caches.match(OFFLINE)) || Response.error();
  }
}

async function cacheFirstHashed(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached) return cached;
  const response=await fetch(request);
  if(response.ok) await cache.put(request,response.clone());
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  const isDocument=request.mode==='navigate'||request.destination==='document';
  const isHashedAsset=url.pathname.includes('/_next/static/');
  if(isDocument){
    event.respondWith(networkFirst(request));
    return;
  }
  if(isHashedAsset){
    event.respondWith(cacheFirstHashed(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
`;

writeFileSync(OUT, source, 'utf8');
console.log(`Finalized service worker ${cacheName}: navigation is network-first and old release caches are removed.`);
