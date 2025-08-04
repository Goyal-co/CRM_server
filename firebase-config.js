// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4XNbz-mV18YNuNWgWPrPAzDg9y6Il93s",
  authDomain: "titan-crm-99121.firebaseapp.com",
  projectId: "titan-crm-99121",
  storageBucket: "titan-crm-99121.firebasestorage.app",
  messagingSenderId: "572699140517",
  appId: "1:572699140517:web:4609cd371a8085e169484c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, app };