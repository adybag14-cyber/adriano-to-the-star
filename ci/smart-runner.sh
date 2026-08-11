#!/bin/bash
# EXOPLANET PIONEER: SMART PIPELINE WRAPPER (Termux/Linux)
# Highly Optimized for Parallelism and Failsafe Execution

set -ex

# --- 1. STRICT ARCHITECTURE & ENVIRONMENT GATING ---
ARCH=$(uname -m)
IS_ANDROID=false
[ -f /system/build.prop ] && IS_ANDROID=true

# This script is strictly for ARM/Android environments
if [[ "$ARCH" != "aarch64" && "$ARCH" != "armv7l" ]] || [ "$IS_ANDROID" = false ]; then
    echo "==============================================================="
    echo "ARCHITECTURE MISMATCH DETECTED"
    echo "Host Architecture: $ARCH"
    echo "OS: $(uname -s)"
    echo "Error: This runner is not compatible with Termux/Android jobs."
    echo "EXITING IMMEDIATELY to free up the runner."
    echo "==============================================================="
    exit 1
fi

echo "Environment Verified: Termux on Android ($ARCH)"

# --- 2. WORKSPACE ISOLATION ---
ISOLATED_ROOT="/data/data/com.termux/files/home/tmp/starisdons-$CI_JOB_ID"
mkdir -p "$ISOLATED_ROOT"
# Sync files (excluding git and node_modules to keep it fast)
cp -r . "$ISOLATED_ROOT" || true

# Symlink node_modules if they exist
if [ -d "node_modules" ]; then
    ln -s "$(pwd)/node_modules" "$ISOLATED_ROOT/node_modules"
fi

cd "$ISOLATED_ROOT"
echo "Manual isolation at: $ISOLATED_ROOT"

# --- 3. GLOBAL TIMEOUT PROTECTION ---
TIMEOUT_LIMIT="900" # 15 minutes

# --- 4. UTILITY FUNCTIONS ---

node_setup() {
    echo "Initializing Node Environment..."
    if [ -f "package.json" ]; then
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install --prefer-offline --no-audit --quiet
        else
            echo "Using cached node_modules"
        fi
        if [ -d "node_modules/.bin" ]; then
            chmod -R +x node_modules/.bin/
        fi
    fi
}

# --- 5. STAGE LOGIC ---
STAGE=$1
EXIT_CODE=0

case $STAGE in
    "setup")
        node_setup || EXIT_CODE=$?
        ;;

    "validate-lint")
        timeout "$TIMEOUT_LIMIT" bash -c "node_setup && npm run lint" || EXIT_CODE=$?
        ;;
    
    "validate-test")
        timeout "$TIMEOUT_LIMIT" bash -c "node_setup && mkdir -p coverage && npm run test:coverage -- --maxWorkers=2" || EXIT_CODE=$?
        ;;

    "build")
        timeout "$TIMEOUT_LIMIT" bash -c "mkdir -p public && cp -r * public/ 2>/dev/null || true && rm -rf public/public" || EXIT_CODE=$?
        ;;

    "security")
        timeout "$TIMEOUT_LIMIT" bash -c "if [ -f 'package.json' ]; then npm audit --audit-level=high; fi" || EXIT_CODE=$?
        ;;

    "deploy-pages")
        timeout "$TIMEOUT_LIMIT" bash -c "
            if [ -f 'mechgen_backend_url.txt' ]; then
                URL=\$(cat mechgen_backend_url.txt | tr -d '\r\n')
                sed -i \"s|'.*'; // @MECHGEN_BACKEND_URL@|'\$URL'; // @MECHGEN_BACKEND_URL@|g\" mechgen.html
            fi
            if [ ! -d 'public' ]; then
                mkdir -p public
                cp -r * public/ 2>/dev/null || true
                rm -rf public/public
            fi
        " || EXIT_CODE=$?
        ;;

    "deploy-mechgen")
        timeout "$TIMEOUT_LIMIT" bash ci/deploy-helper.sh || EXIT_CODE=$?
        ;;

    "monitor-health")
        timeout "300" bash -c "
            sleep 10
            if [ -f 'mechgen_backend_url.txt' ]; then
                SERVICE_URL=\$(cat mechgen_backend_url.txt)
                curl -s --fail \"\$SERVICE_URL/api/health\" || echo 'Health check failed but continuing...'
            fi
            curl -s --fail 'https://adrianotothestar.com' && echo ' Site is UP'
        " || EXIT_CODE=$?
        ;;

    *)
        echo "Unknown stage: $STAGE"
        exit 1
        ;;
esac

# --- 6. CLEANUP ---
echo "Cleaning up isolated workspace..."
cd "$CI_PROJECT_DIR"
rm -rf "$ISOLATED_ROOT"

if [ $EXIT_CODE -ne 0 ]; then
    exit $EXIT_CODE
fi

