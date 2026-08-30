# GitLab -> GitHub CI snapshot mirror

The canonical repository and deployment source is GitLab: `adybag14-group/starisdons`.

The GitHub repository `adybag14-cyber/adriano-to-the-star` is a downstream **filtered CI snapshot mirror** used to run the expensive browser/build regression suite on GitHub-hosted runners. Do not author divergent commits directly on the GitHub mirror.

A normal full-history push mirror is intentionally not used: the canonical Git repository contains multi-gigabyte packaged games, runtime archives, backups and tracked binary payloads that are irrelevant to Pioneer CI and exceed practical GitHub mirroring limits.

## Snapshot policy

`scripts/create-github-ci-snapshot.py` materializes files directly from the committed, checked-out `HEAD`, never from working-tree file contents. This prevents unrelated local edits from entering the mirror. It excludes every path covered by the committed `.gitignore` policy, generated/vendor/backup runtime trees, credential/bootstrap material (including `.env*`), and files larger than 5 MiB unless the policy is deliberately changed. The snapshot records the same canonical 40-character GitLab source commit in both `.gitlab-source-sha` and `.github-ci-snapshot.json`. GitHub Actions refuses to build unless that binding is syntactically valid and stamps the Pages artifact with its canonical short SHA.

The size cap has a narrow production-input exception for the complete `audio/` tree and the two model files explicitly published by `build-pages.ps1`. Required Pages inputs are checked fail-closed while unrelated large models and packaged runtimes remain excluded.

Create a snapshot locally with:

```powershell
python scripts/create-github-ci-snapshot.py --repo . --ref HEAD --output $env:TEMP\adriano-github-ci-snapshot
```

The generated snapshot must pass the same Pages build and browser workloads before it is pushed.

## Validation on GitHub

`.github/workflows/ci-cd.yml` runs on snapshot pushes to `main` and verifies:

- A fail-closed current-tree credential scan that reports only paths and detector names, never matched contents.
- JavaScript syntax for the Pioneer core, terrain generator, local-system explorer, tracing renderer, release scripts, credential scanner and every production-artifact specification.
- The full repository ESLint gate and a zero-known-vulnerability `npm audit --audit-level=low` gate.
- The 39-test Jest regression suite with coverage.
- The exact `build-pages.ps1` artifact used by GitLab Pages.
- The 37-test production-artifact Playwright suite: critical endpoint and control smoke; all-route desktop/mobile metadata, breadcrumb and overflow coverage; Spanish/English round trips; landing theme selection and persistence; local platform flows; privacy and tracker behavior; Pioneer and Star Maps upgrades; and WCAG 2.2 AA Axe audits of every non-redirect production page at desktop and mobile viewports.
- The full current 370-assertion Pioneer Playwright workload, including combat, navigation, economy, rendering and first-party request gates.
- The advanced graphics/local-system browser smoke, including WebGL2 ray tracing and progressive path tracing.
- The five-request generated Pioneer startup bundle shape, including the shared site runtime.

GitLab remains responsible for canonical history and production Pages deployment. GitHub is the heavy validation runner. A GitHub snapshot commit is not the production identity: release authority requires a successful workflow whose `.gitlab-source-sha` equals the exact canonical GitLab commit later pushed to `main`.

## Publishing a CI snapshot

Clone the existing filtered GitHub mirror into a temporary directory, replace its tracked snapshot contents, create a normal child commit and push that temporary repository's `main` branch to:

`https://github.com/adybag14-cyber/adriano-to-the-star.git`

Do not push the canonical GitLab worktree directly to the GitHub remote and do not force-push the mirror. Because the GitHub mirror intentionally has filtered snapshot history, **do not configure GitLab's ordinary full-history push mirror against this repository**. The identical source SHA in `.gitlab-source-sha` and `.github-ci-snapshot.json` is the cross-host identity; both must equal the GitLab commit certified before the single production push.
