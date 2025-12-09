// Auth service with Firebase integration
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    User,
    UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Check for redirect result on app load
export const checkRedirectResult = async (): Promise<User | null> => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', result.user.email || '');
            return result.user;
        }
        return null;
    } catch (error: any) {
        console.error('Redirect result error:', error);
        return null;
    }
};

// Login with email and password
export const login = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', userCredential.user.email || email);
        return userCredential.user;
    } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(getErrorMessage(error.code));
    }
};

// Signup with email and password
export const signup = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', userCredential.user.email || email);
        return userCredential.user;
    } catch (error: any) {
        console.error('Signup error:', error);
        throw new Error(getErrorMessage(error.code));
    }
};

// Login with Google - try popup first, fallback to redirect
export const loginWithGoogle = async (): Promise<User> => {
    try {
        // Try popup first (works in dev mode)
        const userCredential: UserCredential = await signInWithPopup(auth, googleProvider);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', userCredential.user.email || '');
        return userCredential.user;
    } catch (error: any) {
        console.error('Google login popup error:', error);
        // If popup fails (common in Electron), try redirect
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            try {
                await signInWithRedirect(auth, googleProvider);
                // This won't return - page will redirect
                throw new Error('Redirecting to Google...');
            } catch (redirectError: any) {
                throw new Error(getErrorMessage(redirectError.code));
            }
        }
        throw new Error(getErrorMessage(error.code));
    }
};

// Logout
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
    } catch (error: any) {
        console.error('Logout error:', error);
        throw new Error('Failed to logout');
    }
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Helper function to convert Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-credential':
            return 'Invalid email or password';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed';
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked by browser';
        default:
            return 'An error occurred. Please try again';
    }
};
