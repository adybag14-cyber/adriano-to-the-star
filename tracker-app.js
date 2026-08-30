(function bootNearbyStarTracker(global) {
  'use strict';

  const mount = document.getElementById('tracker-react-root');
  const bootStatus = document.getElementById('tracker-boot-status');
  if (!mount) return;
  document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });

  const fail = message => {
    if (bootStatus) bootStatus.textContent = `${message} The accessible catalogue below remains available.`;
    mount.setAttribute('data-tracker-error', 'true');
  };

  if (!global.React || !global.ReactDOM?.createRoot || !global.THREE || !global.ITAStarTrackerScene) {
    fail('The enhanced React/Three view could not start.');
    return;
  }

  const React = global.React;
  const { useCallback, useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  function classNames(...values) { return values.filter(Boolean).join(' '); }
  function formatNumber(value, digits = 1) { return Number.isFinite(value) ? new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits }).format(value) : '—'; }
  function formatDate(value) {
    if (!value) return 'Not reported';
    const date = new Date(`${value.length === 10 ? value + 'T00:00:00Z' : value}`);
    return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }
  function normalise(value) { return String(value || '').toLocaleLowerCase('en-GB').normalize('NFKD'); }
  function externalLink(url, label, className) {
    return h('a', { href: url, target: '_blank', rel: 'external noopener noreferrer', className }, label, h('span', { 'aria-hidden': 'true' }, ' ↗'));
  }

  class TrackerErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) { console.error('Nearby star tracker render failed', error); }
    render() {
      if (!this.state.error) return this.props.children;
      return h('section', { className: 'tracker-runtime-error', role: 'alert' },
        h('h2', null, 'Enhanced tracker unavailable'),
        h('p', null, 'The scientific fallback table remains available below. No cross-origin retry or data submission was attempted.'),
        h('button', { type: 'button', onClick: () => location.reload() }, 'Retry page')
      );
    }
  }

  function Tutorial({ open, onClose }) {
    const dialogRef = useRef(null);
    const [step, setStep] = useState(0);
    const steps = [
      { title: 'Read the frame', text: 'The Sun is the origin. Positions use a heliocentric equatorial teaching frame in parsecs. The rings mark 5 pc intervals; this is orientation, not spacecraft navigation.' },
      { title: 'Interrogate selection effects', text: 'Planet-host points are not a complete stellar sample. Detection probability depends on instrument sensitivity, cadence, geometry, stellar activity, and survey footprint.' },
      { title: 'Inspect a system', text: 'Select a point or table row to compare distance, spectral class, temperature, discovery methods, orbital periods, and archive update dates.' },
      { title: 'Verify provenance', text: 'Every record identifies its source. Numerical planet data comes from the NASA Exoplanet Archive snapshot; nearby landmark context links to Gaia GCNS and CNS5.' }
    ];

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (open && !dialog.open) { setStep(0); dialog.showModal(); }
      if (!open && dialog.open) dialog.close();
    }, [open]);

    return h('dialog', {
      ref: dialogRef,
      className: 'tracker-tutorial',
      'aria-labelledby': 'tracker-tutorial-title',
      onCancel: event => { event.preventDefault(); onClose(); },
      onClose
    },
      h('div', { className: 'tracker-tutorial-progress', 'aria-label': `Tutorial step ${step + 1} of ${steps.length}` },
        steps.map((_, index) => h('span', { key: index, className: index <= step ? 'is-active' : '', 'aria-hidden': 'true' }))
      ),
      h('p', { className: 'tracker-overline' }, `FIELD TUTORIAL · ${String(step + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`),
      h('h2', { id: 'tracker-tutorial-title' }, steps[step].title),
      h('p', null, steps[step].text),
      h('div', { className: 'tracker-tutorial-actions' },
        h('button', { type: 'button', disabled: step === 0, onClick: () => setStep(value => value - 1) }, 'Previous'),
        step < steps.length - 1
          ? h('button', { type: 'button', className: 'is-primary', onClick: () => setStep(value => value + 1) }, 'Next')
          : h('button', { type: 'button', className: 'is-primary', onClick: onClose }, 'Begin analysis')
      ),
      h('button', { type: 'button', className: 'tracker-dialog-close', onClick: onClose, 'aria-label': 'Close tutorial' }, '×')
    );
  }

  function ScenePanel({ stars, selectedId, onSelect, sceneApiRef }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const [autoRotate, setAutoRotate] = useState(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [diagnostics, setDiagnostics] = useState({ api: 'Initialising', stars: stars.length, pixelRatio: 1, width: 0, height: 0 });

    useEffect(() => {
      const scene = new global.ITAStarTrackerScene(containerRef.current, stars, { onSelect, onDiagnostics: setDiagnostics });
      sceneRef.current = scene;
      if (sceneApiRef) sceneApiRef.current = scene;
      return () => {
        scene.destroy();
        sceneRef.current = null;
        if (sceneApiRef) sceneApiRef.current = null;
      };
    }, []);

    useEffect(() => { sceneRef.current?.setStars(stars); }, [stars]);
    useEffect(() => { if (selectedId) sceneRef.current?.select(selectedId, false); }, [selectedId]);

    const toggleMotion = () => {
      const next = !autoRotate;
      setAutoRotate(next);
      sceneRef.current?.setAutoRotate(next);
    };

    return h('section', { className: 'tracker-scene-panel', 'aria-labelledby': 'tracker-scene-title' },
      h('div', { className: 'tracker-panel-heading' },
        h('div', null, h('p', { className: 'tracker-overline' }, 'THREE.JS / HELIOCENTRIC FRAME'), h('h2', { id: 'tracker-scene-title' }, 'Local stellar neighbourhood')),
        h('div', { className: 'tracker-scene-actions' },
          h('button', { type: 'button', onClick: () => sceneRef.current?.reset() }, 'Reset view'),
          h('button', { type: 'button', onClick: toggleMotion, 'aria-pressed': autoRotate }, autoRotate ? 'Pause drift' : 'Resume drift')
        )
      ),
      h('div', { className: 'tracker-scene-wrap' },
        h('div', { ref: containerRef, className: 'tracker-scene', 'data-testid': 'tracker-scene' }),
        h('div', { className: 'tracker-scene-legend', 'aria-label': 'Map legend' },
          h('span', null, h('i', { className: 'legend-host' }), 'Confirmed planet host'),
          h('span', null, h('i', { className: 'legend-landmark' }), 'Nearby landmark'),
          h('span', null, h('i', { className: 'legend-origin' }), 'Sol')
        ),
        h('p', { id: 'tracker-scene-help', className: 'tracker-scene-help' }, 'Drag or swipe to orbit · Wheel or +/− to zoom · Arrow keys to rotate · Home to reset · Select a star to inspect it')
      ),
      h('dl', { className: 'tracker-diagnostics', 'aria-label': 'Renderer diagnostics' },
        h('div', null, h('dt', null, 'API'), h('dd', null, diagnostics.api)),
        h('div', null, h('dt', null, 'Visible points'), h('dd', null, diagnostics.stars)),
        h('div', null, h('dt', null, 'Render scale'), h('dd', null, `${diagnostics.pixelRatio.toFixed(2)}×`)),
        h('div', null, h('dt', null, 'Canvas'), h('dd', null, `${diagnostics.width} × ${diagnostics.height}`))
      )
    );
  }

  function SystemDetail({ star, sourceById }) {
    if (!star) return h('aside', { className: 'tracker-detail tracker-detail--empty' }, h('h2', null, 'Select a system'), h('p', null, 'Choose a point or a catalogue row to inspect its parameters and provenance.'));
    return h('aside', { className: 'tracker-detail', 'aria-labelledby': 'tracker-detail-title' },
      h('p', { className: 'tracker-overline' }, star.kind === 'planet-host' ? 'CONFIRMED PLANET HOST' : star.kind === 'origin' ? 'REFERENCE ORIGIN' : 'NEARBY LANDMARK'),
      h('h2', { id: 'tracker-detail-title' }, star.name),
      star.aliases?.length ? h('p', { className: 'tracker-aliases' }, star.aliases.join(' · ')) : null,
      h('p', { className: 'tracker-detail-note' }, star.note),
      h('dl', { className: 'tracker-facts' },
        h('div', null, h('dt', null, 'Distance'), h('dd', null, `${formatNumber(star.distanceLy, 2)} ly`, h('small', null, `${formatNumber(star.distancePc, 3)} pc`))),
        h('div', null, h('dt', null, 'Spectral class'), h('dd', null, star.spectralType || 'Unreported')),
        h('div', null, h('dt', null, 'Effective temperature'), h('dd', null, Number.isFinite(star.temperatureK) ? `${formatNumber(star.temperatureK, 0)} K` : 'Unreported')),
        h('div', null, h('dt', null, 'Confirmed planets'), h('dd', null, star.planetCount))
      ),
      h('div', { className: 'tracker-coordinate-block' },
        h('h3', null, 'Equatorial orientation'),
        h('p', null, `RA ${formatNumber(star.raDeg, 4)}° · Dec ${formatNumber(star.decDeg, 4)}°`),
        h('code', null, `(${formatNumber(star.coordinatesPc?.xPc, 3)}, ${formatNumber(star.coordinatesPc?.yPc, 3)}, ${formatNumber(star.coordinatesPc?.zPc, 3)}) pc`)
      ),
      star.planets?.length ? h('div', { className: 'tracker-planets' },
        h('h3', null, 'Archive planets'),
        h('ul', null, star.planets.map(planet => h('li', { key: planet.name },
          h('div', null, h('strong', null, planet.name), h('span', null, planet.method || 'Method unreported')),
          h('small', null, `${planet.orbitalPeriodDays ? `${formatNumber(planet.orbitalPeriodDays, 3)} d orbit · ` : ''}${planet.discoveryYear || 'year unreported'} · archive ${formatDate(planet.archiveUpdated)}`)
        )))
      ) : h('p', { className: 'tracker-no-planets' }, 'No confirmed planet row is attached to this compact teaching snapshot. Absence here is not proof that the system has no planets.'),
      h('div', { className: 'tracker-source-links', 'aria-label': 'Sources for this system' },
        star.sourceIds?.map(sourceId => sourceById.get(sourceId)).filter(Boolean).map(source => externalLink(source.url, source.name, 'tracker-source-link'))
      )
    );
  }

  function FilterPanel({ query, setQuery, maxDistance, setMaxDistance, kind, setKind, sort, setSort, total, shown }) {
    return h('form', { className: 'tracker-filters', onSubmit: event => event.preventDefault(), role: 'search' },
      h('div', { className: 'tracker-filter-field tracker-filter-search' },
        h('label', { htmlFor: 'tracker-search' }, 'Search system or planet'),
        h('input', { id: 'tracker-search', type: 'search', value: query, onChange: event => setQuery(event.target.value), placeholder: 'Proxima, Barnard, TESS…', autoComplete: 'off' })
      ),
      h('div', { className: 'tracker-filter-field' },
        h('label', { htmlFor: 'tracker-distance' }, `Maximum distance · ${maxDistance} pc`),
        h('input', { id: 'tracker-distance', type: 'range', min: 2, max: 25, step: 1, value: maxDistance, onChange: event => setMaxDistance(Number(event.target.value)) })
      ),
      h('div', { className: 'tracker-filter-field' },
        h('label', { htmlFor: 'tracker-kind' }, 'Catalogue layer'),
        h('select', { id: 'tracker-kind', value: kind, onChange: event => setKind(event.target.value) },
          h('option', { value: 'all' }, 'All scene stars'),
          h('option', { value: 'planet-host' }, 'Confirmed planet hosts'),
          h('option', { value: 'landmark' }, 'Nearby landmarks')
        )
      ),
      h('div', { className: 'tracker-filter-field' },
        h('label', { htmlFor: 'tracker-sort' }, 'Sort rows'),
        h('select', { id: 'tracker-sort', value: sort, onChange: event => setSort(event.target.value) },
          h('option', { value: 'distance' }, 'Distance: nearest first'),
          h('option', { value: 'name' }, 'System name'),
          h('option', { value: 'planets' }, 'Confirmed planets')
        )
      ),
      h('p', { className: 'tracker-result-count', role: 'status', 'aria-live': 'polite' }, `${shown} of ${total} scene systems visible`)
    );
  }

  function SystemsTable({ stars, selectedId, onSelect }) {
    return h('div', { className: 'tracker-table-region', role: 'region', 'aria-labelledby': 'tracker-table-title', tabIndex: 0 },
      h('table', null,
        h('caption', { id: 'tracker-table-title' }, 'Filtered local stellar-neighbourhood catalogue'),
        h('thead', null, h('tr', null,
          h('th', { scope: 'col' }, 'System'), h('th', { scope: 'col' }, 'Distance'), h('th', { scope: 'col' }, 'Class'), h('th', { scope: 'col' }, 'Planets'), h('th', { scope: 'col' }, 'Action')
        )),
        h('tbody', null, stars.map(star => h('tr', { key: star.id, className: selectedId === star.id ? 'is-selected' : '' },
          h('th', { scope: 'row' }, star.name),
          h('td', null, `${formatNumber(star.distanceLy, 2)} ly`),
          h('td', null, star.spectralType || '—'),
          h('td', null, star.planetCount),
          h('td', null, h('button', { type: 'button', onClick: () => onSelect(star), 'aria-pressed': selectedId === star.id, 'aria-label': selectedId === star.id ? `Selected: ${star.name}` : `Inspect ${star.name}` }, selectedId === star.id ? 'Selected' : 'Inspect'))
        )))
      )
    );
  }

  function Discoveries({ discoveries, source }) {
    const [query, setQuery] = useState('');
    const [method, setMethod] = useState('all');
    const methods = useMemo(() => [...new Set(discoveries.map(item => item.method).filter(Boolean))].sort(), [discoveries]);
    const filtered = useMemo(() => discoveries.filter(item => {
      const text = normalise([item.planetName, item.hostName, item.facility, item.method].join(' '));
      return text.includes(normalise(query)) && (method === 'all' || item.method === method);
    }), [discoveries, query, method]);
    return h('section', { className: 'tracker-discoveries', 'aria-labelledby': 'discoveries-title' },
      h('div', { className: 'tracker-section-heading' },
        h('div', null, h('p', { className: 'tracker-overline' }, 'NASA MISSION DISCOVERY STREAM'), h('h2', { id: 'discoveries-title' }, 'Recently updated Kepler, K2, and TESS planets')),
        externalLink(source.url, 'Open NASA Exoplanet Archive', 'tracker-primary-link')
      ),
      h('p', { className: 'tracker-discovery-disclosure' }, '“NASA mission” refers to the discovery-facility field supplied by the archive. Confirmation frequently combines NASA mission observations with international follow-up; the exact facility and telescope fields are preserved below.'),
      h('div', { className: 'tracker-discovery-filters' },
        h('div', null, h('label', { htmlFor: 'discovery-search' }, 'Search discoveries'), h('input', { id: 'discovery-search', type: 'search', value: query, onChange: event => setQuery(event.target.value), placeholder: 'Planet, host, facility…' })),
        h('div', null, h('label', { htmlFor: 'discovery-method' }, 'Discovery method'), h('select', { id: 'discovery-method', value: method, onChange: event => setMethod(event.target.value) }, h('option', { value: 'all' }, 'All methods'), methods.map(value => h('option', { value, key: value }, value))))
      ),
      h('p', { className: 'tracker-result-count', role: 'status', 'aria-live': 'polite' }, `${filtered.length} discoveries shown`),
      h('div', { className: 'tracker-discovery-grid' }, filtered.map(item => h('article', { key: item.id, className: 'tracker-discovery-card' },
        h('div', { className: 'tracker-card-topline' }, h('span', null, item.discoveryYear || 'Year unreported'), h('span', null, item.method || 'Method unreported')),
        h('h3', null, item.planetName),
        h('p', null, item.hostName, ' · ', item.distanceLy ? `${formatNumber(item.distanceLy, 1)} ly` : 'distance unreported'),
        h('dl', null,
          h('div', null, h('dt', null, 'Radius'), h('dd', null, item.radiusEarth ? `${formatNumber(item.radiusEarth, 2)} R⊕` : '—')),
          h('div', null, h('dt', null, 'Mass'), h('dd', null, item.massEarth ? `${formatNumber(item.massEarth, 2)} M⊕` : '—')),
          h('div', null, h('dt', null, 'Period'), h('dd', null, item.orbitalPeriodDays ? `${formatNumber(item.orbitalPeriodDays, 3)} d` : '—'))
        ),
        h('p', { className: 'tracker-facility' }, h('strong', null, item.facility || 'Facility unreported'), h('small', null, item.telescope || 'Telescope unreported')),
        h('p', { className: 'tracker-archive-update' }, `Archive row updated ${formatDate(item.archiveUpdated)}`)
      )))
    );
  }

  function Provenance({ data }) {
    return h('section', { className: 'tracker-provenance', 'aria-labelledby': 'tracker-provenance-title' },
      h('div', { className: 'tracker-section-heading' },
        h('div', null, h('p', { className: 'tracker-overline' }, 'METHODS / PROVENANCE / LIMITS'), h('h2', { id: 'tracker-provenance-title' }, 'Read the map like an astrophysicist.')),
        h('span', { className: 'tracker-snapshot-badge' }, 'Same-origin snapshot')
      ),
      h('div', { className: 'tracker-method-grid' }, data.teachingNotes.map(note => h('article', { key: note.title }, h('h3', null, note.title), h('p', null, note.text)))),
      h('div', { className: 'tracker-coordinate-note' },
        h('h3', null, data.coordinateFrame.name),
        h('p', null, `${data.coordinateFrame.epoch}. Axes: X ${data.coordinateFrame.axes.x}; Y ${data.coordinateFrame.axes.y}; Z ${data.coordinateFrame.axes.z}.`),
        h('p', null, data.coordinateFrame.warning)
      ),
      h('div', { className: 'tracker-sources' }, data.sources.map(source => h('article', { key: source.id },
        h('p', { className: 'tracker-overline' }, source.organisation),
        h('h3', null, source.name),
        source.doi ? h('p', null, 'Persistent citation: ', h('code', null, source.doi)) : null,
        h('p', null, source.licenceNote),
        h('div', null, externalLink(source.url, 'Source'), externalLink(source.documentationUrl, 'Documentation'))
      )))
    );
  }

  function TrackerApp({ data }) {
    const sourceById = useMemo(() => new Map(data.sources.map(source => [source.id, source])), [data.sources]);
    const [activeView, setActiveView] = useState('neighbourhood');
    const [query, setQuery] = useState('');
    const [maxDistance, setMaxDistance] = useState(12);
    const [kind, setKind] = useState('all');
    const [sort, setSort] = useState('distance');
    const initialStar = data.stars.find(star => star.name === 'Proxima Cen') || data.stars.find(star => star.id !== 'sol') || data.stars[0];
    const [selected, setSelected] = useState(initialStar);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const sceneApiRef = useRef(null);

    const filteredStars = useMemo(() => {
      const needle = normalise(query);
      const list = data.stars.filter(star => {
        const searchable = normalise([star.name, ...(star.aliases || []), ...(star.planets || []).map(planet => planet.name)].join(' '));
        const kindMatches = kind === 'all' || star.kind === kind || (kind === 'landmark' && star.kind === 'origin');
        return star.distancePc <= maxDistance && kindMatches && searchable.includes(needle);
      });
      return list.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'planets') return b.planetCount - a.planetCount || a.distancePc - b.distancePc;
        return a.distancePc - b.distancePc || a.name.localeCompare(b.name);
      });
    }, [data.stars, query, maxDistance, kind, sort]);

    const selectStar = useCallback(star => {
      setSelected(star);
      sceneApiRef.current?.select(star.id, false);
    }, []);

    useEffect(() => {
      if (selected && filteredStars.some(star => star.id === selected.id)) return;
      if (filteredStars[0]) setSelected(filteredStars[0]);
    }, [filteredStars, selected]);

    return h(React.Fragment, null,
      h('section', { className: 'tracker-app-shell', 'aria-label': 'Nearby star tracker application' },
        h('div', { className: 'tracker-app-status' },
          h('div', null, h('span', { className: 'tracker-live-dot', 'aria-hidden': 'true' }), h('strong', null, 'Snapshot verified'), h('span', null, `Generated ${formatDate(data.generatedAt)}`)),
          h('div', null, h('span', null, `${data.statistics.sceneStars} systems`), h('span', null, `${data.statistics.scenePlanets} planets`), h('span', null, `archive through ${formatDate(data.statistics.latestArchiveUpdate)}`)),
          h('button', { type: 'button', onClick: () => setTutorialOpen(true) }, 'Open field tutorial')
        ),
        h('div', { className: 'tracker-view-tabs', role: 'tablist', 'aria-label': 'Tracker data views' },
          h('button', { type: 'button', role: 'tab', id: 'neighbourhood-tab', 'aria-controls': 'neighbourhood-panel', 'aria-selected': activeView === 'neighbourhood', onClick: () => setActiveView('neighbourhood') }, 'Stellar neighbourhood'),
          h('button', { type: 'button', role: 'tab', id: 'discoveries-tab', 'aria-controls': 'discoveries-panel', 'aria-selected': activeView === 'discoveries', onClick: () => setActiveView('discoveries') }, 'NASA mission discoveries')
        ),
        h('div', { id: 'neighbourhood-panel', role: 'tabpanel', 'aria-labelledby': 'neighbourhood-tab', hidden: activeView !== 'neighbourhood' },
          h(FilterPanel, { query, setQuery, maxDistance, setMaxDistance, kind, setKind, sort, setSort, total: data.stars.length, shown: filteredStars.length }),
          filteredStars.length ? h('div', { className: 'tracker-workspace' },
            h(ScenePanel, { stars: filteredStars, selectedId: selected?.id, onSelect: selectStar, sceneApiRef }),
            h(SystemDetail, { star: selected, sourceById })
          ) : h('div', { className: 'tracker-empty', role: 'status' }, h('h2', null, 'No systems match'), h('p', null, 'Increase the distance, change the catalogue layer, or clear the search.')),
          filteredStars.length ? h(SystemsTable, { stars: filteredStars, selectedId: selected?.id, onSelect: selectStar }) : null
        ),
        h('div', { id: 'discoveries-panel', role: 'tabpanel', 'aria-labelledby': 'discoveries-tab', hidden: activeView !== 'discoveries' },
          h(Discoveries, { discoveries: data.nasaDiscoveries, source: sourceById.get('nasa-exoplanet-archive-ps') })
        )
      ),
      h(Provenance, { data }),
      h(Tutorial, { open: tutorialOpen, onClose: () => setTutorialOpen(false) })
    );
  }

  async function loadData() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch('data/tracker/stellar-neighborhood.json', { credentials: 'same-origin', cache: 'no-cache', signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Snapshot request returned HTTP ${response.status}`);
      const data = await response.json();
      if (data.schemaVersion !== 1 || !Array.isArray(data.stars) || data.stars.length < 20 || !Array.isArray(data.nasaDiscoveries)) throw new Error('Snapshot schema or record count is invalid');
      return data;
    } finally { clearTimeout(timeout); }
  }

  loadData().then(data => {
    global.ReactDOM.createRoot(mount).render(h(TrackerErrorBoundary, null, h(TrackerApp, { data })));
    document.getElementById('tracker-static-fallback')?.setAttribute('hidden', '');
    mount.setAttribute('aria-busy', 'false');
    if (bootStatus) bootStatus.textContent = `Enhanced tracker loaded from the same-origin snapshot generated ${formatDate(data.generatedAt)}.`;
    document.body.dataset.trackerReady = 'true';
  }).catch(error => {
    console.error('Nearby star snapshot unavailable', error);
    mount.setAttribute('aria-busy', 'false');
    fail('The current scientific snapshot could not be loaded.');
  });
})(window);
