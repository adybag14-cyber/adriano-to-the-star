# Exoplanet viewer audit — 13 September 2026

Authority: GitLab `adybag14-group/starisdons`, `main` at
`366fa56e8e71482bee3fd55e2e050503b8adf66f`; successful production pipeline
[2834134155](https://gitlab.com/adybag14-group/starisdons/-/pipelines/2834134155).
The live database loads `database-optimized.js?v=366fa56e` and
`planet-3d-viewer.js?v=366fa56e`. GitHub is the existing validation mirror.
An isolated worktree preserves all older checkouts. No AGENTS.md or Sites hosting
configuration governs this repository. npm/Node 24.14.0, lockfile, Windows
`build-pages.ps1`, `.gitlab-ci.yml` and `ci/smart-runner-windows.ps1` are the build
and release authority. Baseline: 10 Jest suites / 80 tests passed; Pages build
and production-page audit passed (2,735 output items).

## A–P assessment

| Item | Inspected state and integrated decision |
|---|---|
| A. Architecture | `database.html` → `database-optimized.js:viewPlanet3D` → `database-3d-loader.js:ensureDatabase3D` → `Planet3DViewer.visualizePlanet`. The selected KOI identifier, not the host KIC identifier, distinguishes siblings. Add an evidence-first implementation at this exact entry; retain the legacy class for Pioneer and unrelated routes. |
| B. Renderer | Lazy Three r128 + OrbitControls; 64×64 sphere, canvas procedural texture, fixed ambient/white/blue lights, random starfield, fixed 2–10 orbit distance. Some optional game/XR modules appear as unavailable buttons. It has explicit mesh/map disposal but scientific effects are not governed by evidence. |
| C. Appearance causes | `inferPlanetType` uses `radius || 1`; `getPlanetMaterial` uses `temp || 300`, with 250–350 K mapped to blue. `openViewer` fabricates a terrestrial 288 K world for unknown names. `setupPlanetEffects` assumes atmosphere or rings from a class. The captured Kepler-227 b scene is blue and detailed despite all displayed physical quantities being unknown. |
| D. Data | `data/exoplanets.jsonl` has 9,564 identity/status/score records and no physical fields. The separate 434-world atmosphere index loses uncertainty/reference detail in `compactMeasurement`. Its composite values and spectrum counts must not become direct measurements or detections. NASA's live cumulative record for K00752.01 includes a fitted radius and stellar/orbital inputs; absence from the site's JSONL is an ingestion gap. |
| E. Evidence architecture | Retain the catalogue and identity selection; add controlled NASA snapshots, reviewed supplements, source hashes, parameter sets, runtime validation, and immutable per-object release packets. Every source-backed claim resolves to a specific record or paper. |
| F. Reconstruction | A versioned feature policy precedes renderer allocation. Separate status, appearance eligibility, model availability and GPU quality. Use conditional families and explicit assumptions; no artistic probability score. |
| G. Rendering | New bounded renderer consumes packets, uses a pinned Three backend and resource ownership. Its height field, picking and collision share a deterministic planet-fixed domain. Reuse the existing cube-sphere/domain design, replacing crack-hiding skirts and Earth-specific assumptions where required. |
| H. Backend | Actual r186 pilot rendered identical 8,065-triangle workloads using WebGPU and forced WebGL2. At 960×540 the retained pilot recorded startup 65.7/22.0 ms and p95 5.7/5.7 ms respectively. This establishes feasibility, not advanced-scene performance. Choose Three WebGPURenderer and portable TSL materials, with information-only fallback; avoid replacing the site's r128 globals. |
| I. Terrain/LOD | Existing `forge-terrain.js` has screen-error cube patches and bounded allocations, but relies on skirts, GPU-only displacement and an Earth-radius relief convention. New shared fields require seam tests, neighbour-compatible edges, radius-aware relief, worker generation and camera-relative rendering. |
| J. Atmosphere | Forge has a 20-step Rayleigh integral; it lacks object-specific evidence, physical pressure/chemistry applicability and a declared optical domain. Introduce a bounded hydrostatic/Rayleigh approximation with explicit assumptions and vacuum/domain tests. |
| K. Clouds/haze | Existing 24-step volume and self-shadow sampling are useful references; weather is procedural. New cloud layers need separate weather seeds/clocks, named composition/pressure assumptions and an honest lower-quality proxy. |
| L. Visible colour | The modal's temperature palette is not spectral reconstruction. Add a CIE observer reference, Planck illumination approximation when justified, reproducible exposure and a separate false-colour legend. Unknown reflectance remains explicit. |
| M. Interface/provenance | Current modal lacks cited evidence, status, uncertainty and reproducible exports. Introduce persistent disclosures, parameter/feature sources, scenario comparison, source review time, accessible controls, labelled screenshots and versioned share state. |
| N. Performance | Chrome 152.0.0.0 / Windows / RTX 4090, driver 32.0.16.1074. Legacy live scene at 2560×1215 DPR 1: 2 calls, 8,064 triangles; 329 post-warmup intervals p50 5.6, p95 5.7, p99 5.7 ms. These short baselines do not establish a sustained performance guarantee. New workload gates are separate. |
| O. Deployment | Existing GitLab Windows validate/build/security/Pages/health/IndexNow chain stays authoritative. Cloudflare full DNS setup, Spaceship registrar, proxied website, existing Workers/tunnels; no infrastructure replacement. New static directories must be copied by the actual Pages build. Ordinary builds use pinned sources. Versioned release dependencies must not be mixed by service workers or URL rewriting. |
| P. Roadmap | Establish this audit → freeze evidence contracts → implement F01–F04 and the real database path → one reviewed conditional scenario → rendering/optics/LOD → reproducibility and full fixture gates → mirror CI → GitLab deployment and live smoke. Every capability must document its admitted domain and measured validation. |

## Risk register and ownership

The implementation owner is accountable for WP-A integration, WP-B evidence,
WP-C modelling, WP-D/E graphics, WP-F interface and WP-G release validation.
The work is sequenced around the shared contract; ownership does not imply an
independent human scientific review has occurred.

| Risk | Control / acceptance evidence |
|---|---|
| Catalogue identity or status drift | Match exact KOI/name/host relationships, preserve previous status, review proposed changes, reject ambiguous merges. |
| False precision and composite mixing | Retain source parameter sets, limits, asymmetric uncertainties and fitted/inferred origin. Do not derive unique mass from M sin(i). |
| Rich fiction mistaken for a measurement | Feature decisions and persistent scene/export labels; sandbox is opt-in. |
| Missing pipeline hidden as scientific ignorance | Separate not-ingested, unsupported-model, network and invalid-data states. |
| Old renderer changes break Pioneer | New database-specific class and module boundary; retain legacy loader compatibility tests. |
| New WebGPU shader incompatibility | Portable materials, forced WebGL2 fixture, information-only path, bounded startup and context recovery. |
| Stale requests/resources | Abort signals, generation IDs, worker cancellation, bounded packet/terrain caches and disposal tests. |
| DNS affects other services | Only the five authorised apex CAA records were added. The 132 original Cloudflare rows match exactly afterwards. Both authoritative nameservers publish the new CAA policy; mail's existing Let's Encrypt and edge Google issuer remain allowed. No Workers, mail, app or tunnel settings were edited. |

## Baseline evidence

Captured files are retained in `C:/Users/adyba/adriano-exoplanet-evidence-20260913`:
`baseline-kepler227b.png`, `baseline-frame-timing.json`,
`backend-comparison.json`, `baseline-jest.log`, `baseline-build.log`,
`cloudflare-dns-before.json`, `cloudflare-dns-after.json`,
`domain-baseline.json`, `caa-authoritative.json`. DNS inventories contain public
configuration and are intentionally outside the website publication artifact.
M0 is complete for the inspected integration. Later milestone documents and
validation results must distinguish implemented capability from planned work.
