# Observatory visual review

Canonical candidate `98f8fed0`; GitHub source `79c02d13`; PR #6. No production deployment or GitLab push has occurred. This evidence-only branch does not change the source PR or restart its checks.

Download `observatory-review.zip`, extract it, and open the top-level `index.html`. It contains selected candidate and production screenshots, four sampled GIFs, clearly labelled excerpts of the raw metrics, and validation summaries. GIFs play at 5 fps for presentation; they are not FPS benchmarks.

Both full visual tours completed 52 views with two GIFs and zero capture failures each. The complete 104-view bundle is retained on Devbox at `C:/Users/adyba/adriano-observatory-20260927/.artifacts/observatory/observatory-full-visual-evidence.zip`. Full hosted galleries are uploaded by the Actions run linked from PR #6.

Local validation: 15 Python catalogue tests, 14 astrometry tests, four tests of the actual search methods, 28 new browser cases, and 54 retained browser cases. Hosted CI status is separate and must not be inferred from these local passes. The original cold-evidence gate passed at p95 2029 ms in the recorded ten-context run.

The candidate indexes 16180 catalogue entries, not 16180 confirmed planets. Source conflicts, high-mass entries and unresolved aliases remain explicit. The HYG sky is incomplete from extrasolar observers. PA-99-N2 b is a candidate with an evidence-limited M31 view, not an invented observed local star field.

No font files, credentials, account storage or packaged application binaries are included.
