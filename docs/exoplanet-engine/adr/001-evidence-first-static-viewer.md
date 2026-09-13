# ADR 001 — Evidence-first static database viewer

Accepted 2026-09-13 against production `366fa56e` and the supplied version 1.0
technical specification. See AUDIT.md for code and backend measurements.

The database keeps its existing route, catalogue and selection controls. A new
module-loaded viewer receives stable object identifiers and verified immutable
packets. It can display evidence before a GPU renderer exists. Legacy Three r128
and its Planet3DViewer remain available for existing non-database integrations.

Use the exact npm alias `three-engine@npm:three@0.186.0` locally vendored by the
Pages build. WebGPURenderer, portable TSL materials and a forced WebGL2 path share
the same packet and recipe. Keep a non-GPU schematic/information renderer.
The local backend pilot supports this choice; it does not prove the eventual
volumetric workload's performance. Renderer benchmarking is a blocking gate for
the admitted hardware/quality targets.

Scientific preparation is offline. Reviewed NASA source manifests are immutable.
An explicit refresh job produces proposals; status/model changes are reviewed
before release. Each object packet includes identity, quantities, citations,
claims, alternative solution handles, model policy and content hashes. Hashes
include dependencies. Ordinary builds must not call NASA. The browser loads one
compatible release, validates hashes, and bounds resources and pending work.

Placeholder diagrams are schematic; radius is physical only when its provenance
permits it. Conditional scenario assumptions live outside evidence records.
No preset, camera control or device fallback may alter scientific classification.
There is no arbitrary inference server, new Worker, object store, paid service or
domain routing change. Only the user-authorised apex CAA addition is administrative
scope. The app, mail, webmail, API/tunnel and other services remain protected.

Rejected: routing users into the unrelated Forge demo (wrong product entry),
using spectra metadata counts as evidence of composition, promoting composite
fields to observations, and a custom graphics backend without a measured need.
