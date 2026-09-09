# Planetary Forge V5 and Fluid Nebula V5

This release replaces the two older graphics demos, repairs Solar System texture
projection, and reuses the Education appearance model for spectrum-linked database
previews. GitLab remains the deployment authority; the GitHub mirror validates a
committed, filtered source snapshot before production publication.

## Rendering boundaries

Planetary Forge generates fictional geography. Its detail is procedural, not a
Google Earth dataset and not a reconstruction of an observed exoplanet surface.
The terrestrial palette includes hypothetical vegetation-like colours; these are
not claims of detected life. Settlement lights are fictional and off by default.

The WebGL2 pipeline contains:

- A screen-space adaptive cube-sphere with 24-cell tiles, bounded allocation,
  continuous spherical geology and conservative crack-hiding skirts.
- Earth-radius-scaled relief, screen-footprint-filtered fine detail, stable
  spherical macro normals, and biome colouring driven by model temperature,
  latitude, elevation and moisture noise.
- Directional lighting, GGX ocean highlights, a 24-step cloud-volume integral,
  cloud self-shadow sampling, and a 20-step Rayleigh atmosphere integral.
- A linear HDR target when supported, multisampling, ACES display mapping and
  sRGB output. Geometry, light and camera vectors use consistent coordinate spaces.
- Pause, reduced-motion and visibility handling. Close-view refinement continues
  while rotation is paused, until the tile budget or screen-size criterion is met.

The CPU preview uses the Education worker and supports generation, palette/sea
level, continental scale, cloud/atmosphere opacity, daylight, rotation and camera
interaction. It does not pretend to provide the GPU terrain or volumetric effects;
unsupported settlement lights are disabled.

Fluid Nebula solves a pressure-projected **2D** velocity and dye field, then
reconstructs depth for a **3D volume rendering**. It is not a full 3D fluid solver,
magnetohydrodynamics calculation, observed nebula, or calibrated spectral retrieval.

- GPU velocity, dye and pressure are 32-bit floating point. A sustained native
  GPU check exposed density loss in a half-float prototype, so RGBA16F is not used
  for simulation state.
- Semi-Lagrangian velocity advection, vorticity confinement, anisotropic pressure
  projection, bounded MacCormack dye correction and pointer-injected impulses.
- Balanced/high/ultra settings use 384/512/768-wide fields, 18/28/44 pressure
  iterations and 24/32/48 volume samples. The framebuffer retains native DPR up to 2.
- Volume emission, coloured extinction, dust attenuation, seeded 3D structure and
  explicitly labelled illustrative emission palettes. The volume boundary fades
  continuously into the star field.
- A worker-based pressure/advection fallback remains interactive without WebGL2;
  its lower-resolution 2D rendering is labelled as a compatibility mode.

## Solar maps and database previews

The previous Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune assets were
disk photographs being wrapped around spheres. Their black surroundings became
black wedges. The replacement maps are complete 2:1 equirectangular images, with
projection guards in both GPU and CPU loaders. Earth retains its independent NASA
2K/5.4K surface and cloud maps.

The seven unmodified Solar System Scope maps and their SHA-256 hashes, dimensions,
CC BY 4.0 attribution and limitations are recorded in
`data/planet-texture-provenance.json`. These are illustrative, observation-informed
composites; gas-giant maps show atmospheric appearance, not solid surfaces.

The database preview worker calls the same `PlanetaryAppearanceModel` surface and
cloud generation functions used by Education. It loads visible cards lazily and
caches the resulting images. Only planets with published spectrum metadata in the
snapshot receive model previews; others retain explicitly generic placeholders.
The archive metadata does not contain vetted species-abundance retrievals, so no
species detections or measured geography are fabricated.

## Navigation and search policy, checked 9 September 2026

Build-time navigation is extracted from the homepage rather than maintained as a
second database design. An explicit exemption map keeps immersive tools and
Education independent. The evidence registry is collapsed initially, has a visible
world/spectrum count, and expands without a nested scroll container.

The current search changes are deliberately scoped:

- Publish Dataset/DataDownload metadata for the real downloadable NASA archive
  snapshot, including provenance and variables, following the
  [Google Dataset guidance](https://developers.google.com/search/docs/appearance/structured-data/dataset).
- Make the two substantive V5 tools indexable with accurate WebApplication
  metadata and canonical URLs; include them in the sitemap. Other experimental
  tools retain their existing noindex policy.
- Use the existing true 192px-square PNG for the favicon. The older `.png`/`.ico`
  favicon paths contained JPEG bytes. Audit the actual signature and dimensions,
  as well as the generated markup, against the
  [favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search).
- Retain the working IndexNow JSON submission after the production health gate.
  No legacy SOAP or POX endpoint is used; see
  [Bing URL submission guidance](https://www.bing.com/webmasters/help/URL-Submission-62f2860b).
- Google's [8 September regional search documentation](https://developers.google.com/search/updates)
  covers eligibility-dependent commercial experiences. This fictional astronomy
  site must not invent real travel inventory, merchant offers, reviews or prices
  to qualify. A preferred-news-source widget is not appropriate to these tools.

## Regression gates

`tests/forge-v5.test.js` verifies map bytes/dimensions, shared-header scope, bounded
LOD refinement and disposal, the actual CPU pressure solver, pointer coordinates,
and cloud-alpha/daylight behavior. `tests/e2e/forge-v5.spec.js` exercises real GPU
compilation, CPU fallbacks, controls, previews, navigation, search metadata and
rendered accessibility. GPU functional tests use a bounded software-rasterizer
viewport; native-resolution visual and frame-pacing checks are separate evidence.

The existing full production, Education HD, all-page desktop/mobile and
accessibility suites remain enabled. The release also raises the Vitest patch
floor to 4.1.11 and updates js-yaml to 3.15.2/4.3.2 for the advisories published in
the [Vitest](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) and
[js-yaml](https://github.com/advisories/GHSA-2883-xcg3-v3hh) advisory records.
