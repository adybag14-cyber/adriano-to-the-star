# Source and review policy

The accepted 13 September 2026 inputs are:

- NASA Kepler cumulative table: 9,564 records, including dispositions, fitted
  transit properties and stellar-model context.
- NASA Planetary Systems: 28,424 reference-specific rows for Kepler objects and
  the explicitly named reference hosts. Composite rows are not used as joint fits.
- NASA spectra table: 154 metadata rows for the named characterisation targets.
- Reviewed visible albedo constraints for HD 189733 b, from Evans et al. (2013).
- Reviewed WASP-39 b chemical-report metadata and 263 selected published NIRISS
  bins from the authors' data repository at
  `0608071e1e70ec7ff12707774ea03ace4b52ea85`.

The NASA raw responses are stored as deterministic gzip files. Accepted manifests
record both raw and compressed SHA-256 hashes, exact queries, adapter version,
row counts, retrieval time and review basis. The source import was an engineering
review of catalogue semantics and provenance, not an independent reanalysis of
the original observations or a claim of exhaustive literature coverage.

Every source-backed object has a specific catalogue query URL, rather than a
homepage citation. Publication links from PS are retained as related references.
Full bibliographic metadata are supplied for the individually reviewed papers.
All imported text is rendered as text; source links must pass URL validation.

The source refresh workflow runs in the GitHub validation mirror, produces a
proposed snapshot and review artifact, and has no write permission to publish
data or deploy the website. It runs weekly and supports an explicit manual run.
Changed identity/status, parameter choices and epistemic meaning require review
before an accepted manifest is replaced. Normal builds do not fetch upstream data.

The archive's spectral table exposes metadata through TAP; the samples have a
separate interface. Its interactive sample download failed during this work.
The NIRISS publication's own pinned MIT-licensed repository supplied the imported
sample data. The import retains order/quality selection, half-widths and errors.
It does not substitute a transmission spectrum for reflected visible light.

Primary service definitions: [NASA TAP](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html),
[PS definitions](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html),
[KOI definitions](https://exoplanetarchive.ipac.caltech.edu/docs/API_kepcandidate_columns.html),
[spectra definitions](https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_columns.html).
