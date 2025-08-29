// Reset Performance Data Script
// Run this in Firebase Console or as a Cloud Function

const admin = require('firebase-admin');

// Initialize Firebase Admin (if running as Cloud Function)
// admin.initializeApp();

const db = admin.firestore();

async function resetUserPerformanceData() {
  try {
    console.log('Starting performance data reset...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Resetting data for user: ${userId}`);
      
      // Reset user analytics
      await db.collection('userAnalytics').doc(userId).set({
        userId: userId,
        totalSessions: 0,
        totalStudyTime: 0,
        totalTestsTaken: 0,
        averageTestScore: 0,
        favoriteSubjects: [],
        studyStreak: 0,
        lastActive: new Date().toISOString(),
        engagementScore: 0,
        learningProgress: {
          subjects: {},
          overall: 0
        }
      });
      
      // Delete all user behavior events
      const eventsSnapshot = await db.collection('userBehaviorEvents')
        .where('userId', '==', userId)
        .get();
      
      const deletePromises = eventsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      
      // Delete all user sessions
      const sessionsSnapshot = await db.collection('userSessions')
        .where('userId', '==', userId)
        .get();
      
      const deleteSessionPromises = sessionsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deleteSessionPromises);
      
      // Delete all test attempts
      const testAttemptsSnapshot = await db.collection('testAttempts')
        .where('userId', '==', userId)
        .get();
      
      const deleteTestPromises = testAttemptsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deleteTestPromises);
      
      // Delete all performance data
      const performanceSnapshot = await db.collection('performance')
        .where('userId', '==', userId)
        .get();
      
      const deletePerformancePromises = performanceSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePerformancePromises);
      
      console.log(`✅ Reset completed for user: ${userId}`);
    }
    
    console.log('🎉 All user performance data has been reset successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting performance data:', error);
  }
}

// Export for Cloud Function
module.exports = { resetUserPerformanceData };

// Run if called directly
if (require.main === module) {
  resetUserPerformanceData();
}
