@echo off
TITLE Minimax Agent
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_agent.ps1"
if %errorlevel% neq 0 pause
