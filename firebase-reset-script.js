// Firebase Console Reset Script
// Copy and paste this into your Firebase Console > Firestore > Functions tab

// Reset all user performance data to start fresh
async function resetAllUserData() {
  try {
    console.log('🚀 Starting performance data reset...');
    
    // Get all users
    const usersSnapshot = await firebase.firestore().collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users to reset`);
    
    let resetCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🔄 Resetting data for user: ${userId}`);
      
      try {
        // Reset user analytics
        await firebase.firestore().collection('userAnalytics').doc(userId).set({
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
        const eventsSnapshot = await firebase.firestore()
          .collection('userBehaviorEvents')
          .where('userId', '==', userId)
          .get();
        
        const deletePromises = eventsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log(`🗑️ Deleted ${eventsSnapshot.size} behavior events`);
        
        // Delete all user sessions
        const sessionsSnapshot = await firebase.firestore()
          .collection('userSessions')
          .where('userId', '==', userId)
          .get();
        
        const deleteSessionPromises = sessionsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteSessionPromises);
        console.log(`🗑️ Deleted ${sessionsSnapshot.size} user sessions`);
        
        // Delete all test attempts
        const testAttemptsSnapshot = await firebase.firestore()
          .collection('testAttempts')
          .where('userId', '==', userId)
          .get();
        
        const deleteTestPromises = testAttemptsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteTestPromises);
        console.log(`🗑️ Deleted ${testAttemptsSnapshot.size} test attempts`);
        
        // Delete all performance data
        const performanceSnapshot = await firebase.firestore()
          .collection('performance')
          .where('userId', '==', userId)
          .get();
        
        const deletePerformancePromises = performanceSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePerformancePromises);
        console.log(`🗑️ Deleted ${performanceSnapshot.size} performance records`);
        
        resetCount++;
        console.log(`✅ Reset completed for user: ${userId}`);
        
      } catch (error) {
        console.error(`❌ Error resetting user ${userId}:`, error);
      }
    }
    
    console.log(`🎉 Reset completed for ${resetCount} users!`);
    console.log('🔄 All performance data has been reset to zero.');
    console.log('📱 Refresh your application to see the fresh start!');
    
  } catch (error) {
    console.error('❌ Fatal error during reset:', error);
  }
}

// Run the reset function
resetAllUserData();

// You can also run individual resets:
// resetAllUserData(); // Run this to reset everything
