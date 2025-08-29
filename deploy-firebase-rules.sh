#!/bin/bash

echo "🚀 Deploying Firebase Firestore Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    echo "firebase login"
    exit 1
fi

# Deploy only the Firestore rules
firebase deploy --only firestore:rules

echo "✅ Firebase rules deployed successfully!"
echo "🔍 You can now test the AI Test Generator"
