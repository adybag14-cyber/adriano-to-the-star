# Website and Pioneer release audit — 4 September 2026

## Scope and acceptance

Audit all 47 governed pages and 17 renderer/redirect exemptions. Inventory visible
actions, verify navigation/anchors/assets, and exercise meaningful action outcomes
with desktop/mobile screenshots and error collection. An inventory is not proof
that every external service or every game state works. Record untested and
environment-dependent outcomes explicitly.

Upgrade Pioneer with a deterministic streamed universe, persistent discovery and
travel, bounded resident data, coherent cinematic stars/nebula/planetary lighting,
adaptive graphics, and a stable runtime lifecycle. Preserve existing saves and
colony, building, combat, trading, science, and system-exploration flows.

No Man's Sky and EVE Online are artistic and scale references. Procedurally
addressable worlds do not imply equivalently authored content, an MMO population,
or a shared server economy. Verify the supported scope through actual play.

## Workstreams

- [x] All-page browser inventory, visible action audit, and outcome repairs (final artifact retest below).
- [x] Deterministic streamed sectors and complete travel/save flows.
- [x] Coherent starfield, nebula, atmosphere and quality-controlled rendering.
- [x] Runtime lifecycle, integration, HUD controls and player-facing experience.
- [ ] Exact Pages artifact, regressions, screenshots, accessibility and performance.
- [ ] GitHub mirror CI at the final canonical SHA.
- [ ] GitLab Pages deployment, public asset SHA and Chrome production verification.

## Release constraints

GitLab `adybag14-group/starisdons` is production authority. GitHub
`adybag14-cyber/adriano-to-the-star` is the filtered validation mirror. Run GitLab
CI only for a release after GitHub passes. Use free static-compatible features.
Mail, inference, Wrangler, tunnels and other domain services remain out of scope.
Keep the existing production artifact serving until the validated Pages update.

Initial source: `8a351bcb4ddea657314669360b5ac1927f063931`.
Existing untracked `tmp/` contains prior paper inspection artifacts and is preserved.
Evidence is written under `.artifacts/audit-20260904/`.

## Findings and implemented repairs

The baseline enumerated 64 routes and 2,146 visible controls, with 192
top/middle/bottom captures. Every capture was visually reviewed. This is a route
and action inventory; it is not a claim that all 2,146 actions were independently
executed in every state. Shared controls and selected page-specific workflows
have separate final-effect assertions.

- Database: removed the 60-record atmosphere-model limit with filtering and
  pagination; fixed sibling KOI identity through Details, Save, Compare, Claim,
  3D and export; restored saved-label synchronization after filtering.
- Shared UI: fixed Escape handling for native dialogs and skip-link targets;
  checked repeated Spanish/English switching, theme, atlas and music controls.
- Experimental labs: repaired the absent-WebGPU branch, particle indexing,
  dispatch size, sliders, resize and pause in Nebula; made radio knobs accessible
  and functional; bounded logos and the telemetry status rail so controls remain
  reachable; explicitly disabled unsupported galaxy GPU actions.
- Calendar and counters: exported the feed class required by calendar startup,
  retained dated snapshot history, supplied source timestamps and links, refreshed
  the sidebar, and corrected local dashboard/analytics/badge state display.
- Pioneer runtime: fixed 60 Hz simulation with one RAF owner; bounded catch-up;
  suspended survival time while hidden; continued camera rendering while paused;
  foreground frame-time percentiles; responsive full-planet camera framing;
  failure-aware saves; functional recruitment; actual sourced archive review;
  non-blocking idle observation and consistent cinematic/Photo keyboard exits.
- Pioneer scenery: seamless nebula backdrop, in-frustum spectral stars, corona,
  aurora, gas-world rings/shadows, thin atmospheric limb, improved gas clouds and
  ocean specular response. Quality adaptation only reduces decorative work and
  retains physical terrain and high-resolution texture assets.
- Pioneer combat: corrected attack thrust/fire orientation, time-based enemy
  archetype cadence, wave/contact HUD, pooled exhaust/missile/explosion effects,
  current-colony orbital backdrop and retired procedural-resource disposal.
- Pioneer navigation: 268,435,456 deterministic addresses, bounded 25-sector
  residency with required pins, sparse saved discovery state, reachable waypoint
  routes, complete paid expeditions, real local-world transfers, per-body colony
  saves, home-profile preservation and legacy-save migration.
