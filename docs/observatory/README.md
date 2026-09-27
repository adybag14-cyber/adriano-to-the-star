# Observatory atlas upgrade

This branch updates the existing static site. It does not migrate the application to Next.js, add another WebGL context, or deploy production. GitLab remains the canonical source; GitHub remains a filtered CI snapshot. A GitHub merge alone is not evidence that the production website changed.

## Catalogue and evidence

The release pointer is `data/observatory/current.json`. The 2026-09-27 snapshot contains **16,180 conservatively matched catalogue entries**, not 16,180 independently confirmed planets. Source memberships overlap:

| Source | Records | Scope |
|---|---:|---|
| NASA Planetary Systems default solutions | 6,372 | All discovery facilities, including non-NASA observatories |
| NASA cumulative Kepler Objects of Interest | 9,564 | Confirmed objects, candidates and false positives |
| Paris Observatory official CSV | 8,299 | The export currently returns Confirmed entries under the catalogue's broader substellar inclusion criteria |
| Individually reviewed Paris M31 entry | 1 | PA-99-N2 b, explicitly a candidate |

Thirty-three disagreements between source dispositions remain **DISPUTED**. Thirty ambiguous alias matches remain separate. Therefore the total is a conservatively matched index, not a perfectly deduplicated census. A provider/institution filter describes the archive supplying a record; the discovery-facility filter is separate. An archive name is not automatically a telescope or follow-up institution.

Identity uses exact planet-level names or explicitly published aliases, never just KEPID, host name, proximity or a fuzzy name. Upper-case companion designators and lower-case planet letters remain distinct. Two distinct objects from the same source cannot silently collapse through an alias. A regression covers `HD 3651 b` versus `HD 3651 B`.

The index adopts one complete physical-parameter solution: NASA PS default when available, otherwise the original source solution. Missing values remain missing; upper/lower limits are not presented as exact estimates. The source-evidence dialog retains original units, uncertainties, limits, mass provenance, source references and dispositions. Jupiter-to-Earth conversion uses the declared IAU nominal equatorial-radius and mass-parameter ratios. Minimum mass is not silently called true mass. An Earth-sized classification is not a habitability assessment.

New objects without a separately reviewed appearance packet open **View evidence**, not an invented 3D surface. Existing reviewed engine packets continue to work. If the new catalogue cannot be verified, the UI explicitly says that only the older Kepler snapshot is available.

### Source credits and licence

NASA Exoplanet Archive is operated by the California Institute of Technology under contract with NASA, within NASA's Exoplanet Exploration Program. Planetary Systems table reference: DOI **10.26133/NEA12**.

- NASA archive: https://exoplanetarchive.ipac.caltech.edu/
- PS schema and parameter provenance: https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html
- KOI identity and Robovetter-score definitions: https://exoplanetarchive.ipac.caltech.edu/docs/API_kepcandidate_columns.html
- Paris Observatory Extrasolar Planets Encyclopaedia: https://exoplanet.eu/catalog/
- Paris official CSV: https://exoplanet.eu/catalog/csv/
- Paris catalogue material is attributed under **CC BY 4.0**: https://creativecommons.org/licenses/by/4.0/
- M31 candidate record: https://exoplanet.eu/catalog/pa_99_n2_b--556/

The derivative index records the adaptations above. Original source URLs, retrieval timestamps, raw SHA-256 hashes and exact compressed NASA/Paris inputs are retained in the immutable release. Source inclusion is not an endorsement or a claim that competing catalogues use the same planet definition. The Paris bulk CSV is not a complete list of its candidates, controversies or retractions.

## Observer-dependent sky

`sky-math.js` is deterministic, renderer-independent geometry. The sky contains **18,796 HYG 4.2 stars** selected by source visual magnitude <= 7 or a usable distance <= 30 pc. Of these, **431** have only angular directions because their distance is missing or dubious. They are not assigned an invented distance. The derivative is attributed to David Nash / Astronomy Nexus under **CC BY-SA 4.0**; full notices and limitations are in [data/sky/NOTICE.md](../../data/sky/NOTICE.md).

The browser applies catalogue linear stellar motion, subtracts the observer position, calculates the line of sight, and updates apparent brightness by distance. Solar observers use JPL Table-1 approximate orbital elements, including the Earth–Moon barycentre approximation. The user-facing UTC calendar day at noon approximates the ephemeris time argument. This is not a precision navigation ephemeris or a surface-horizon simulator.

Exoplanet geometry selects one complete, separately attributed RA/declination/distance bundle. It never silently mixes axes from different solutions. For example, where the default PS physical solution lacks distance, a complete Paris coordinate bundle can be used for the sky without filling the missing physical parameter in the database. The 9,096 observer bundles retain exact catalogue IDs so ambiguous names cannot silently select an unrelated position.

JPL Horizons geometric ICRF vectors independently validate all eight Solar observers at three TDB epochs. Raw responses, request parameters and hashes are checked in under `tests/observatory/fixtures`. Tests also cover one AU at one parsec, handedness, distance modulus, unknown parallax, zero/coincident vectors, host identity and date bounds.

A Solar-selected catalogue is incomplete from another star system. Local Andromeda stellar positions/depths are not available in this dataset. **PA-99-N2 b remains a candidate.** Its evidence-limited mode relocates only the available Solar-neighbourhood stars, which become too faint at the visual limit; it does not invent an observed M31 local sky or planet surface. The explanatory panel states that missing local data does not imply an absence of stars in Andromeda.

## Visual and performance architecture

