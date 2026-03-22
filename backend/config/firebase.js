const admin = require('firebase-admin');
const path = require('path');

let db;

const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = require('./serviceAccountKey.json');
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