- Dependency gate: updated only the affected transitive `fast-uri` lockfile entry
  from 3.1.5 to 3.1.7; `npm audit --audit-level=low` reports zero vulnerabilities.

## Validation progress

- Source Jest regression suite: 58 passing tests at the first integration gate.
- New source runtime/control suite: 6 passing browser tests, including actual
  paused orbit, keyboard exit, portrait framing, failed storage, recruitment and
  sourced catalog analysis.
- Source universe: 11 unit tests and 2 browser travel/mobile cases passed before
  adding the extra home-profile and legacy-recovery regressions.
- Source graphics/combat: 3 new browser tests plus the 2 existing missile/touch
  tests passed; WebGL1 and WebGL2 compiled/rendered without GL errors.
- Source shared controls: 46 route cases passed; the strengthened text roundtrip
  assertions are included in the final built-artifact run.
- Current-tree credential detector: self-test passed; 3,573 text files scanned
  without a detected credential. This is not evidence that historical leaked
  credentials have been revoked; historical rotation requires provider authority.
- First candidate Pages build: 47 governed pages, 17 renderer/redirect exemptions,
  45 sitemap URLs passed metadata/breadcrumb/artifact verification. Fresh NASA
  snapshot contains 434 planets; tests derive counts from that snapshot rather
  than assuming the previous source snapshot's 435.

## Additional live-browser and archival verification

- The full built Pioneer workload passed **355 assertions**, with zero assertion
  failures, application warnings, console/page errors, or failed first-party
  requests. Fifteen workload screenshots were captured. This software-validation
  profile is not a production FPS benchmark.
- The advanced graphics smoke passed **26 assertions**, preserving 1,000 logical
  tiles, native geometry/textures, high-quality shadows and save state across
  standard/ray-traced/progressive Photo mode changes.
- The first complete built regression run passed **59 tests**, including the
  all-page desktop/mobile Axe and layout traversals.
- Lighthouse 13.4.1 on the local candidate: desktop performance 98, accessibility
  100, best practices 100, SEO 100, LCP 1.1 seconds, TBT 0 ms, CLS 0.003. Mobile
  performance 78, accessibility/best practices/SEO 100, LCP 5.7 seconds, TBT 0 ms.
  These are local lab measurements, not Search Console field data or rank guarantees.
- Actual installed Chrome and the user's normal Chrome profile both loaded
  Bonsai 1.7B and produced real local output after bounded retry recovered an
  upstream connection reset. The normal profile also loaded **Bonsai 4B**, which
  answered the exoplanet prompt at a reported 41.7 tokens/second. The audit-created
  approximately 802 MB of model cache was removed with the page's own Remove
  downloads control; it confirmed no model weights remained cached.
- The real Chrome WebGPU branch rendered 262,144 nebula particles and its
  pause/resume control was inspected; a separate GPU readback test checks
  bit-exact state preservation when paused.
- The archive's old shared Worker returned account-level R2-disabled errors.
  After explicit user approval for archive-only, free-feature repairs, the owned
  original files were recovered and container-validated. There are **957 valid
  game containers** and **297 unavailable originals**. Container validity is not
  a claim that every level or legacy network dependency has been played.
- An isolated pure-static Cloudflare Assets replacement avoids R2 subscriptions,
  executable Worker requests, shared bindings, custom routes and billing changes.
  Original files are preserved. Final publication/asset hashes and representative
  actual gameplay are recorded separately before the website switches endpoints.

## Final local integration gates

- Candidate 4: **66/66** site control, search/identity, translation, player,
  model-download lifecycle, GPU review and page-specific action cases passed.
- Candidate 4 archive wrapper: **9/9** passed, plus an unmocked installed-Chrome
  Tank Trouble launch with a visible 1132 × 560 canvas and an unobstructed,
  functioning Close button.
- Current source unit gate: **65/65** tests passed; repository lint and whitespace
  checks passed; dependency audit reports zero vulnerabilities.
- The built integration exposed and repaired an OR-token search defect, native
  `hidden` synchronization in the game modal, and an over-broad shared selector
  that mistook `close-game-modal` buttons for dialog containers.
- Nine Science Deck tools now have actual viewport geometry, focus, close and
  timer cleanup. Supported engineering/quantum actions change real game resources
  and geometry and preserve save/rollback behavior. Unfinished transit, autopilot,
  prestige-reset and AR prototypes are explicitly disabled.
