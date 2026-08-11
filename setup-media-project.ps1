# PowerShell script to setup new GitLab project for media files
# Run this after creating the new project on GitLab

param(
    [string]$NewProjectName = "new-starsiadr-media",
    [string]$NewProjectUrl = ""
)

$OriginalProject = "c:\Users\adyba\adriano-to-the-star"
$MediaProject = "c:\Users\adyba\$NewProjectName"

Write-Host "🚀 Setting up new GitLab project for media files..." -ForegroundColor Green

# Step 1: Create directory for new project
if (-not (Test-Path $MediaProject)) {
    Write-Host "Creating directory: $MediaProject" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $MediaProject -Force | Out-Null
}

# Step 2: Initialize git in new project
Set-Location $MediaProject
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git remote add origin "git@gitlab.com:imtherushwar/$NewProjectName.git"
}

# Step 3: Copy large files from original project
Write-Host "Copying large files..." -ForegroundColor Yellow

# Copy games (SWF files)
if (Test-Path "$OriginalProject\games") {
    Write-Host "Copying games..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "games" -Force | Out-Null
    Copy-Item "$OriginalProject\games\*.swf" -Destination "games\" -Force
    Copy-Item "$OriginalProject\games\games-manifest.json" -Destination "games\" -Force
    Copy-Item "$OriginalProject\games\games-list.txt" -Destination "games\" -Force
    Copy-Item "$OriginalProject\games\README.md" -Destination "games\" -Force
}

# Copy GTA 6 videos
if (Test-Path "$OriginalProject\gta-6-videos") {
    Write-Host "Copying GTA 6 videos..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "gta-6-videos" -Force | Out-Null
    Copy-Item "$OriginalProject\gta-6-videos\*.mp4" -Destination "gta-6-videos\" -Force
    Copy-Item "$OriginalProject\gta-6-videos\videos-manifest.json" -Destination "gta-6-videos\" -Force
    Copy-Item "$OriginalProject\gta-6-videos\videos-list.txt" -Destination "gta-6-videos\" -Force
}

# Copy Total War 2 files
if (Test-Path "$OriginalProject\total-war-2") {
    Write-Host "Copying Total War 2 files..." -ForegroundColor Cyan
    Copy-Item "$OriginalProject\total-war-2" -Destination "." -Recurse -Force
}

# Step 4: Create README for new project
$README = @"
# Media Files Repository

This repository contains large media files for the Adriano To The Star website.

## Contents
- \`games/\` - Flash game files (.swf)
- \`gta-6-videos/\` - GTA 6 leaked videos (.mp4)
- \`total-war-2/\` - Medieval II: Total War game files

## GitLab Pages URL
Once deployed, files will be accessible at:
\`https://[project-name].gitlab.io/[file-path]\`

## Usage
Files in this repository are referenced by the main website project.
"@

Set-Content -Path "README.md" -Value $README

# Step 5: Create .gitlab-ci.yml for Pages
$GitLabCI = @"
image: alpine:latest

pages:
  stage: deploy
  script:
    - echo 'Deploying to GitLab Pages...'
  artifacts:
    paths:
      - public
  only:
    - main
"@

Set-Content -Path ".gitlab-ci.yml" -Value $GitLabCI

# Step 6: Create public directory and move files (GitLab Pages requirement)
Write-Host "Setting up GitLab Pages structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "public" -Force | Out-Null

# Move all files to public directory
Get-ChildItem -Exclude "public", ".git" | Move-Item -Destination "public\" -Force

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd $MediaProject" -ForegroundColor Cyan
Write-Host "2. git add ." -ForegroundColor Cyan
Write-Host "3. git commit -m 'Initial commit: Media files'" -ForegroundColor Cyan
Write-Host "4. git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "After pushing, update the original project to reference files from:" -ForegroundColor Yellow
Write-Host "https://$NewProjectName.gitlab.io/" -ForegroundColor Cyan

