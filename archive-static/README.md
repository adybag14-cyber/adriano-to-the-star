# Free-only legacy archive storage

This deployment is isolated to `starisdons-archive-assets.adybag14.workers.dev`. It has static assets only: no application entry point, R2 subscription, KV/D1 binding, custom domain route, scheduled job, or paid feature. Do not deploy the repository-root `wrangler.toml` as part of this archive workflow; that older Worker also routes unrelated services.

The former archive endpoint failed with R2 account error `10042`. Activating R2 requires a subscription checkout, which is outside the owner's free-only policy. The replacement uses [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), whose asset requests and storage are free. Its [current limits](https://developers.cloudflare.com/workers/platform/limits/) are 20,000 files per free deployment and 25 MiB per file. The configuration has no executable Worker that could consume dynamic-request quota.

The 2026-09-04 recovery inventories all 1,254 catalogue records. There are 957 valid FWS/CWS/ZWS containers and 297 invalid original downloads: 290 non-SWF/HTML files, five damaged compressed streams, one empty file, and one truncated uncompressed file. All originals are preserved unchanged. Container validation does not certify every legacy game's gameplay, external service, or Ruffle compatibility. The original Coolmath Bloxorz edition is publisher-host-restricted and is labelled separately, with an explicit [publisher link](https://www.coolmathgames.com/0-bloxorz); no host restriction is bypassed.

One original SWF (Punk-o-Matic 2, 33,023,099 bytes) exceeds the per-file static limit. Its two static chunks are downloaded, length-checked, independently SHA-256-checked, assembled, and checked against the full original hash in the browser before Ruffle receives the bytes. This uses no dynamic proxy. All other valid files are served directly.

## Reproduce

Use a supported Node.js runtime, Python 3 with the standard `lzma` module, Wrangler 4.34 or newer, and the owner's existing Cloudflare OAuth session. Do not put credentials or local source directories into public manifests.

1. Set `ARCHIVE_ASSET_DIR` to the original SWF directory. Optionally set `ARCHIVE_PYTHON` to a different Python executable. Run `node scripts/prepare-game-archive-assets.mjs` from the repository root. The generator reads originals without modifying them and creates a public `games-archive-index.json` plus ignored `.artifacts/audit-20260904/archive/static-assets` files. Inspect its summary and unavailable reasons. Do not hand-edit the generated index.
2. Run `node scripts/inspect-archive-cloudflare.mjs`. Before the first deployment, the exact replacement name must be absent. Subsequent changes must target only the same archive asset deployment and preserve its prior version ID.
3. Run `wrangler deploy --config archive-static/wrangler.toml --dry-run`. There must be no application entry point, paid binding, route, or subscription activation prompt. Stop if those conditions change.
4. Publish with `wrangler deploy --config archive-static/wrangler.toml`. Record the exact resulting version ID. No website or other Worker is changed by this command.
5. Run `node scripts/verify-game-archive-deployment.mjs`. It checks every public asset/chunk for HTTP availability, MIME and CORS, then downloads and SHA-verifies representative complete files including every ZWS file and the reconstructed large SWF. HEAD may omit Content-Length; full byte-length evidence comes from the explicitly listed GET checksum samples.
6. Run `BASE_URL`-configured Playwright `tests/e2e/games-archive-contracts.spec.js`, and manually inspect actual Ruffle Start/Play and gameplay actions on desktop/mobile. The mocked wrapper tests verify transport failure handling, retry, focus, dimensions, and chunk integrity; they do not replace actual legacy runtime checks.
7. Publish the website/index only through the site's normal GitHub-CI-then-GitLab-Pages release gate.

The source directory has one verified legacy filename correction for Four Second Frenzy. This is encoded in the generator; the public route remains `swf/four_second_frenzy.swf`.

The follow-up installed-Chrome audit established that Four Second Frenzy completes its loader/intro, opens its mode menu, and enters an active normal-mode minigame with keyboard input. Sugar Sugar stayed at its loader for 88 seconds despite a complete SWF load and user input. That exact valid-container entry is marked `startup-blocked`, not corrupt. Read-only inspection found publisher site-lock constants, but the exact executed guard was not proven; its card links to the verified official publisher page. No publisher guard was modified.

## Rollback and boundaries

The existing `starisdons-swf-worker`, its R2 buckets, mail, tunnels, DNS, and all other Workers were left untouched. The first replacement version was `d06bf01c-4aac-48e2-bd58-ae1e03091abb`; the Bloxorz-labelled version was `69927485-b58d-4437-ae05-8a5deba40af1`; the final startup-labelled version is `16824761-dfdd-4b49-b095-5ccf0bae1396`.

For an asset-only regression, use Wrangler's version rollback against this exact archive deployment and a recorded known-good version. For a website integration regression, restore the prior website commit through the same CI/release gates. The old R2 endpoint remains unavailable, so switching back to it does not restore playback. Do not delete original SWFs or remove another service while rolling back. The archive can remain deployed while its website integration is rolled back.

Evidence for this audit is under ignored `.artifacts/audit-20260904/archive/`, including `remote-verification.json`, deployment logs, per-original validation, wrapper results, and real-game screenshots. Exact workstation recovery paths belong only in local audit evidence, never in the public index.
