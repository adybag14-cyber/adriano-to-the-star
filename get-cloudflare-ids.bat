@echo off
echo Getting D1 database info...
wrangler d1 list --json > d1_list.json 2>&1
type d1_list.json

echo.
echo Getting KV namespace info...
wrangler kv:namespace list --json > kv_list.json 2>&1
type kv_list.json

echo.
echo Done! Check d1_list.json and kv_list.json for the IDs.
pause
