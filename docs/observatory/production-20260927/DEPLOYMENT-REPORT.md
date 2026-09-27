# Observatory production rollout — 27 September 2026

## Deployed release

Canonical production commit: `3cc18b8ea47ca04ad345e8845531f080b5562f9b`. GitLab pipeline **2887380041** completed every one of its 7 jobs successfully, including the new production catalogue integrity gate. GitHub PRs #6 and #7 are merged. The corrective review run **36341160457** passed all eight hosted gates before publication.

## Each published page was checked

The archive inventory contains **64 HTML documents and 67 addressable URLs**, including nested experiments, legacy redirects, and all three directory-index aliases. Each URL was checked at **1440×950 and 390×844**, giving **134 live views**. The audit checks HTTP responses, release markers, canonical/description/indexability metadata where applicable, runtime exceptions, first-party failures, responsive overflow, rendered accessibility, and real control interactions. Every view has an actual browser screenshot.

**133/134 raw interaction views passed.** The remaining view records the already-existing Tracker mobile language toggle outside the viewport. Its identical baseline geometry is documented. The unchanged generated choropleth also retains its baseline title/language omissions. These are not hidden or presented as a zero-defect website. No new blocking regression remains in the final assessment.

The final audit checked **218 asset URLs**: 217 exact SHA-256 matches, 0 PWA manifest formatting-equivalence check(s), and 1 explicitly refreshed build-time feed. All scientific manifests and source shards retain exact byte checks.

## Regression caught and fixed during rollout

The first deployment passed its old health checks, but the stronger live audit found a cached 404 for the unversioned catalogue pointer. Cloudflare reported HIT and a seven-day cache policy; the versioned URL returned the correct data. The browser had therefore fallen back to the older catalogue. The corrective release carries the deployed script query onto the mutable pointer. Two new browser tests simulate that poisoned bare-URL cache, and a new canonical health check verifies the actual visitor-facing pointer and all 39 catalogue/evidence assets. Original failed-attempt reports and headers are included.

The corrected artifact was initially accepted by GitLab while the active Pages service still served the previous release. The unchanged release-marker health gate failed rather than approving that state. A repeat of the same Pages publication activated the corrected release; the original health gate was then rerun. Both the first failure and the successful recovery are retained in the evidence.

## Functional and returning-visitor validation

All **32 observatory browser cases passed directly against production**, with no skipped or flaky cases. Tests used fresh unauthenticated contexts and blocked non-read-only network methods. The isolated profile prepared before deployment subsequently loaded the new release and full 16,180-entry catalogue while preserving its local preferences. Its controller remained the original service worker; this validates compatibility with returning visitors, not replacement of the worker itself.

The prior service worker itself remained active during this check; this result verifies online compatibility of the returning profile, not service-worker replacement or offline migration.

The production GIF workflow also captured 52 views and two animations successfully. Its first homepage sample listed both old and new version tags; later homepage samples and two fresh URL-list inspections contained only the new version. The earlier observation is preserved, and its exact cause is not asserted. All final live runtime/data hash checks passed.

The complete retained 173-case hosted suite, existing unit/scientific checks, gameplay and graphics gates were preserved. No behavior assertion was weakened to declare deployment success.

## Actual build comparison

The GitLab deployment artifact contains 15111 files. Against the certified Windows artifact, 15106 files are byte-identical and no certified file is missing. The only reviewed differences are the refreshed public space feed and whitespace in the semantically identical PWA manifest. Canonical-only marker/security files are listed in the JSON comparison.

## Review this evidence

Open `index.html` for the live all-page screenshot table. Read `deployment-summary.json` and `audit/report.json` for machine-readable results. Baseline, predeployment, failed-attempt, cache-header and rollback proofs remain in `evidence/`. This bundle includes generated HTML, JSON, Markdown and PNG evidence only: no fonts, runtime/application bundles, credentials or persistent browser profile.

Rollback source `4d925d158543f231589ce608c7409fcaecbcf7cf` and its verified deployment archive remain on Devbox. No rollback was required after the corrective release passed acceptance. The daily production visual audit workflow is on the default branch; its exact schedule is stored in the repository.
