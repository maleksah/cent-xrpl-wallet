#!/bin/bash

set -e

# Configuration
PROJECT_ID=par-sahnoun-sandbox
SERVICE_NAME="p-406-xrpl-wallet"
REGION="europe-west1"

echo "Using Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"

# Build and Push the image using Cloud Builds
echo "Building and pushing image using Google Cloud Builds..."
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/p405/${SERVICE_NAME}"
gcloud builds submit --tag ${IMAGE_PATH} .


# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud beta run deploy $SERVICE_NAME \
  --image ${IMAGE_PATH} \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --iap \
  --max 1


echo "Deployment complete!"
