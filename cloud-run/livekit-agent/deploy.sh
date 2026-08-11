#!/bin/bash

# Google Cloud Run Deployment Script for LiveKit Agent
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
# 4. Enable APIs: gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Configuration - Update these values
PROJECT_ID="adriano-broadband"  # Your Google Cloud project ID
REGION="europe-west2"            # London region (or your preferred region)
SERVICE_NAME="livekit-agent"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Environment variables (set as secrets in production)
LIVEKIT_URL="${LIVEKIT_URL:-wss://gemini-integration-pxcg6ngt.livekit.cloud}"
GOOGLE_API_KEY="${GOOGLE_API_KEY:-${GEMINI_API_KEY:-}}"

if [ -z "${GOOGLE_API_KEY}" ]; then
    echo "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set" >&2
    exit 1
fi

echo "🚀 Deploying LiveKit Agent to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
gcloud builds submit --tag $IMAGE_NAME --project=$PROJECT_ID --suppress-logs

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 3600 \
    --min-instances 1 \
    --max-instances 1 \
    --set-env-vars "LIVEKIT_URL=$LIVEKIT_URL,GOOGLE_API_KEY=$GOOGLE_API_KEY" \
    --set-secrets "LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest" \
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
    echo "⚠️  Note: For production, set secrets in Secret Manager:"
    echo "  gcloud secrets create LIVEKIT_API_KEY --data-file=-"
    echo "  gcloud secrets create LIVEKIT_API_SECRET --data-file=-"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