The existing Three.js planet stays intact. Shared enhancements use restrained original SVG spacecraft, orbit guides, header traces and CSS transforms. There is no additional framework or WebGL context. SVG ornament is explicitly illustrative, not live telemetry. The database and Systems Atlas share the same readable visual treatment.

The sky uses an on-demand 2D layer. Astrometry runs on observer/date changes, not every animation frame; camera changes redraw projected directions. Planet rotation uses elapsed time rather than frame count. Reduced motion and the persistent Pause motion control stop automatic education GPU rendering; manual controls and completed texture loads still invalidate one frame. The unrelated decorative random-star field is disabled on Education. Offscreen/hidden decorative motion pauses, and source dialogs and controls retain keyboard focus and visible focus indicators.

A richer catalogue necessarily adds download/parse work. This branch does not promise literally zero performance cost. It records actual byte counts, long tasks, loading timings, raw RAF intervals, hardware renderer strings and education render counters. RAF cadence is not the same as GPU FPS, and a shared CI runner is not a user's GPU.

## Reproduction and review

Install the existing locked dependencies and Chromium. No new npm dependency is required. Python 3.12+ and FFmpeg are used for source validation and GIF encoding.

```sh
npm ci
npx playwright install chromium
npm run test:observatory:science
pwsh ./build-pages.ps1
python -m http.server 8097 --bind 127.0.0.1 --directory public
# In another terminal:
npm run test:observatory:browser
npm run capture:observatory -- --all-pages
```

Set `FFMPEG_PATH` when FFmpeg is not on PATH. The candidate tests are restricted to a loopback artifact server. The capture tool uses a fresh unauthenticated browser and blocks methods other than GET/HEAD/OPTIONS. It never submits claims, forms, purchases or production writes.

Open `.artifacts/observatory/candidate/index.html` for the browsable PNG/GIF gallery, and `metrics.json` for raw measurements and failures. PNGs freeze decorative animations for inspection. GIFs are 24 sampled frames encoded at **5 fps for presentation**; that playback rate is not a rendering benchmark. Performance sampling runs separately before screenshot capture. Failure screenshots, traces and videos are retained by the browser-test report.

GitHub CI builds on Windows, then passes that exact Pages artifact to Linux browser/visual jobs. Existing tests, lint, credential and dependency gates remain enabled. The Actions summary links the downloadable HTML gallery, GIFs, metrics and traces. A separate manual/daily production workflow runs the read-only capture against the public website; its daily schedule becomes active only after the workflow exists on the default branch.

```sh
# Explicit read-only audit of the currently deployed website:
node scripts/capture-observatory.mjs --production --all-pages

# Explicit data refresh; never run silently by normal builds:
python scripts/update-observatory-data.py --refresh --cache-dir .cache/observatory

# Independent reference refresh, also explicit rather than ordinary CI:
python scripts/fetch-sky-reference.py
```

An upstream schema, count, identity or hash failure blocks release advancement. Ordinary builds validate the checked-in snapshot offline and fail before publication if it is inconsistent. Review fresh source changes and scientific limitations before committing a refreshed release.


## Additional visual-review and loading regressions

The catalogue institution/facility controls are placed **before** the long results list, including after the legacy database layout rearranger runs. The page subtitle is updated in all ten existing languages, and the hero count is read from the verified manifest. The first-visit music player starts compact without removing playback or a saved user preference. The M31 candidate evidence panel is anchored to the viewport, not to the short absolutely positioned Education body; a browser assertion checks its on-screen bounds.

Deep-linked source evidence is prioritised ahead of the background multi-institution search index. The original ten-cold-context, 20 Mbps / 80 ms test retains its three-second p95 gate. The checked-in `evidence/cold-evidence-timing.json` records the passing measured run; it is a run-specific result, not a universal latency guarantee.

The HYG solar reference is retained separately from the 18,796 background entries. From an extrasolar observer, the Sun is included using source absolute magnitude and the calculated distance modulus when it is bright enough. The Solar System foreground solar disk and glare are not rendered by the stellar-background layer.

The Starsector menu route intentionally hands off to the separately hosted StarsectorQuick application. Visual auditing validates that exact destination instead of incorrectly requiring the local site's CSS on an external application. Unexpected cross-origin navigation still fails.

Numeric designators are matched as complete tokens, so a search for Kepler-227 does not pick unrelated KOI-2271 aliases. The source-evidence dialog preserves the selected object in the URL and restores focus/clears the selection on close. Both desktop and phone tests cover this path.

The filtered GitHub snapshot validates every published catalogue and sky hash after copying Git objects, and exact-byte data attributes protect those hashes from platform newline conversion.

Final hosted-image review also moves the Education floating preferences outside the desktop sidebar. On phones the planet-evidence panel starts compact and can be expanded with an explicit, keyboard-accessible button; all original facts, source links and disclosure IDs remain intact. The open mobile controls drawer hides the external floating preferences to prevent overlap. Desktop evidence remains expanded. Both viewport contracts have browser regressions.

The full hosted suite also checks real center-point hits for Pioneer mobile HUD commands. Its site motion preference is mounted inside the existing optional data-tools panel rather than overlaying Return to Hub or touch controls. The note explicitly distinguishes decorative motion from pausing the colony simulation; existing hit-target tests remain unchanged and additional placement assertions were added.

The retained 23-file production browser suite is distributed across three independent GitHub runners with `fail-fast: false`, keeping every test file and the same assertions. Existing preflight gates run once on shard 1. Each shard uploads separately named failure evidence and a Playwright blob report, avoiding artifact-name collisions and making a slow or failing section visible without cancelling other coverage.

The stable aggregate check named Linux Chromium production artifact smoke requires every shard to succeed, preserving a single approval gate rather than allowing partial shard success.
