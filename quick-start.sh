#!/bin/bash

echo "🚀 B.Com Exam Prep Ecosystem - Quick Start Script"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error above."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file not found. Creating template..."
    cp env.example .env.local
    echo "📝 Please edit .env.local with your Firebase configuration"
    echo "🔑 You can get these values from your Firebase project console"
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📥 Installing Firebase CLI..."
    npm install -g firebase-tools
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI. Please install manually:"
        echo "npm install -g firebase-tools"
    else
        echo "✅ Firebase CLI installed successfully"
    fi
else
    echo "✅ Firebase CLI detected"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error above."
    exit 1
fi

echo "✅ Build successful"

echo ""
echo "🎉 Setup complete! Here's what to do next:"
echo ""
echo "1. 🔥 Set up Firebase project:"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create a new project"
echo "   - Enable Authentication (Google OAuth)"
echo "   - Enable Firestore Database"
echo "   - Enable Hosting"
echo ""
echo "2. ⚙️  Configure environment variables:"
echo "   - Edit .env.local with your Firebase config"
echo "   - Get values from Firebase project settings"
echo ""
echo "3. 🚀 Start development server:"
echo "   npm run dev"
echo ""
echo "4. 🧪 Test Firebase emulators:"
echo "   firebase emulators:start"
echo ""
echo "5. 📚 Read the deployment guide:"
echo "   DEPLOYMENT.md"
echo ""
echo "6. ✅ Check production readiness:"
echo "   PRODUCTION_CHECKLIST.md"
echo ""
echo "Need help? Check the documentation or create an issue in the repository."
echo ""
echo "Happy coding! 🎓✨"
