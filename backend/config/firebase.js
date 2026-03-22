const admin = require('firebase-admin');
const path = require('path');

let db;

const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      let serviceAccount;
      try {
        serviceAccount = require('./serviceAccountKey.json');
      } catch (err) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else {
          throw new Error('Missing Firebase Admin Credentials! Use serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var');
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔥 Firebase Admin initialized successfully');
    }
    db = admin.firestore();
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    return initFirebase();
  }
  return db;
};

module.exports = { initFirebase, getDb, admin };
