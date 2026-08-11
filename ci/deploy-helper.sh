#!/bin/bash
set -ex

echo " Starting Deployment Helper..."

# Intelligent GCP Key Handling
KEY_PATH="$CI_PROJECT_DIR/gcp-sa-key.json"

if [ -z "$GCP_SA_KEY_B64" ]; then
    echo " GCP_SA_KEY_B64 is not set. Skipping GCP deployment logic."
    exit 0
fi

# Determine format and write key
if [[ "$GCP_SA_KEY_B64" =~ ^\{ ]]
then
    echo " JSON format detected..."
    echo "$GCP_SA_KEY_B64" > "$KEY_PATH"
elif [[ "$GCP_SA_KEY_B64" =~ ^[0-9a-fA-F]+$ ]]
then
    echo " Hex format detected..."
    echo "$GCP_SA_KEY_B64" | xxd -r -p > "$KEY_PATH"
else
    echo " Base64 format detected..."
    echo "$GCP_SA_KEY_B64" | base64 -d > "$KEY_PATH" 2>/dev/null || echo "$GCP_SA_KEY_B64" > "$KEY_PATH"
fi

if [ -f "$KEY_PATH" ]; then
    echo " Key written ($(stat -c%s "$KEY_PATH") bytes)"
    gcloud auth activate-service-account --key-file="$KEY_PATH" --quiet
    gcloud config set project "$PROJECT_ID" --quiet
    
    if [ -f "mechgen_web/deploy.sh" ]; then
        bash mechgen_web/deploy.sh
    else
        gcloud run deploy "$SERVICE_NAME" --source ./mechgen_web --region "$REGION" --allow-unauthenticated --quiet
    fi
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format "value(status.url)")
    echo "${SERVICE_URL}/" > mechgen_backend_url.txt
    echo " Exported URL: $SERVICE_URL"
else
    echo " Failed to create GCP Key"
    exit 1
fi
