# PowerShell Cheat Sheet

## File System
- **List files**: `ls` or `dir` or `Get-ChildItem`
- **Read file**: `cat <file>` or `Get-Content <file>`
- **Create file**: `echo "content" > file.txt` or `New-Item -Path file.txt -Value "content"`
- **Remove file**: `rm <file>` or `Remove-Item <file>`
- **Copy**: `cp <src> <dst>` or `Copy-Item`
- **Move**: `mv <src> <dst>` or `Move-Item`

## Process Management
- **List processes**: `ps` or `Get-Process`
- **Kill process**: `kill <id>` or `Stop-Process -Id <id>`

## Network
- **Check IP**: `ipconfig`
- **Ping**: `ping <host>`
- **Check ports**: `netstat -an`

## Environment
- **List env vars**: `dir env:`
- **Set env var**: `$env:VAR_NAME = "value"`
