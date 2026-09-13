# Performance and hardware scope

The reference desktop is Windows, Chrome 152, NVIDIA RTX 4090, driver
32.0.16.1074. M0 includes its actual r128 scene and r186 backend feasibility
measurements. Those short baseline workloads are not the final rich-scene result.

Release targets:

- Useful identity/evidence/schematic within 3 s at p95 under 20 Mbps / 80 ms RTT.
- High at 1920×1080: 60 fps target, p95 delivered frame interval ≤20 ms.
- Input feedback target below 100 ms at p95.
- Per-object metadata ≤250 KB compressed; the complete corpus is not a startup payload.
- A placeholder makes no terrain/atmosphere/renderer asset requests.
- Bounded cache and allocation behavior over repeated object/scenario changes.

| Preset | Maximum pixels | Visible patch budget | Transport steps |
|---|---:|---:|---:|
| Low | 1,000,000 | 54 | 12 |
| Medium | 1,600,000 | 96 | 20 |
| High | 2,600,000 | 150 | 32 |
| Ultra | 4,400,000 | 225 | 48 |
| Scientific Workstation | 8,300,000 | 300 | 80 |

Diagnostics report frame interval percentiles, startup, framebuffer, patch counts,
pending requests, application allocation estimates and the exact scene state.
Driver GPU memory residency is not exposed as a falsely precise measurement.
Background/unfocused intervals are not presented as focused-window benchmarks.

The automated software-GPU suite uses an explicit 640×480 CSS viewport at DPR
0.25 for functional coverage of the WebGL2 proxies, terrain shaders and controls. It does not claim
phone or native-resolution performance. The mobile viewport checks are layout
and accessibility tests, not measurements on a physical phone or integrated GPU.
Final native workload evidence and any missed targets belong in VALIDATION.md.
