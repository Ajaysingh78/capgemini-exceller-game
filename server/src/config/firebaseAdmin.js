import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let isFirebaseConfigured = false;
let firebaseApp = null;
let firebaseAuth = null;

// Format private key properly if supplied via single-line env variable
const formatPrivateKey = (key) => {
    if (!key) return undefined;
    return key.replace(/\\n/g, '\n');
};

const initializeFirebaseAdmin = () => {
    if (getApps().length > 0) {
        isFirebaseConfigured = true;
        firebaseApp = getApp();
        firebaseAuth = getAuth(firebaseApp);
        return { app: firebaseApp, auth: firebaseAuth };
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const googleAppCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    try {
        if (projectId && clientEmail && privateKey) {
            firebaseApp = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            firebaseAuth = getAuth(firebaseApp);
            isFirebaseConfigured = true;
            console.log('✅ Firebase Admin SDK initialized successfully with individual credentials.');
        } else if (googleAppCredentials) {
            firebaseApp = initializeApp({
                credential: applicationDefault(),
            });
            firebaseAuth = getAuth(firebaseApp);
            isFirebaseConfigured = true;
            console.log('✅ Firebase Admin SDK initialized successfully via GOOGLE_APPLICATION_CREDENTIALS.');
        } else {
            console.log('\n===========================================================');
            console.log('⚠️  [Firebase Admin Notice]: Firebase credentials not found in server/.env');
            console.log('👉 To verify client ID tokens securely, add:');
            console.log('   FIREBASE_PROJECT_ID=your-project-id');
            console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com');
            console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
            console.log('   (Server running in development fallback mode for auth verification)');
            console.log('===========================================================\n');
            isFirebaseConfigured = false;
        }
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization error:', error.message);
        isFirebaseConfigured = false;
    }

    return { app: firebaseApp, auth: firebaseAuth };
};

const { app, auth } = initializeFirebaseAdmin();

export const isFirebaseReady = () => isFirebaseConfigured;
export const getAdminAuth = () => firebaseAuth || (firebaseApp ? getAuth(firebaseApp) : null);
export { app, auth };
export default { app, auth, isFirebaseReady, getAdminAuth };
