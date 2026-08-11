@echo off
REM Oracle Cloud Instance Auto-Retry Script
REM This script attempts to create an instance every 5 minutes until successful
REM 
REM SETUP REQUIRED:
REM 1. Install OCI CLI: Run in PowerShell: 
REM    Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1'))
REM 2. Run: oci setup config
REM 3. Add the API key to Oracle Cloud Console

setlocal enabledelayedexpansion

REM ============================================
REM CONFIGURATION - EDIT THESE VALUES
REM ============================================
set COMPARTMENT_ID=ocid1.tenancy.oc1..aaaaaaaan3fwo3yruzh7ucpbnlw4rhuytctzjh42gobfniscdda4cotv5lwq
set AVAILABILITY_DOMAIN=YqAQ:UK-LONDON-1-AD-1
set IMAGE_ID=ocid1.image.oc1.uk-london-1.aaaaaaaaw2hy6tmpi4k2mjbuj3japjqiw32fbaz6ffhglzkwpdy4pholqynq
set SHAPE=VM.Standard.A1.Flex
set OCPUS=4
set MEMORY_GB=24
set SUBNET_ID=YOUR_SUBNET_ID_HERE
set SSH_KEY_FILE=C:\Users\adyba\Downloads\ssh-key-2025-12-08.key.pub
set INSTANCE_NAME=starsector-server
set RETRY_INTERVAL=300

REM ============================================
REM DO NOT EDIT BELOW THIS LINE
REM ============================================

echo =============================================
echo Oracle Cloud Instance Auto-Retry Script
echo =============================================
echo.
echo Compartment: %COMPARTMENT_ID%
echo AD: %AVAILABILITY_DOMAIN%
echo Shape: %SHAPE% (%OCPUS% OCPUs, %MEMORY_GB% GB)
echo Retry Interval: %RETRY_INTERVAL% seconds
echo.
echo Press Ctrl+C to stop at any time.
echo =============================================
echo.

set ATTEMPT=0

:retry_loop
set /a ATTEMPT+=1
echo.
echo =============================================
echo Attempt #%ATTEMPT% - %date% %time%
echo =============================================

REM Read SSH key
set /p SSH_KEY=<%SSH_KEY_FILE%

REM Try to create the instance
oci compute instance launch ^
    --compartment-id %COMPARTMENT_ID% ^
    --availability-domain %AVAILABILITY_DOMAIN% ^
    --shape %SHAPE% ^
    --shape-config "{\"ocpus\": %OCPUS%, \"memoryInGBs\": %MEMORY_GB%}" ^
    --image-id %IMAGE_ID% ^
    --display-name %INSTANCE_NAME% ^
    --assign-public-ip true ^
    --metadata "{\"ssh_authorized_keys\": \"%SSH_KEY%\"}" ^
    --wait-for-state RUNNING ^
    --max-wait-seconds 600 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =============================================
    echo SUCCESS! Instance created!
    echo =============================================
    echo.
    echo Your Starsector server is now running!
    echo Check the Oracle Console for the public IP address.
    echo.
    pause
    exit /b 0
)

echo.
echo Failed - likely out of capacity. Will retry in %RETRY_INTERVAL% seconds...
echo.

REM Wait before retrying
timeout /t %RETRY_INTERVAL% /nobreak

goto retry_loop