- Final isolated archive version: `16824761-dfdd-4b49-b095-5ccf0bae1396`.
  All 958 SWF/chunk URLs passed availability/CORS checks; nine complete downloads
  matched length and SHA-256. Zombie Invaders, Tank Trouble and Four Second Frenzy
  have actual gameplay evidence. Punk-o-Matic 2 has complete reconstructed-byte
  and start-screen evidence. Sugar Sugar stalled in an 88-second test; it and the
  publisher-restricted Bloxorz edition offer verified publisher links. No edition's
  host restriction was bypassed, and no invalid original was deleted.

## Hosted-candidate repairs

- The first GitHub validation run passed the Windows build/unit gates and the
  independent advanced-graphics job, but blocked release on a stale time-speed
  rate sample and seven browser failures. No failing candidate reached GitLab.
- Resource-rate labels now follow the actual colony-tick sample and clear when
  paused or switching speed. Browser assertions await that real sample instead
  of assuming a software renderer completes a tick within a fixed wall time.
- Database 3D actions now distinguish a selected comparison from a result card;
  loading, cancellation, script errors, timeouts and retry are regression-tested.
  The loading dialog hands focus to the viewer only after it stops being modal.
- The Stellar theme button itself is positioned inside its dock, preventing the
  expanded mobile player from covering it. GPU tests validate either live GPU
  readback or the genuine device-loss fallback and its controls.
- A final 1280-pixel visual check exposed a breadcrumb over the Pioneer resource
  bar. It now occupies its own navigation space inside the More drawer; mobile
  and desktop tests verify non-overlap, hit targets, reload and Home navigation.
- Functional Science Deck tests use an explicitly recorded software framebuffer
  profile on hosted runners. Production geometry, textures and rendering remain
  unchanged, and the independent advanced-graphics gate retains its own profile.
- The second hosted gameplay run passed 146 assertions before its test colony
  exhausted food and correctly emergency-paused an active probe. A deterministic
  four-FPS-timestep reproduction confirmed that resupplying the same colony
  completes that same probe. Exploration test provisioning and a pause/resupply
  regression preserve production safety and graphics settings. The failed
  artifact also exposed the chart's stale 10x indicator after emergency pause;
  chart speed controls now synchronize with the actual simulation state.
- The third candidate passed all 152 hosted site tests, but the long gameplay
  job reached its 30-minute limit. Evidence showed its test-only 0.35 DPR budget
  reverted to 1 after reload, increasing software framebuffer area by 8.16x.
  The workload now maintains that same budget across renderer recreation,
  resizing and graphics-setting application, with explicit framebuffer and
  native-asset invariance checks. Production rendering is unchanged.
- A final narrow-screen inspection found that the compact toolbar hid Combat,
  Galaxy, Missions and Tutorial without alternatives. The same original buttons
  now move into More > Flight commands below 680px and return to their desktop
  positions above that breakpoint. Real 390px/320px click-through checks cover
  each command, close/retreat behavior, visible focus return and resize round trips.
  The newly exercised tutorial also has reserved resize-handle clearance so Next
  is no longer obstructed on a phone.
- Mobile inventory, camera and navigation controls now have separate rows,
  including after rotation to 844x390. Camera buttons use actual orbit/zoom
  actions within existing distance limits; native canvas pinch replaces broken
  duplicate document handlers. The objective remains scrollable and actionable,
  and placement cancellation stays clear of the DATA control. Real pointer,
  camera-state and pinch tests cover 320x844, 390x844 and 568x518 plus rotation.
- GitHub's two open secret alerts point to historical commit `635b8df`: the
  Supabase token is absent from the current documentation and the Google Cloud
  service-account key file is absent from the current tree. Neither path exists
  in the current filtered mirror. Historical exposure is not erased by these
  removals; credential revocation/rotation and history remediation need a separate
  owner decision. No credential values are included in this report.

This source report is frozen before the final validation mirror is published. The final
GitHub/GitLab run URLs and live deployment checks are recorded in the task handoff
and local release evidence; unchecked release steps above describe the state at
this source commit, not a claim that the source has already reached production.

Hardware
XR, actual serial hardware, paid/external provider flows and separately operated
domain services are not exercised by this static-website audit. GPU-unavailable
states must remain explicit and usable. Procedural address count is not an MMO
simulation or a claim of AAA asset/content parity.
