import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    GoogleAuthProvider,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if critical configuration values are present
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== ''
);

let app = null;
let auth = null;
let analytics = null;
let googleProvider = null;

if (isFirebaseConfigured) {
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        // Ensure auth session persists across browser reloads
        setPersistence(auth, browserLocalPersistence).catch((err) => {
            console.warn('Could not set browser local persistence for Firebase Auth:', err);
        });
        googleProvider = new GoogleAuthProvider();

        // Optional Analytics (only runs in supported browser environments)
        if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
            isSupported().then((supported) => {
                if (supported && app) {
                    analytics = getAnalytics(app);
                }
            }).catch(() => {});
        }
    } catch (err) {
        console.error('Firebase initialization failed:', err);
    }
} else {
    console.warn(
        '[Firebase Notice]: Firebase client environment variables are not yet configured in client/.env.\n' +
        'Authentication will operate in standby/unconfigured mode until credentials are provided.'
    );
}

export { app, auth, analytics, googleProvider };
export default auth;

