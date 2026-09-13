# Rendering, coordinates and resources

The exact Three.js `0.186.0` WebGPURenderer and portable TSL material code are
bundled with each engine release. WebGL2 can be forced using `backend=webgl2` for
compatibility validation. An accessible 2D schematic requires neither backend.

The render graph owns four bounded HDR targets:

1. Opaque terrain/gas reference layer and eligible liquid.
2. One combined optical transport pass, stopped by opaque depth.
3. Neighbourhood-clamped temporal accumulation.
4. ACES exposure and sRGB presentation.

The transport pass evaluates Rayleigh and assumed aerosol extinction once. It
includes a bounded solar path and cloud self-shadow estimate. This is a named
single-scattering approximation, not arbitrary-chemistry multiple scattering.
WebGL2 uses depth-tested cloud and atmosphere proxies instead of this sampled
transport, as measured and bounded in ADR 003. The other passes and the scientific
state remain shared.
The thermal/infrared/temperature views are labelled analytical outputs with a
uniform scenario field; they do not invent a measured spatial temperature map.

Above 1.02 reference radii, body and liquid fragment depth use a common curved
reference along the actual camera ray. Terrain radius includes the interpolated
height. This removes the coarse chord grid from atmospheric columns and the
intersection of separately tessellated liquid and land. Local views use streamed
mesh depth. It is a declared curvature approximation, not a new terrain field.

Terrain is a six-face cube sphere with 16-cell patches. A continuous double-
precision planet-fixed field produces height, colour, normals and picking. A
worker generates each patch. Coarse-neighbour edges interpolate the matching
coarse grid. There are no skirts hiding inconsistent seams.

The manager waits for a complete compatible frontier before replacing visible
patches. A shared 260 ms transition clock interpolates from the previous frontier.
Screen-error refinement has hysteresis, finite cache/residency budgets and at
most eight pending requests. A parent/coarse frontier remains visible while
finer work completes. Camera collision uses the same physical height/reference
field, including the liquid level when present.

The planner evaluates each tile score once per plan. Transitions use a spatial
index for the previous frontier and retain unchanged buffers. Native profiling
reduced planner peak from 25.3 ms to 3.2 ms and a transition from 266.3 ms to
9.2 ms on the recorded workload; these CPU timings are not whole-frame rates.

GPU tile positions are local to an anchor, translated relative to the camera
using CPU doubles. Catalogue distances are never placed in the local GPU frame.
A separate AU frame represents the host and object at a supported reference
separation; orientation/phase remain labelled schematic. Camera approach changes
scale with a smooth transition and has keyboard/touch alternatives and reset.

Presets change sampling, framebuffer size and patch budgets, not evidence,
chemistry, status or geological identity. Weather has its own seed and simulation
clock. It does not claim the object's current remote weather.

Close and replacement dispose geometry, targets, materials, workers, requests
and animation callbacks. Failed initialization retains the evidence interface
and exposes a compatibility retry. Workstation captures can accumulate 32
deterministic samples with weather paused for the capture.

Refinement transactions balance neighbouring levels before committing within the preset budget. The surface field includes metric relief bands down to 16 m, and a periodic metric frame supplies filtered 0.25 m normal detail. Analytical noise gradients avoid derivative-of-derivative artifacts. Screen-space passes use the renderer's top-left coordinate convention; a near-surface sky/ground regression guards orientation on the compatibility backend. Paused scenes stop drawing after their preset convergence budget and resume on camera, LOD, exposure or quality changes.
