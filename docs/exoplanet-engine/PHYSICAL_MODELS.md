# Implemented physical models

Constants are versioned as `SI-2019_IAU-2015_CODATA-2018`. Archive conversion uses
the nominal equatorial Earth radius, nominal solar constants and explicitly
declared SI units. The implementation and independent numeric reference checks
are in `physics.js` and the engine test suite.

| Calculation | Applicability and interpretation |
|---|---|
| Spherical bulk density and reference gravity | Compatible true-mass/radius estimates from one adopted solution; no M sin(i) substitution. |
| Stellar bolometric luminosity | Effective temperature and stellar radius; source values stay distinct from the new derived node. |
| Stellar irradiance | Adopted host luminosity at a named reference separation; not a live orbital ephemeris. |
| Two-body Kepler relation | Known true stellar/planet mass and period, under an explicit two-body approximation. |
| Grey equilibrium guide | Bond albedo 0.3 and global redistribution are explicit assumptions. It does not determine surface temperature or liquid water. |
| Ideal-gas reference scale height | Scenario temperature, molecular weight and reference gravity; distinct from a measured atmospheric thickness. |
| Spherical isothermal hydrostatic profile | Ideal gas, radial inverse-square gravity, 30–3,000 K, μ 2–100, pressure at most 10 bar, reference H/R below 0.025; truncated at 12 reference scale heights. |

Asymmetric reported errors propagate as a conservative endpoint envelope for
eligible monotone calculations. This is not a posterior or a joint confidence
interval. Covariance is not supplied by these selected catalogue rows; it is not
invented. Unavailable uncertainty remains unavailable.

Nine conditional generator families cover airless, scorched, lava, temperate
rocky, icy, ocean, volatile-rich, hot-gas and cooler-gas hypotheses. Their simple
size/temperature envelopes are model applicability checks, not population
probabilities or unique planet classifications. Assumed reference gravity is
visible when compatible true mass/radius inputs do not supply it.

The atmosphere uses molecular Rayleigh scattering and an explicitly assumed grey
aerosol layer. There is no chemical retrieval, opacity-database interpolation,
condensation solver or global circulation claim. Atmospheric species reports
and abundances remain separate from these optical hypotheses. Airless families
have zero atmosphere/cloud generation; gas families have no solid landing plane.

Liquids are opt-in family assumptions. The water family has a bounded simplified
phase envelope; hot lava has a declared thermal-emission model. Fine geology is
procedural, not an inferred location of actual mountains or coastlines.
