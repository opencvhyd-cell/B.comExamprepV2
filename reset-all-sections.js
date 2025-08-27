// Firebase Console Reset Script
// Run this in Firebase Console > Firestore Database > Scripts

// This script will reset all user data to ensure fresh start for new users

console.log('🚀 Starting complete data reset...');

// Function to delete all documents in a collection
function deleteCollection(collectionName) {
  console.log(`🗑️ Deleting collection: ${collectionName}`);
  
  // Get all documents in the collection
  const documents = db.collection(collectionName).get();
  
  // Delete each document
  documents.forEach(doc => {
    doc.ref.delete();
    console.log(`   Deleted document: ${doc.id}`);
  });
  
  console.log(`✅ Completed deletion of ${collectionName}`);
}

// Function to reset user analytics to zero
function resetUserAnalytics() {
  console.log('📊 Resetting user analytics...');
  
  const users = db.collection('users').get();
  
  users.forEach(userDoc => {
    const analyticsRef = db.collection('userAnalytics').doc(userDoc.id);
    
    analyticsRef.set({
      totalSessions: 0,
      totalStudyTime: 0,
      totalTestsTaken: 0,
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      studyStreak: 0,
      learningProgress: {
        overall: 0,
        subjects: {}
      },
      engagementScore: 0,
      lastActive: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`   Reset analytics for user: ${userDoc.id}`);
  });
  
  console.log('✅ User analytics reset completed');
}

// Main reset function
async function resetAllData() {
  try {
    console.log('🔄 Starting comprehensive data reset...');
    
    // 1. Delete user behavior events
    deleteCollection('userBehaviorEvents');
    
    // 2. Delete user sessions
    deleteCollection('userSessions');
    
    // 3. Delete test attempts
    deleteCollection('testAttempts');
    
    // 4. Delete performance data
    deleteCollection('performance');
    
    // 5. Delete study plans
    deleteCollection('studyPlans');
    
    // 6. Delete AI tutor conversations
    deleteCollection('aiTutorConversations');
    
    // 7. Delete subject progress
    deleteCollection('subjectProgress');
    
    // 8. Delete study sessions
    deleteCollection('studySessions');
    
    // 9. Delete notifications
    deleteCollection('notifications');
    
    // 10. Reset user analytics to zero
    resetUserAnalytics();
    
    console.log('🎉 All data reset completed successfully!');
    console.log('✨ Users will now see fresh start dashboard with 0% performance');
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
  }
}

// Execute the reset
resetAllData();

// Alternative: Manual collection deletion commands
// Run these one by one if the function approach doesn't work:

/*
// Delete userBehaviorEvents
db.collection('userBehaviorEvents').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete userSessions
db.collection('userSessions').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete userAnalytics
db.collection('userAnalytics').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete testAttempts
db.collection('testAttempts').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete performance
db.collection('performance').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete studyPlans
db.collection('studyPlans').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete aiTutorConversations
db.collection('aiTutorConversations').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete subjectProgress
db.collection('subjectProgress').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete studySessions
db.collection('studySessions').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});

// Delete notifications
db.collection('notifications').get().then(snapshot => {
  snapshot.forEach(doc => doc.ref.delete());
});
*/
