# Validation record — 13 September 2026

The source baseline is GitLab main 366fa56e8e71482bee3fd55e2e050503b8adf66f.
The accepted runtime/data release is **2026-09-13-6e7401e7de308492**; manifest
SHA-256 **2323aa895ea2d9976a3db067ac9df4f578bcbfce7b1ea3e04eb4753f76f5993b**.
The manifest pins the exact engine, generator, source, schema and vendor bytes.
The deployed source SHA is stamped by the real Pages build and is mapped by
.gitlab-source-sha in the GitHub validation snapshot.

## Blocking local results

| Gate | Recorded result |
|---|---|
| Existing Jest regression | 11 suites, 82/82 tests passed, including worker-mode acknowledgement starvation and rapid-toggle coverage. |
| Engine science/source/numerical tests | 30/30 passed, including synthetic F01–F22 semantics, real sparse evidence, competing publication solutions, units, limits, missing values, CIE integrals, geometry/picking and balanced transition interpolation. |
| Immutable release validation | 9,584 objects, 28,292 alternate solutions, all indexed hashes/policy/source/runtime dependencies checked. Largest compressed object packet 24,773 bytes. |
| Pages build and artifact authority | 15,197 items, 537.96 MiB. Production audit covers 47 shared-flight pages, 17 classified exemptions and 47 sitemap URLs. Local release/hash/MIME probe passed. |
| Engine, legacy loader and network browser gates | 19/19 passed in 45.8 seconds on the actual built database route. Includes airless/gas/ocean WebGL2, disabled GPU, tampering/cache failure, candidate capture, opt-in sandbox, edited assumption replay, system-frame replay, mobile/Axe and focus restoration. |
| Existing database integration | Both focused catalogue/viewer checks passed; non-database Pioneer suites remain in hosted CI. |
| Lint, dependencies and credentials | Source lint passed; npm audit reports zero vulnerabilities; credential detector self-test and current-tree scan passed. |
| Cold empty-cache startup | Ten fresh contexts at 20 Mbps / 80 ms: 1,966–2,477 ms; p95 2,477 ms. No terrain/renderer downloads on the sparse path. |

The source-only shader harness is excluded from Pages. It supported diagnosis;
it was not used to substitute for the final database integration checks.

## Native graphics evidence

Windows, Chrome 152.0.0.0, NVIDIA RTX 4090, driver 32.0.16.1074. A temporary
2325×1357 browser viewport provides an actual **1920×1080 scene framebuffer**
beside the evidence panel. High, WebGPU, 32 optical steps, exposure 1.

The final 16-second ocean workload covers full-disc day/night limb motion,
low orbit, atmosphere entry and the 50-metre conditional surface reference.
It retained all 2,004 sampled intervals: p50 **5.6 ms**, p95 **18.1 ms**,
p99 **32.4 ms**, maximum **52.8 ms**. The renderer's independently bounded
1,200-frame window reports p95 16.8 ms and p99 33.3 ms. These are short,
focused-window measurements, not a sustained guarantee across devices.

The four HDR targets account for an application estimate of 74,649,600 bytes;
the bounded terrain cache held 312 patches / 7,811,232 bytes, with 150 visible
patches and no pending work at completion. This is not a driver-residency reading.
Native scenario-family, system-frame, limb, local terrain and atmosphere captures
are retained with release/recipe/settings metadata. Source-side profiling reduced
planner peak from 25.3 to 3.2 ms and one geometry transition from 266.3 to 9.2 ms.

Earlier foreground/source runs experienced long presentation delays; the traces
remain available. A prior 1080p atmospheric approach had a 22.2 ms rolling p95,
slightly missing the 20 ms target. The final whole-path p95 passes, while its
32.4 ms p99 and 52.8 ms maximum still show streaming/transition jitter. Lower
presets and dynamic resolution are available; physical phones and integrated
GPUs have not been certified. WebGL2 uses the explicitly documented optical
proxy and was checked at a bounded software framebuffer, not graded as native
WebGPU equivalence. See ADR 003 and KNOWN_LIMITATIONS.md.

## Release evidence and reproduction

The Windows evidence directory is
C:/Users/adyba/adriano-exoplanet-evidence-20260913. Key records include
verified-browser.log, verified-browser/, validate-complete.log,
verified-native-1080p.json, native PNGs, the original audit captures,
source manifests and the before/after DNS inventory. A release result in that
directory records the actual source/MR/CI/Pages identities and public checks
after the corresponding jobs finish. A running job is never a passing result.

Reproduce with npm ci, npm run test:engine, npm run validate:engine, the
existing Jest/lint/security gates, npm run build:pages, and Playwright against
the resulting public/ directory using BASE_URL. Hosted CI runs these engine
gates in addition to the complete existing production and Pioneer workloads.
Accepted source/runtime bytes are protected from Git line-ending conversion.

The automatic post-merge run exposed a latent shared-background acknowledgement
race on the Pioneer page: same-mode worker statistics invalidated an acknowledgement
waiting for two foreground presentation frames. A deterministic test reproduced
the missing marker; advancing its generation only on actual mode changes fixes
the starvation while preserving stale-toggle rejection. The full local 47-page
sweep and both reduced-motion checks pass. A desktop-only host CSS adjustment
also separates the explanatory notice from the schematic canvas caption.
Neither correction changes the immutable scientific runtime/data release above.

Only five authorized apex CAA records were added. The 132 original Cloudflare
records compared exactly unchanged; both authoritative nameservers publish the
new policy. No app, mail, webmail, tunnel, Worker or registrar configuration was
edited. CAA incident-mail delivery was not tested.
