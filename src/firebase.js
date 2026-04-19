import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDc3gGZ-VmI-XQxzvP2P0FctF7ESAv1vW0",
  authDomain: "photography-c52f5.firebaseapp.com",
  projectId: "photography-c52f5",
  storageBucket: "photography-c52f5.firebasestorage.app",
  messagingSenderId: "855807359130",
  appId: "1:855807359130:web:75a48a460d8a868aaf0723",
  measurementId: "G-QFFV16WT7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;