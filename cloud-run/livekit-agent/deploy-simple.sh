#!/bin/bash

# Simple Google Cloud Run Deployment Script for LiveKit Agent
# Uses environment variables directly (no secrets required)

# Configuration
PROJECT_ID="adriano-broadband"  # Your Google Cloud project ID
REGION="europe-west2"            # London region
SERVICE_NAME="livekit-agent"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Environment variables
LIVEKIT_URL="${LIVEKIT_URL:-wss://gemini-integration-pxcg6ngt.livekit.cloud}"
LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-}"
LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-}"
GOOGLE_API_KEY="${GOOGLE_API_KEY:-${GEMINI_API_KEY:-}}"

if [ -z "${LIVEKIT_API_KEY}" ]; then
    echo "LIVEKIT_API_KEY is not set" >&2
    exit 1
fi
if [ -z "${LIVEKIT_API_SECRET}" ]; then
    echo "LIVEKIT_API_SECRET is not set" >&2
    exit 1
fi
if [ -z "${GOOGLE_API_KEY}" ]; then
    echo "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set" >&2
    exit 1
fi

echo "🚀 Deploying LiveKit Agent to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Build and deploy
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 3600 \
    --min-instances 1 \
    --max-instances 1 \
    --set-env-vars "LIVEKIT_URL=$LIVEKIT_URL,LIVEKIT_API_KEY=$LIVEKIT_API_KEY,LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,GOOGLE_API_KEY=$GOOGLE_API_KEY" \
    --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Service URL:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'
    echo ""
    echo "View logs:"
    echo "gcloud run logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

