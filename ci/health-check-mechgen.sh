#!/usr/bin/env bash
# ci/health-check-mechgen.sh

set -e

PROJECT_ID="adriano-broadband"
REGION="europe-west2"
SERVICE_NAME="mechgen-web"

echo " Fetching Service URL for $SERVICE_NAME..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format "value(status.url)")

if [ -z "$SERVICE_URL" ]; then
    echo " Could not find service URL"
    exit 1
fi

echo " Checking health at $SERVICE_URL/api/health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health")

if [ "$STATUS" -eq 200 ]; then
    echo " Mechgen Web is Healthy"
else
    echo " Mechgen Web health check failed with status $STATUS"
    exit 1
fi
