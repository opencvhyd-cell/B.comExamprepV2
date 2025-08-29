// Test Firebase connection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkq-GrrNTPhdrp8ba-s1zz5oPbvZB43jQ",
  authDomain: "symbolic-tape-469105-h1.firebaseapp.com",
  projectId: "symbolic-tape-469105-h1",
  storageBucket: "symbolic-tape-469105-h1.firebasestorage.app",
  messagingSenderId: "600632816207",
  appId: "1:600632816207:web:2f0a006b84984487bff03a"
};

console.log('Testing Firebase connection...');
console.log('Config:', { ...firebaseConfig, apiKey: '***' });

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
  
  // Initialize Firestore
  const db = getFirestore(app);
  console.log('✅ Firestore initialized');
  
  // Test connection
  const testCollection = collection(db, 'studyPlans');
  console.log('✅ Collection reference created');
  
  const testQuery = query(testCollection, limit(1));
  console.log('✅ Query created');
  
  // This will fail if there are permission issues
  getDocs(testQuery)
    .then(snapshot => {
      console.log('✅ Database connection successful! Found', snapshot.size, 'documents');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database query failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  process.exit(1);
}
