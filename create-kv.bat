@echo off
echo Creating KV namespace...
wrangler kv:namespace create CACHE --json > kv_create.json 2>&1
type kv_create.json
pause
