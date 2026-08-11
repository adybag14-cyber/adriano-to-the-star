# Exoplanet Pioneer "1000-Item" Roadmap (Tiered, Trackable)

> Structured as themed buckets with checkboxes. Treat each sub-bullet as a trackable work item; expand further in PRs. Use ✅ for done, ⏳ for in-progress, ⬜ for pending.

## 1) Core Gameplay Depth
- ⬜ Colony economy: supply chains, production/consumption loops, scarcity.
- ⬜ Tech tree v2: pacing, prereqs, upgrade costs, narrative beats.
- ⬜ Disasters/repairs: events, mitigation tools, maintenance costs.
- ⬜ Missions/contracts: timed objectives, rewards, failure states.
- ⬜ NPC vendors/factions: reputation, offers, embargoes.
- ⬜ Progression & achievements: badges, milestones, faction ranks.

## 2) Marketplace & Social (Supabase-backed)
- ⬜ Listings v2: bids/auctions, escrow states, dispute resolution.
- ⬜ Reputation/fees: seller scores, royalties/fees, anti-fraud checks.
- ⬜ Portfolio dashboards: holdings, P&L, exposure, rental yield.
- ⬜ Alerts/notifications: price moves, fill/expire, counter-offers.
- ⬜ Social flows: transfer/rental/invest server validation + UI polish.
- ⬜ Moderation/policies: abuse flags, rate limits, audit trails.

## 3) Integrations & Data
- ⬜ NASA/space feeds: caching, filters, dedupe, graceful offline.
- ⬜ News/launch filters: time windows (next 48h), agency filters, dedupe.
- ⬜ Webhooks/exports: CSV/JSON exports, API keys, rate limiting.
- ⬜ Test/mocks: deterministic mocks for feeds in E2E/unit.

## 4) AI & Analytics
- ⏳ Habitability/discovery v2: more signals, weighted scoring, tooltips. (gravity/insolation/star type/metallicity added; likelihood uses insolation)
- ⏳ Explanations: “why this score” cards, per-planet hints. (inline reason tags shipped)
- ⬜ AI search suggestions: context from filters/history; “build mission” prompts.
- ⬜ Analytics dashboards: session/retention, economy health, XR usage.

## 5) VR/AR & 3D Polish
- ⏳ XR controls polish: input hints, recenter, safe fallbacks. (VR/AR gating, banners, disabled states)
- ⏳ AR ground plane robustness: hit-test gating, anchors, error banners. (placeholder + warning when AR requested)
- ⬜ Cardboard flows: auto-exit, orientation lock, help text.
- ⬜ Visuals: shaders/atmosphere tweaks, camera presets, perf budgets.
- ⏳ Tests: XR gating, scene validation, UI presence (Playwright). (gating + AR placeholder tests added)

## 6) UX & UI
- ⬜ Overlay ergonomics: layout, grouping, keyboard shortcuts.
- ⬜ Accessibility: focus order, ARIA labels, contrast, reduced motion.
- ⬜ Empty/loading states: skeletons, retry buttons, cached fallback.
- ⬜ Notifications/log pane: toast queue, error drawer, debug toggle.

## 7) Stability & Tests
- ⬜ Playwright coverage: marketplace (buy/transfer/rent/invest), XR buttons.
- ⬜ Unit/integ: scoring, filters, caching, marketplace persistence.
- ⬜ Smoke scripts: server start, BASE_URL sanity, offline-feed mocks.
- ⬜ Error handling: retries/backoff, optimistic rollback, telemetry.

## 8) Performance & Resilience
- ⬜ Resource caps & leak checks (loops, intervals, observers).
- ⬜ Asset lazy loading, LODs for 3D, throttled expensive ops.
- ⬜ Supabase/network resilience: retry/backoff, timeout guards.
- ⬜ Profiling: frame time budgets for XR/3D scenes.

## 9) Content & Narrative
- ⬜ Faction storylets, mission arcs, lore entries tied to discoveries.
- ⬜ Dynamic events: seasonal/weekly modifiers; rotating buffs/debuffs.
- ⬜ Collectibles/badges tied to real launches/APOD highlights.

## 10) Tooling & Docs
- ⬜ Dev ergonomics: scripts for server + Playwright, lint/format hooks.
- ⬜ Docs: README test section (done), XR/marketplace integration guides.
- ⬜ Changelog cadence for releases; checklist templates for PRs.

## Tracking Conventions
- Update status with ✅/⏳/⬜ and brief note/date per item as delivered.
- Break down any item into sub-tasks in PRs/issues; keep this file high-level.
