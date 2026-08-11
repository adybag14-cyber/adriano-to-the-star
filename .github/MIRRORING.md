# GitLab -> GitHub CI snapshot mirror

The canonical repository and deployment source is GitLab: `adybag14-group/starisdons`.

The GitHub repository `adybag14-cyber/adriano-to-the-star` is a downstream **filtered CI snapshot mirror** used to run the expensive browser/build regression suite on GitHub-hosted runners. Do not author divergent commits directly on the GitHub mirror.

A normal full-history push mirror is intentionally not used: the canonical Git repository contains multi-gigabyte packaged games, runtime archives, backups and tracked binary payloads that are irrelevant to Pioneer CI and exceed practical GitHub mirroring limits.

## Snapshot policy

`scripts/create-github-ci-snapshot.py` materializes files directly from a committed Git ref, never from the working tree. This prevents unrelated local edits from entering the mirror. It excludes generated/vendor/backup runtime trees, credential/bootstrap material (including `.env*`), and files larger than 5 MiB unless the policy is deliberately changed. The snapshot records the canonical source commit in both `.gitlab-source-sha` and `.github-ci-snapshot.json`.

Create a snapshot locally with:

```powershell
python scripts/create-github-ci-snapshot.py --repo . --ref HEAD --output $env:TEMP\adriano-github-ci-snapshot
```

The generated snapshot must pass the same Pages build and browser workloads before it is pushed.

## Validation on GitHub

`.github/workflows/ci-cd.yml` runs on snapshot pushes to `main` and verifies:

- JavaScript syntax for the Pioneer core, terrain generator, local-system explorer and tracing renderer.
- The Jest regression suite.
- The exact `build-pages.ps1` artifact used by GitLab Pages.
- The full 363-assertion Pioneer Playwright workload.
- The advanced graphics/local-system browser smoke, including WebGL2 ray tracing and progressive path tracing.
- The four-request generated Pioneer startup bundle shape.

GitLab remains responsible for canonical history and production Pages deployment. GitHub is the heavy validation runner.

## Publishing a CI snapshot

Initialize/update a temporary Git repository from the generated snapshot and push its `main` branch to:

`https://github.com/adybag14-cyber/adriano-to-the-star.git`

Because the GitHub mirror intentionally has filtered snapshot history, **do not configure GitLab's ordinary full-history push mirror against this repository**. The source SHA in the snapshot manifest is the cross-host identity.
