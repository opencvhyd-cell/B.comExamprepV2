import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Hook for real-time document listening
export const useDocument = <T = DocumentData>(collectionName: string, documentId: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error listening to document ${documentId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
};

// Hook for real-time collection listening
export const useCollection = <T = DocumentData>(
  collectionName: string, 
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error listening to collection ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

// Separate hook for user analytics (document-based)
export const useUserAnalytics = <T = DocumentData>(userId: string | null) => {
  return useDocument<T>('userAnalytics', userId || '');
};

// Separate hook for user-specific collections
export const useUserCollection = <T = DocumentData>(
  collectionName: string,
  userId: string | null,
  additionalConstraints: QueryConstraint[] = []
) => {
  const supportsUserId = ['studyPlans', 'testAttempts', 'aiTutorSessions', 'practiceTests'].includes(collectionName);
  const constraints = userId && supportsUserId
    ? [where('userId', '==', userId), ...additionalConstraints]
    : additionalConstraints;

  return useCollection<T>(collectionName, constraints);
};