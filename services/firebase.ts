import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    Auth,
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult
} from 'firebase/auth';

// Firebase config from environment variables (set in vite.config.ts define)
// .trim() strips any stray whitespace/newlines injected by CI env var tools
const firebaseConfig = {
    apiKey: (process.env.FIREBASE_API_KEY || '').trim(),
    authDomain: (process.env.FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (process.env.FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (process.env.FIREBASE_APP_ID || '').trim(),
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

// --- Real Email & Password Auth ---
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser> => {
    if (!auth) throw new Error('Firebase is not configured.');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
};

export const signUpWithEmailAndPassword = async (email: string, password: string, name: string): Promise<FirebaseUser> => {
    if (!auth) throw new Error('Firebase is not configured.');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
};

// --- Real Phone OTP Verification ---
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    if (!auth) throw new Error('Firebase is not configured.');
    return new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber
        }
    });
};

export const startPhoneVerification = async (phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    if (!auth) throw new Error('Firebase is not configured.');
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export type { FirebaseUser, ConfirmationResult, RecaptchaVerifier };
