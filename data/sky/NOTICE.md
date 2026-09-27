# Observer sky: sources, licence and limits

## HYG-derived stellar data — CC BY-SA 4.0

`bright-nearby-v1.json` is an adapted subset of **HYG 4.2**, compiled by **David Nash / Astronomy Nexus** from Hipparcos, the Yale Bright Star Catalogue and Gliese, with subsequent corrections. This adapted data file is licensed **Creative Commons Attribution–ShareAlike 4.0 International**. The licence applies to this data derivative, not as a claim over unrelated site code.

Source: https://www.astronexus.com/projects/hyg
Source fields and caveats: https://www.astronexus.com/projects/hyg-details
Original download: https://www.astronexus.com/downloads/catalogs/hygdata_v42.csv.gz
Licence: https://creativecommons.org/licenses/by-sa/4.0/

Changes: select catalogue V magnitude <= 7 or a usable distance <= 30 pc; retain the Sun separately as HYG row 0 absolute-magnitude photometry for extrasolar viewpoints; retain source IDs, coordinates, linear velocities, magnitudes and B–V indices; round numerical output; use a columnar JSON representation. Source retrieval time and SHA-256 are recorded in the JSON. Distances at or beyond HYG's 100,000 pc missing/dubious-parallax marker are **not** treated as measured distances. Those rows retain angular directions and angular proper motion only, and are excluded when the observer leaves the Solar neighbourhood.

The source is heterogeneous and contains historical catalogue errors and uncertain distances. It is not a complete modern Gaia catalogue. A source-selected subset that looks complete to a limiting magnitude near the Sun is **not complete from an exoplanet**, because stars faint from Earth can be bright there and are absent from this subset.

## Geometry and time

Stellar Cartesian axes are J2000 equatorial: +X towards RA 0h, +Y towards RA 6h, +Z towards the north celestial pole. Distances are parsecs, velocities parsecs per year, and catalogue epoch J2000.0. The browser applies linear catalogue velocities, subtracts the observer position, normalizes the resulting sightline, and updates magnitude with the inverse-square distance law. It does not rotate the stars arbitrarily or exaggerate parallax. Stellar point colours approximate the reported B–V index; point size and halo are display choices, not resolved stellar disks.

Solar System observer positions use JPL's **Table 1 approximate elements**, restricted to 1800–2050. “Earth” uses the Earth–Moon barycentre approximation, matching the published elements. The UI accepts a UTC calendar day at noon as an approximation to the TDB argument; it is not a precision ephemeris. The formula is independently checked against saved geometric JPL Horizons ICRF vectors at three TDB epochs. These checks validate the implementation within a stated educational tolerance, not navigation-grade accuracy.

JPL elements and expected accuracy: https://ssd.jpl.nasa.gov/planets/approx_pos.html
Horizons API: https://ssd-api.jpl.nasa.gov/doc/horizons.html

The view is an inertial space-surrounding observer, not a view from a specified latitude, longitude or planet surface. It omits atmospheric refraction, horizon masking, precession into a date-dependent equatorial frame, aberration, relativistic light deflection, gravitational acceleration, light-time reconstruction, extinction changes and intrinsic variability. Solar System parallax differences are often much smaller than one display pixel. The displacement metric is a geometric calculation, not a claim of that measurement precision.

Exoplanet observer locations use the adopted archive host RA, declination and distance, fixed to the catalogue solution. The host's uncertain distance, full motion, planet orbital phase and surface observer location are not reconstructed. When a matching HIP host identity is known, the local host is excluded from background stars rather than rendered as a coincident point.

## Andromeda / M31 is an explicit evidence-limited mode

**PA-99-N2 b is catalogued as a candidate**, not a confirmed extragalactic planet. Its Paris Observatory entry supplies coarse host coordinates and a 670,000 pc distance; it does not supply a resolved 3D neighbourhood of M31 stars, a surface map, an atmospheric composition or an orbital phase.

Candidate record: https://exoplanet.eu/catalog/pa_99_n2_b--556/

The M31 mode relocates the available Solar-neighbourhood catalogue only. Those stars generally become too faint for the chosen visual limit. No fictitious local M31 stars or planet surface are substituted. An empty local field expresses **missing local data**, not an assertion that no stars exist in M31. Published pixel-lensing candidate models and an artist's imagined view are not observational sky maps.

## Reproduction

Run `python scripts/update-observatory-data.py --refresh --cache-dir <cache>` to propose an explicitly refreshed snapshot. Ordinary builds validate the checked-in data offline and do not silently change it. The generated files preserve source URLs, hashes, retrieval times, units and scope. `tests/observatory` checks units, frames, exact geometry, visibility and source integrity. Renderer screenshots are separate from these scientific tests.

The Sun is included as an unresolved background star from extrasolar observers using HYG row 0 absolute V magnitude and colour. The foreground solar disk and its glare are not rendered in the Solar System stellar-background layer. This avoids applying the Sun’s Earth apparent magnitude to a distant observer.
