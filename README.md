# B.Com Exam Prep Ecosystem

A comprehensive web application designed specifically for Osmania University B.Com students to excel in their examinations through personalized study plans, AI-powered tutoring, and extensive practice tests.

## 🚀 Features

### 🔐 Authentication
- **Google Firebase Authentication** - Secure login with Google accounts
- **User Profile Management** - Complete profile setup with stream and semester selection
- **Protected Routes** - Secure access to application features

### 📊 Dashboard
- **Performance Analytics** - Visual charts showing progress trends
- **Subject-wise Progress** - Track performance across all B.Com subjects
- **Recent Activity** - Monitor study sessions and test completions
- **Upcoming Tasks** - Stay organized with personalized task management

### 🤖 AI Tutor
- **Intelligent Chat Interface** - Natural language conversations
- **Subject-specific Help** - Specialized assistance for complex topics like Cost Accounting
- **Step-by-step Guidance** - Detailed explanations for problem-solving
- **Motivational Support** - Encouraging feedback and progress tracking

### 📝 Practice Tests
- **Exam-format Tests** - Mirror Osmania University's 80U+20I structure
- **Multiple Question Types** - MCQs, numerical problems, coding exercises, case studies
- **Real-time Testing** - Timed tests with automatic submission
- **Detailed Feedback** - Instant scoring with explanations

### 📚 Subjects Coverage
- **Complete Syllabus** - All B.Com subjects across 6 semesters
- **Stream-specific Content** - General and Computer Applications streams
- **Performance Tracking** - Subject-wise progress monitoring
- **Study Recommendations** - Personalized suggestions based on weak areas

### 📅 Study Plans
- **Personalized Scheduling** - Adaptive plans based on exam dates and preferences
- **Task Management** - Daily and weekly study tasks with priority levels
- **Progress Tracking** - Visual completion rates and streak counters
- **Time Management** - Efficient syllabus coverage strategies

### 📈 Performance Analytics
- **Comprehensive Metrics** - Overall scores, test completion rates, study hours
- **Trend Analysis** - Weekly and monthly performance trends
- **Weak Area Identification** - Focus areas for improvement
- **Achievement Tracking** - Study streaks and milestones

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard widgets and analytics
│   ├── AITutor/        # AI chat interface
│   ├── PracticeTests/  # Test interface and management
│   ├── Subjects/       # Subject listing and details
│   ├── Performance/    # Performance analytics
│   ├── StudyPlan/      # Study planning interface
│   ├── Profile/        # User profile management
│   └── Layout/         # Navigation and layout components
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── services/           # Firebase service functions
├── types/              # TypeScript type definitions
├── data/               # Mock data and constants
└── config/             # Firebase configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bcom-exam-prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Enable Cloud Firestore
   - Copy your Firebase config and update `src/config/firebase.ts`

4. **Update Firebase Configuration**
   ```typescript
   // src/config/firebase.ts
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Firebase Setup Guide

### 1. Authentication Setup
- Go to Firebase Console → Authentication → Sign-in method
- Enable Google provider
- Add your domain to authorized domains (including localhost:5173 for development)
- Make sure to add both http://localhost:5173 and https://localhost:5173 to authorized domains

### 2. Firestore Database Setup
- Go to Firebase Console → Firestore Database
- Create database in production mode
- Set up the following collections:
  - `users` - User profiles
  - `studyPlans` - User study plans
  - `testAttempts` - Test completion records
  - `performance` - Performance analytics
  - `userActivities` - Activity logs

### 3. Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Study plans - user-specific
    match /studyPlans/{planId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Test attempts - user-specific
    match /testAttempts/{attemptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Performance data - user-specific
    match /performance/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User activities - user-specific
    match /userActivities/{activityId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1024px+) - Full sidebar navigation
- **Tablet** (768px-1023px) - Collapsible sidebar
- **Mobile** (320px-767px) - Bottom navigation

## 🎯 Key Features for B.Com Students

### Subject Coverage
- **Financial Accounting** (MJR101)
- **Business Organization and Management** (MJR102)
- **Business Economics** (MJR103)
- **Programming with C & C++** (MJR203)
- **Cost Accounting** (MJR501)
- **Web Technologies** (MJR403)
- And many more across all semesters

### Exam Preparation
- **80U+20I Format** - Matches Osmania University exam structure
- **Time Management** - Realistic exam timing
- **Question Variety** - MCQs, numerical, coding, case studies
- **Instant Feedback** - Detailed explanations and scoring

### AI Tutor Capabilities
- **Complex Topic Explanation** - Simplifies Cost Accounting, Statistics
- **Problem Solving** - Step-by-step guidance
- **Motivational Support** - Encouraging progress feedback
- **24/7 Availability** - Always ready to help

## 🔒 Security & Privacy

- **Firebase Authentication** - Industry-standard security
- **Data Encryption** - All data encrypted in transit and at rest
- **Privacy Compliance** - GDPR and DPDPA compliant
- **Secure Access** - Protected routes and user-specific data

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎉 Acknowledgments

- Osmania University for the comprehensive B.Com syllabus
- Firebase for robust backend services
- React and TypeScript communities
- All contributors and testers

---

**Made with ❤️ for B.Com students at Osmania University**