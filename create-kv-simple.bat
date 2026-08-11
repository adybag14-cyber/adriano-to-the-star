@echo off
echo Creating KV namespace...
wrangler kv:namespace create CACHE > kv_output.txt 2>&1
type kv_output.txt
pause
