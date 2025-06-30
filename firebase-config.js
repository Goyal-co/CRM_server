// Firebase configuration for backend
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkmFLpWPDcjkzK3tYE0g0gNx4fxU74V8c",
  authDomain: "test-539e9.firebaseapp.com",
  projectId: "test-539e9",
  storageBucket: "test-539e9.firebasestorage.app",
  messagingSenderId: "1029641902756",
  appId: "1:1029641902756:web:3d5523acfaf6133954a431",
  measurementId: "G-NXL1RJJD0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and Firestore
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app; 