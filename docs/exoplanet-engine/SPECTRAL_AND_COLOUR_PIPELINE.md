# Spectral and display pipeline

`colour.js` loads the original CIE 1931 two-degree, 1 nm observer table, verifies
its SHA-256, and integrates radiance with explicit metre wavelength units and
normalization. XYZ is converted to linear sRGB. Display exposure is separate
from the physical record; the renderer applies a declared ACES/sRGB output path.
There is no hidden adaptation that neutralizes the host's stellar colour.

Supported stellar effective temperatures use a named blackbody approximation.
Unknown illumination uses labelled schematic inspection lighting. Lava emission
uses Planck radiance with a common scene normalization. The spectrum and display
assumptions are retained in diagnostics and replay state.

The full 1 nm calculation is a reference. Tests compare a reduced 5 nm integration
against it over named temperatures, test zero radiance and invalid exposure, and
check expected warm/cool stellar colour behavior. These checks do not establish
that an unobserved exoplanet's material spectrum is known.

The HD 189733 b supplement retains the published 290–450 nm geometric-albedo
estimate and 450–570 nm upper limit with their reported one-sigma semantics.
A conditional Lambertian/broad-band material approximation uses those inputs;
unobserved wavelengths, upper-limit realisation, phase and spatial patterns stay
explicit assumptions. Geometric albedo is not silently treated as an observed
high-resolution material reflectance map.

WASP-39 b's NIRISS spectrum is a transmission-depth observable. Its plotted bins,
errors, quality selection and pinned repository source are inspectable. The
published model's normalized residual RMS is only a diagnostic under the stated
interpolation/independence approximation; no fit probability is inferred.

Human Vision, Astronomical Observations, Infrared, Thermal, Spectral Composition,
Atmosphere, Temperature and Confidence/Uncertainty remain separate controls.
Unavailable data/model combinations explain their absence. Simulated 8–14 µm
radiance and bolometric flux have named units and never claim to be telescope
images or directly measured surface temperatures.

References: [CIE dataset](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer),
[PBRT colour reference](https://pbr-book.org/4ed/Radiometry,_Spectra,_and_Color/Color),
[Evans et al.](https://arxiv.org/abs/1307.3239v1),
[NIRISS publication](https://www.nature.com/articles/s41586-022-05674-1).
