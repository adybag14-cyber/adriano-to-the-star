#!/bin/bash

# Google Cloud Function Deployment Script for Broadband Price Scraper
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID

# Configuration - Update these values
PROJECT_ID="your-project-id"  # Replace with your Google Cloud project ID
REGION="europe-west2"          # London region for UK broadband data
FUNCTION_NAME="broadband-price-scraper"
GEMINI_API_KEY="GEMINI_API_KEY_2"

echo "🚀 Deploying Broadband Price Scraper to Google Cloud Functions..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"
echo ""

# Deploy the single price function
echo "📦 Deploying get_broadband_price function..."
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=python311 \
    --region=$REGION \
    --source=. \
    --entry-point=get_broadband_price \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=60s \
    --max-instances=10 \
    --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY,USE_GEMINI_LIVE=true" \
    --project=$PROJECT_ID \
    --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Function URL:"
    gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --format='value(serviceConfig.uri)'
    echo ""
    echo "Test with:"
    echo "curl 'https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME?provider=BT'"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

