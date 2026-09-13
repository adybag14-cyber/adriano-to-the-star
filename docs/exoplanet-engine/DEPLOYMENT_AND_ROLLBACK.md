# Deployment and rollback

GitLab `adybag14-group/starisdons` remains production authority. The GitHub
`adybag14-cyber/adriano-to-the-star` mirror runs the existing filtered-snapshot
validation workflow. GitLab's main-branch Windows pipeline validates, builds,
scans, publishes Pages, checks public health and then submits IndexNow.

Before release:

1. Recheck exact GitLab/GitHub heads and preserve unrelated worktrees.
2. Run the science tests, immutable-release validator, existing Jest suite,
   lint, dependency/security checks and the Pages build.
3. Run the browser suite against `public/`, including the new blocking engine
   fixtures and preserved legacy consumer checks. Capture native GPU evidence.
4. Commit the concrete change; create the GitHub snapshot from that exact commit.
5. Require the mirror's checks on the exact snapshot/source mapping.
6. Publish through GitLab and wait for the terminal Pages/health results.
7. Verify public database actions, release/hash identity, MIME/cache behavior,
   source links and unchanged excluded services.

The release contains content-addressed object and alternative assets plus the
matching versioned runtime. The Pages string versioner deliberately excludes
that immutable runtime. Service-worker fallback requires version-sensitive URLs
for engine assets and preserves the engine's bounded compatible-data cache.

Ordinary builds use checked-in data. `REFRESH_PUBLIC_DATA=true` is the explicit
legacy-feed refresh switch; new engine source refresh always creates a proposal
for review, not an automatic publication. The weekly GitHub source-review job
has read-only repository permissions and uploads the proposal as an artifact.

Rollback is website-only: restore the preceding tested GitLab source/release and
run the same Pages/health chain. Preserve already-published immutable engine
releases needed by shared URLs. A graphics issue can use the compatible backend
or schematic path while keeping valid evidence available. No rollback requires
changing mail, app, tunnel, API, registrar or DNS routes.

The separately authorized administrative change added five apex CAA records:
`issue letsencrypt.org`, `issue pki.goog`, `issue ssl.com`, `issue sectigo.com`, and
`iodef mailto:security@adrianotothestar.com`, all flags 0/Auto TTL. The 132 existing
Cloudflare records compared exactly unchanged. Both authoritative nameservers
returned the new policy, including Cloudflare's automatic Universal SSL records.
No mailbox, Worker, app or mail routing change was made.
