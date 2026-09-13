# Implemented reconstruction architecture

The original database card and selected-object toolbar call `viewPlanet3D`.
`database-3d-loader.js` resolves a versioned static engine only on request. The
legacy r128 loader remains available to its existing non-database consumers.

`entry.js` resolves an immutable release manifest and loads that release's copy
of `viewer.js`. Each release contains the exact controller, data contracts,
physics, procedural field, worker, renderer, optics and pinned Three r186 files.
This prevents a historical evidence URL from silently using different shaders.
Ordinary Pages builds validate pinned inputs and copy the release; live source
refresh requires an explicit separate operation.

| Module | Responsibility |
|---|---|
| `nasa-adapter.js`, `build-engine-release.mjs` | Reference-specific source normalization, immutable packets, alternative solutions, source and runtime hashes. |
| `contracts.js` | Runtime identity, units, uncertainty, citation, reference, cycle and scientific-state validation. |
| `physics.js`, `recipes.js`, `policy.js` | Eligible calculations, declared conditional families, independent geological/weather seeds, feature treatment and disclosures. |
| `loader.js` | Bounded same-origin requests, compatible cached release fallback, content verification, cancellation and alternative solutions. |
| `terrain.js`, `terrain-worker.js`, `terrain-manager.js` | Shared continuous height field, picking, local patch geometry, matched edges, bounded requests and atomic frontier changes. |
| `colour.js`, `optics.js`, `renderer.js` | CIE reference integration, stellar approximation, portable optical transport, WebGPU/WebGL2, resource ownership and camera frames. |
| `viewer.js`, `viewer.css` | Persistent evidence, modes, sources, scenario assumptions/comparison, controls, accessible schematic, sharing and labelled exports. |

Published evidence is immutable. A scenario creates a separate recipe and render
packet; it never writes assumed mass, pressure, temperature or geography into the
catalogue. Graphics quality and backend are view settings, not scientific inputs.

Object loading uses AbortController and a generation number. Scenario creation
has an independent generation number. Workers are owned by one renderer and are
terminated on replacement or close. At most eight terrain requests are pending.
The evidence cache has entry and byte caps. Browser failures preserve source access.

The deployment remains GitLab Pages. No application server, Worker, object store,
DNS routing change, mail service or app service is required by this architecture.

See [ADR 001](adr/001-evidence-first-static-viewer.md), [the audit](AUDIT.md),
[the data model](SCIENTIFIC_DATA_MODEL.md) and [limitations](KNOWN_LIMITATIONS.md).
