/* Observer-dependent catalogue geometry. No renderer, DOM, randomness or network.
 * Solar elements: JPL SSD, https://ssd.jpl.nasa.gov/planets/approx_pos.html (Table 1).
 * Stellar frame/velocity conventions: https://www.astronexus.com/projects/hyg-details.
 * Educational geometric approximation, NOT an apparent-place/navigation ephemeris.
 */
(() => {
  'use strict';
  const DEG = Math.PI / 180;
  const AU_PER_PC = 648000 / Math.PI;
  const J2000 = 2451545;
  const YEAR_DAYS = 365.25;
  const MAS_RAD = DEG / 3600000;
  const elements = Object.freeze({
    Mercury: [[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
    Venus: [[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
    Earth: [[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
    Mars: [[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
    Jupiter: [[5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
    Saturn: [[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
    Uranus: [[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
    Neptune: [[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
  });
  const norm = v => Math.hypot(v[0], v[1], v[2]);
  const unit = v => { const n = norm(v); return n > 0 && Number.isFinite(n) ? v.map(x => x / n) : null; };
  const key = value => String(value || '').toLowerCase().replace(/[\s\u2212\u2013-]+/g, '');
  function julianDate(date) {
    const milliseconds = date instanceof Date ? date.getTime() : new Date(date).getTime();
    if (!Number.isFinite(milliseconds)) throw new RangeError('Invalid observation date');
    return milliseconds / 86400000 + 2440587.5;
  }
  function julianYear(jd) { return 2000 + (jd - J2000) / YEAR_DAYS; }
  function solveKepler(meanAnomaly, eccentricity) {
    if (!Number.isFinite(meanAnomaly) || !(eccentricity >= 0 && eccentricity < 1)) throw new RangeError('Invalid elliptic orbit');
    const m = Math.atan2(Math.sin(meanAnomaly), Math.cos(meanAnomaly));
    let e = eccentricity < .8 ? m : (m >= 0 ? Math.PI : -Math.PI);
    for (let i = 0; i < 32; i++) {
      const correction = (e - eccentricity * Math.sin(e) - m) / (1 - eccentricity * Math.cos(e));
      e -= correction;
      if (Math.abs(correction) < 1e-13) return e;
    }
    throw new RangeError('Kepler solver did not converge');
  }
  function equatorial(raDeg, decDeg, distancePc = 1) {
    if (![raDeg, decDeg, distancePc].every(Number.isFinite) || raDeg < 0 || raDeg >= 360 || Math.abs(decDeg) > 90 || distancePc <= 0) throw new RangeError('Invalid equatorial position');
    const a = raDeg * DEG, d = decDeg * DEG;
    return [distancePc * Math.cos(d) * Math.cos(a), distancePc * Math.cos(d) * Math.sin(a), distancePc * Math.sin(d)];
  }
  function solarPosition(name, jd) {
    if (!elements[name]) throw new RangeError('Unknown Solar System observer');
    // JPL Table 1 is valid only in its stated 1800–2050 fitting interval.
    if (!Number.isFinite(jd) || jd < julianDate('1800-01-01T00:00:00Z') || jd > julianDate('2050-01-01T00:00:00Z')) throw new RangeError('Solar approximation supports 1800-01-01 through 2050-01-01 only');
    const t = (jd - J2000) / 36525;
    const [a,e,iDeg,l,peri,nodeDeg] = elements[name][0].map((v,index) => v + elements[name][1][index] * t);
    const i = iDeg * DEG, omega = (peri - nodeDeg) * DEG, node = nodeDeg * DEG;
    const eccentric = solveKepler((l - peri) * DEG, e);
    const x = a * (Math.cos(eccentric) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
    const cw = Math.cos(omega), sw = Math.sin(omega), co = Math.cos(node), so = Math.sin(node), ci = Math.cos(i), si = Math.sin(i);
    const xe = (cw*co-sw*so*ci)*x + (-sw*co-cw*so*ci)*y;
    const ye = (cw*so+sw*co*ci)*x + (-sw*so+cw*co*ci)*y;
    const ze = sw*si*x + cw*si*y;
    const obliquity = 23.43928 * DEG;
    return [xe, Math.cos(obliquity)*ye-Math.sin(obliquity)*ze, Math.sin(obliquity)*ye+Math.cos(obliquity)*ze].map(v => v / AU_PER_PC);
  }
  function angularSeparation(a, b) {
    const u = unit(a), v = unit(b);
    if (!u || !v) return NaN;
    const cross = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    return Math.atan2(norm(cross),u[0]*v[0]+u[1]*v[1]+u[2]*v[2]);
  }
  function observeStar(star, observer, year) {
    if (!Number.isFinite(year) || !observer.every(Number.isFinite)) throw new RangeError('Invalid epoch or observer');
    const base = [star.x,star.y,star.z], elapsed = year - 2000;
    if (!base.every(Number.isFinite) || !Number.isFinite(star.mag)) return null;
    if (!star.distanceKnown) {
      if (norm(observer) > .001) return null;
      const a = star.raDeg * DEG, d = star.decDeg * DEG;
      const raRate = (star.pmRaMasYr || 0) * MAS_RAD, decRate = (star.pmDecMasYr || 0) * MAS_RAD;
      const tangent = [-raRate*Math.sin(a)-decRate*Math.cos(a)*Math.sin(d),raRate*Math.cos(a)-decRate*Math.sin(a)*Math.sin(d),decRate*Math.cos(d)];
      const direction = unit(base.map((v,index) => v + elapsed * tangent[index]));
      return direction ? {direction,magnitude:star.mag,distancePc:null,directionOnly:true,shiftRadians:null} : null;
    }
    const moved = base.map((v,index) => v + elapsed * [star.vx || 0,star.vy || 0,star.vz || 0][index]);
    const relative = moved.map((v,index) => v - observer[index]);
    const referenceDistance = norm(base), distancePc = norm(relative);
    if (referenceDistance <= 0 || distancePc < 1e-6) return null; // Coincident positions are not point stars at infinity.
    const direction = unit(relative);
    return {direction,magnitude:star.mag + 5 * Math.log10(distancePc / referenceDistance),distancePc,directionOnly:false,
      shiftRadians:angularSeparation(moved,relative)};
  }
  function resolveObserver(name, jd, catalogue) {
    const solarName = Object.keys(elements).find(n => key(n) === key(name));
    if (solarName) return {name:solarName,position:solarPosition(solarName,jd),kind:'solar',status:'SOLAR SYSTEM',source:'JPL approximate elements',hip:null,
      limitation:solarName === 'Earth' ? 'Earth–Moon barycentre approximation; not a surface horizon.' : 'Approximate heliocentric orbital position; not a surface horizon.'};
    const exactId = catalogue.find(row => row.id === name);
    const candidates = catalogue.filter(row => [row.name,...(row.aliases || [])].some(n => key(n) === key(name)));
    const entry = exactId || (candidates.length === 1 ? candidates[0] : null);
    if (!entry) return null; // An unresolved catalogue alias is not a unique observer position.
    const extragalactic = key(entry.name) === key('PA-99-N2 b');
    return {name:entry.name,position:equatorial(entry.raDeg,entry.decDeg,entry.distancePc),kind:extragalactic ? 'extragalactic-hypothesis' : 'host-location',
      status:entry.status,source:entry.source,host:entry.host,hip:entry.hip ? Number(String(entry.hip).replace(/[^0-9]/g,'')) : null,
      limitation:extragalactic ? 'Candidate host location only. No local M31 stellar catalogue or resolved line-of-sight depths; no planet surface is inferred.' : 'Host-location approximation. Unknown orbital phase and host proper motion are not reconstructed; this Solar-selected catalogue is incomplete here.'};
  }
  function projectCatalogue(stars, observer, year, magnitudeLimit = 6.5, solarReference = null) {
    if (!observer || !Number.isFinite(magnitudeLimit)) throw new RangeError('Observer and magnitude limit required');
    const visible = []; let excludedUnknownDistance = 0, maxShift = 0, computed = 0, nearestMagnitude = Infinity;
    for (const star of stars) {
      if (observer.hip && star.hip === observer.hip) continue; // The unresolved local host is not a background star.
      const apparent = observeStar(star,observer.position,year);
      if (!apparent) { if (!star.distanceKnown) excludedUnknownDistance++; continue; }
      computed++;
      nearestMagnitude = Math.min(nearestMagnitude,apparent.magnitude);
      if (apparent.magnitude > magnitudeLimit) continue;
      maxShift = Math.max(maxShift,apparent.shiftRadians || 0);
      visible.push({id:star.id,name:star.name,bv:star.bv,...apparent});
    }
    if (observer.kind !== 'solar' && Number.isFinite(solarReference?.absoluteMagnitudeV)) {
      const distancePc = norm(observer.position);
      if (distancePc > .001) {
        const magnitude = solarReference.absoluteMagnitudeV + 5 * Math.log10(distancePc) - 5;
        computed++;
        nearestMagnitude = Math.min(nearestMagnitude,magnitude);
        if (magnitude <= magnitudeLimit) visible.push({id:0,name:'Sun',bv:solarReference.bv,direction:observer.position.map(v => -v/distancePc),magnitude,distancePc,directionOnly:false,shiftRadians:null,source:solarReference.source});
      }
    }
    visible.sort((a,b) => a.magnitude-b.magnitude || a.id-b.id);
    return {visible,computed,excludedUnknownDistance,maxShiftArcsec:maxShift/DEG*3600,nearestMagnitude:Number.isFinite(nearestMagnitude)?nearestMagnitude:null};
  }
  globalThis.ObservatoryAstrometry = Object.freeze({DEG,AU_PER_PC,J2000,elements,norm,unit,key,julianDate,julianYear,solveKepler,equatorial,solarPosition,angularSeparation,observeStar,resolveObserver,projectCatalogue});
})();
