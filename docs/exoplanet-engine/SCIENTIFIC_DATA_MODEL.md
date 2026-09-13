# Scientific data model

Version `1.0.0` is defined by `exoplanet-engine/contracts.js` and the structural
schema in `schemas/exoplanet-engine-1.0.0.schema.json`. The runtime validator adds
graph and physical-domain checks which JSON Schema alone cannot establish.

Each envelope contains an object, an existence assessment, citations, accepted or
qualified claims, quantities, parameter sets, derived model runs and a render
packet. Non-unverified existence classifications require accepted supporting
claims. Production data reject explicitly synthetic fixtures and test URLs.

Quantities have an explicit dimension and definition. A known quantity is
observed/fitted, derived, or inferred. An unknown quantity has a null constraint
and a missing reason. Limits, intervals, distributions and asymmetric error
magnitudes remain distinct. Missing errors never become zero errors.

Original archive values, units, uncertainty signs, columns and limit flags are
retained alongside normalized SI values. Published inference provenance is
represented as an imported publication/model, not an invented executable run.
An inferred population mass and a minimum mass cannot become a measured true
mass merely because an archive supplies the field.

Kepler KOI identifiers distinguish siblings sharing one KIC host. The PS join
uses the archive's explicit Kepler name association; inconsistent names are
rejected. Alternative publication solutions are separate complete parameter
sets. Selecting one replaces its physical inputs without changing the current
reviewed existence status. Measurements are not cherry-picked between rows.

The extra `false_positive` status preserves the actual KOI disposition. It is
different from a retracted paper; see [ADR 002](adr/002-catalogue-and-model-boundaries.md).

The graph is:

`snapshot → catalogue/paper citation → claim → quantity → calculation/assumption
→ recipe → feature decision → renderer/capture`.

Raw source hashes, queries, retrieval/review dates and software hashes are
included in the release. Parent source nodes remain available when a new derived
quantity is added. Geological detail traces to its generator and assumptions,
not to a molecular-detection paper.
