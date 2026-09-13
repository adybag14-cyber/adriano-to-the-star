# ADR 003 — Bounded WebGL2 optical proxy

The software WebGL2 test reached renderer readiness in roughly 300 ms but its
first complete atmospheric frame stalled past a two-minute limit, even at a
104×48 framebuffer. Isolating render passes identified the volumetric optical
pass. Removing that pass alone completed in under a second, establishing the
actual failure boundary; unit or initialization success was not treated as a
rendering pass.

WebGPU retains the sampled atmosphere/cloud transport. The tested WebGL2 path
uses depth-tested cloud layers and an optical-depth-scaled limb approximation
from the same recipe, gas density, pressure/radius reference, illumination and
weather seed. It retains an opaque cloud deck rather than falsely revealing a
clear surface. The approximation is named in diagnostics and does not change
existence, scientific appearance mode, adopted data or assumed composition.

The isolated compatibility test with both cloud and atmosphere proxies rendered
in approximately 680 ms and captured in approximately 724 ms on the declared
software functional viewport. These are functional timings, not native-resolution
performance claims. Both layers are asserted in the blocking browser suite.

Future improvements to WebGL2 transport require a measured, complete-frame
comparison against this fallback and the same scientific/lifecycle gates.
