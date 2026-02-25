import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    Auth,
    User as FirebaseUser,
} from 'firebase/auth';

// Firebase config from environment variables (set in vite.config.ts define)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
};

// Only initialize Firebase if config is present
const hasFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== '';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('profile');
        googleProvider.addScope('email');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

export const isFirebaseEnabled = (): boolean => {
    return hasFirebaseConfig && auth !== null;
};

export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    if (!auth || !googleProvider) {
        throw new Error('Firebase is not configured. Add FIREBASE_API_KEY and other Firebase env vars to enable Google Sign-In.');
    }

    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error('Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            return null; // User closed the popup
        }
        throw error;
    }
};

export const firebaseSignOut = async (): Promise<void> => {
    if (auth) {
        await signOut(auth);
    }
};

export const onFirebaseAuthChanged = (callback: (user: FirebaseUser | null) => void): (() => void) => {
    if (!auth) {
        // Return no-op unsubscribe if Firebase is not initialized
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
};

export type { FirebaseUser };
