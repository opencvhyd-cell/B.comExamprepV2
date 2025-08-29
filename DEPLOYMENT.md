# 🚀 Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created
- GitHub repository with proper access

## 🔧 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `bcom-exam-prep-ecosystem`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Services

#### Authentication
1. Go to Authentication → Sign-in method
2. Enable Google provider
3. Add authorized domains:
   - `localhost` (for development)
   - Your production domain

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location (choose closest to your users)

#### Hosting
1. Go to Hosting
2. Click "Get started"
3. Follow the setup wizard

### 3. Get Firebase Configuration

1. Go to Project Settings → General
2. Scroll down to "Your apps"
3. Click the web app icon (</>)
4. Copy the config object

### 4. Set Environment Variables

Create `.env.local` file in your project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# App Configuration
VITE_APP_NAME="B.Com Exam Prep Ecosystem"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENV="production"

# AI Configuration (optional)
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_AI_MODEL=gpt-3.5-turbo
```

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Firebase Emulators

```bash
# Start emulators
firebase emulators:start

# In another terminal, start dev server
npm run dev
```

## 🧪 Testing

### 1. Run Linting

```bash
npm run lint
```

### 2. Run Tests

```bash
npm test
```

### 3. Build Test

```bash
npm run build
npm run preview
```

## 🚀 Production Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Deploy to Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Deploy
firebase deploy
```

### 3. Verify Deployment

1. Check your Firebase hosting URL
2. Test all major functionality
3. Verify authentication works
4. Check Firestore rules are working

## 🔒 Security Configuration

### 1. Firestore Rules

The security rules are already configured in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 2. Authentication Rules

Ensure your Firebase project has proper authentication settings:
- Disable unused sign-in methods
- Set up proper password policies
- Configure session timeout

### 3. Environment Variables

Never commit `.env.local` to version control. Add it to `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
```

## 📊 Monitoring & Analytics

### 1. Firebase Analytics

1. Enable Google Analytics in Firebase
2. Track user engagement
3. Monitor performance metrics

### 2. Error Tracking

Consider integrating error tracking services:
- Sentry
- LogRocket
- Firebase Crashlytics

### 3. Performance Monitoring

- Use Firebase Performance Monitoring
- Monitor Core Web Vitals
- Track API response times

## 🔄 CI/CD Setup

### 1. GitHub Secrets

Add these secrets to your GitHub repository:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON service account key)

### 2. Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire content to GitHub secret `FIREBASE_SERVICE_ACCOUNT`

### 3. Automatic Deployment

The GitHub Actions workflow will automatically:
- Run tests on pull requests
- Deploy to production on main branch push
- Run security checks
- Build and deploy to Firebase

## 🚨 Production Checklist

### Before Deployment

- [ ] All tests passing
- [ ] Linting clean
- [ ] Environment variables set
- [ ] Firebase project configured
- [ ] Security rules tested
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design tested

### After Deployment

- [ ] Authentication working
- [ ] Database operations working
- [ ] AI tutor functioning
- [ ] Practice tests working
- [ ] Study plans working
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Analytics tracking
- [ ] SSL certificate active
- [ ] Domain configured

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify dependencies
   - Check TypeScript errors

2. **Firebase Connection Issues**
   - Verify API keys
   - Check Firestore rules
   - Verify authentication setup

3. **Performance Issues**
   - Check bundle size
   - Optimize images
   - Enable code splitting

4. **Authentication Issues**
   - Check authorized domains
   - Verify Google OAuth setup
   - Check Firestore rules

### Support

- Check Firebase documentation
- Review error logs
- Test with emulators
- Check browser console

## 📈 Post-Deployment

### 1. Monitor Performance

- Page load times
- API response times
- User engagement metrics
- Error rates

### 2. User Feedback

- Collect user feedback
- Monitor support requests
- Track feature usage
- Identify pain points

### 3. Continuous Improvement

- Regular security updates
- Performance optimizations
- Feature enhancements
- Bug fixes

## 🎯 Success Metrics

- **Performance**: < 3s initial load
- **Reliability**: 99.9% uptime
- **Security**: Zero critical vulnerabilities
- **User Experience**: < 2 clicks to complete tasks
- **Scalability**: Support 1000+ concurrent users

---

**Remember**: Security first, test thoroughly, monitor continuously!
