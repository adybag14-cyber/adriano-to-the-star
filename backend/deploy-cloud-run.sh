#!/bin/bash

# Google Cloud Run Deployment Script for Stellar AI Backend
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
# 4. Enable APIs: gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Configuration
PROJECT_ID="adriano-broadband"  # Your Google Cloud project ID
REGION="europe-west2"            # London region
SERVICE_NAME="stellar-ai-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Environment variables
LIVEKIT_URL="${LIVEKIT_URL:-wss://gemini-integration-pxcg6ngt.livekit.cloud}"
LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-}"
LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-}"
GOOGLE_API_KEY="${GOOGLE_API_KEY:-}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
CEREBRAS_API_KEY="${CEREBRAS_API_KEY:-}"
STELLAR_AI_PORT="${STELLAR_AI_PORT:-8080}"

if [ -z "${GEMINI_API_KEY}" ] && [ -n "${GOOGLE_API_KEY}" ]; then
    GEMINI_API_KEY="${GOOGLE_API_KEY}"
fi
if [ -z "${GOOGLE_API_KEY}" ] && [ -n "${GEMINI_API_KEY}" ]; then
    GOOGLE_API_KEY="${GEMINI_API_KEY}"
fi

if [ -z "${LIVEKIT_API_KEY}" ]; then
    echo "LIVEKIT_API_KEY is not set" >&2
    exit 1
fi
if [ -z "${LIVEKIT_API_SECRET}" ]; then
    echo "LIVEKIT_API_SECRET is not set" >&2
    exit 1
fi
if [ -z "${GEMINI_API_KEY}" ]; then
    echo "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set" >&2
    exit 1
fi

SET_ENV_VARS="LIVEKIT_URL=$LIVEKIT_URL,LIVEKIT_API_KEY=$LIVEKIT_API_KEY,LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,GOOGLE_API_KEY=$GOOGLE_API_KEY,GEMINI_API_KEY=$GEMINI_API_KEY,STELLAR_AI_PORT=$STELLAR_AI_PORT"
if [ -n "${CEREBRAS_API_KEY}" ]; then
    SET_ENV_VARS="${SET_ENV_VARS},CEREBRAS_API_KEY=${CEREBRAS_API_KEY}"
else
    echo "Warning: CEREBRAS_API_KEY is not set. Cerebras proxy endpoint will return cerebras_api_key_missing." >&2
fi

echo "🚀 Deploying Stellar AI Backend to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
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
    --timeout 300 \
    --min-instances 0 \
    --max-instances 10 \
    --port 8080 \
    --set-env-vars "$SET_ENV_VARS" \
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
    echo ""
    echo "⚠️  Note: Update the frontend to use this backend URL for LiveKit token generation"
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

