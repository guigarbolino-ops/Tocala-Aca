import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId and auto-detect long polling for reliable connectivity in iframe/sandbox environments
const firestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
};

let firestoreInstance;
try {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, firestoreSettings);
} catch {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

export default app;
