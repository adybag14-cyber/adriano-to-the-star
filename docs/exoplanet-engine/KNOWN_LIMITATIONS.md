# Scientific and operational limits

This engine renders conditional, reproducible reconstructions. It does not know
unobserved continents, weather, surface pressure, rotation, moons, rings or life.
The current evidence is a reviewed subset, with explicit coverage metadata.

The atmospheric implementation is a bounded single-scattering, isothermal,
hydrostatic approximation with assumed optical properties and grey aerosols.
WebGPU samples the optical paths; WebGL2 uses the documented depth-tested cloud
shell and optical-depth limb proxy in ADR 003. Backend quality does not change
the evidence or selected scenario. WebGL2 is not volumetrically equivalent.
It is not a general chemistry/condensation model, opacity-table retrieval,
multiple-scattering solver, global circulation model or photochemical inference.
Those modules require additional vetted data and domain validation before their
outputs can be admitted. Missing molecular abundance/vertical structure remains
missing, even where a species is reported in spectroscopy.

Conditional families are not posterior samples and have no percentage ranking.
The renderer does not promote its current simple models to
`observation_constrained` solely from catalogue confirmation or spectrum metadata.
Broad-band albedo constraints support only the declared conditional colour
approximation; transmission and emitted/reflective observables stay separate.

Terrain processes are procedural morphology approximations. Picking and geometry
share a field, but this does not make the field an observed terrain map. Gas
objects use an explicitly assumed opaque pressure/radius reference and provide
no solid ground. System views use a reference separation and labelled orientation,
not a verified current ephemeris or remote sky survey.

The public claim/status review is an engineering source/provenance review.
Publication history and alternative fits are retained, but a complete literature
census and independent observational reanalysis are not claimed.

Scientific Workstation is an expensive rendering/capture preset, not a statement
of greater scientific certainty. Physical phone/integrated-GPU performance is
unverified unless a device-specific result is added to VALIDATION.md. The native
desktop, compatibility and layout evidence are kept separate.

Citation reachability and claim validity are distinct. A later unreachable link
does not retract a reviewed claim; source maintenance uses the configured review
job and pinned metadata. CAA incident-report delivery to the requested mailbox
was not tested because mail administration is outside this task's boundary.
