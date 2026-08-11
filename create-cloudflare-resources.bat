@echo off
echo Creating Cloudflare D1 database...
wrangler d1 create exoplanet-pioneer-db --config=wrangler-exoplanet.toml > d1_output.txt 2>&1
type d1_output.txt

echo.
echo Creating Cloudflare KV namespace...
wrangler kv:namespace create CACHE --config=wrangler-exoplanet.toml > kv_output.txt 2>&1
type kv_output.txt

echo.
echo Done! Check d1_output.txt and kv_output.txt for the IDs.
pause
