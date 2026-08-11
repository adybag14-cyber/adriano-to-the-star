class RouteOptimization {
  constructor() {}
  async init() {}
  nearestNeighbor(points) {
    const pts=(Array.isArray(points)?points:[]).map(p=>({x:Number(p.x||0),y:Number(p.y||0),v:false}));
    const path=[]; let cur=0; if(pts.length===0) return path; pts[0].v=true; path.push(0);
    const dist=(a,b)=>{ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); };
    for(let k=1;k<pts.length;k++){ let best=-1,bd=Infinity; for(let i=0;i<pts.length;i++){ if(!pts[i].v){ const d=dist(pts[cur],pts[i]); if(d<bd){bd=d; best=i;} } } pts[best].v=true; path.push(best); cur=best; }
    return path;
  }
}
window.RouteOptimization = RouteOptimization;
