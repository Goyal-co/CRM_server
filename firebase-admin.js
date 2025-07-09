// firebase-admin.js
import admin from 'firebase-admin';
import serviceAccount from './google-service-account.json' assert { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'test-539e9.appspot.com',
  });
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export default admin; 