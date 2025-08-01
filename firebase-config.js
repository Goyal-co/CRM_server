// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4XNbz-mV18YNuNWgWPrPAzDg9y6Il93s",
  authDomain: "titan-crm-99121.firebaseapp.com",
  projectId: "titan-crm-99121",
  storageBucket: "titan-crm-99121.firebasestorage.app",
  messagingSenderId: "572699140517",
  appId: "1:572699140517:web:4609cd371a8085e169484c",
  measurementId: "G-NDQ1D7G09K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);