// firebase-admin.js
import admin from 'firebase-admin';
import fs from 'fs';
const serviceAccount = JSON.parse(fs.readFileSync('./google-service-account.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'test-539e9.appspot.com',
  });
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export default admin; 