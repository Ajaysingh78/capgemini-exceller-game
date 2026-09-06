import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as updateFirebaseProfile,
    signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { syncUserWithBackend, updateUserProfile } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Translate common Firebase errors into user-friendly messages
export const getFriendlyAuthErrorMessage = (error) => {
    if (!error) return '';
    const code = error.code || '';

    switch (code) {
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/Password sign-in is not enabled in your Firebase Console. Please go to Firebase Console -> Build -> Authentication -> Sign-in method and enable "Email/Password".';
        case 'auth/configuration-not-found':
            return 'Firebase Authentication is not activated in this project. Please go to Firebase Console -> Authentication and click "Get Started".';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/user-disabled':
            return 'This candidate account has been disabled. Please contact support.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please double-check your credentials.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please wait a few minutes before trying again.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in window was closed before completion.';
        case 'auth/network-request-failed':
            return 'Network error connecting to authentication service. Please check your internet connection.';
        default:
            return error.message || 'An authentication error occurred. Please try again.';
    }
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Fetch or sync MongoDB user record for a Firebase user
    const syncMongoProfile = useCallback(async (firebaseUser, extraData = {}) => {
        if (!firebaseUser) {
            setMongoUser(null);
            return null;
        }

        try {
            const token = await firebaseUser.getIdToken();
            const response = await syncUserWithBackend(token, {
                displayName: extraData.displayName || firebaseUser.displayName || '',
                collegeName: extraData.collegeName || '',
                photoURL: extraData.photoURL || firebaseUser.photoURL || '',
            });

            if (response?.data) {
                setMongoUser(response.data);
                return response.data;
            }
        } catch (err) {
            console.warn('⚠️ [AuthContext]: Could not sync user profile with MongoDB backend:', err.message);
            // Fallback synthetic mongoUser if backend is temporarily offline
            const fallback = {
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: extraData.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                collegeName: extraData.collegeName || 'Independent Aspirant',
                isLocalFallback: true,
            };
            setMongoUser(fallback);
            return fallback;
        }
    }, []);

    // Listen to Firebase auth state transitions
    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await syncMongoProfile(firebaseUser);
            } else {
                setUser(null);
                setMongoUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [syncMongoProfile]);

    // Sign Up with Email & Password
    const signUp = async (email, password, displayName, collegeName) => {
        if (!isFirebaseConfigured || !auth) {
            throw new Error('Firebase configuration missing. Please fill client/.env with your Firebase web credentials.');
        }

        setAuthError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const createdUser = userCredential.user;

            // Update Firebase display name
            if (displayName && displayName.trim()) {
                await updateFirebaseProfile(createdUser, {
                    displayName: displayName.trim(),
                });
            }

            // Sync with MongoDB backend
            await syncMongoProfile(createdUser, {
                displayName: displayName?.trim(),
                collegeName: collegeName?.trim(),
            });

            setUser(createdUser);
            return createdUser;
        } catch (error) {
            const friendlyMsg = getFriendlyAuthErrorMessage(error);
            setAuthError(friendlyMsg);
            throw new Error(friendlyMsg);
        }
    };

    // Sign In with Email & Password
    const logIn = async (email, password) => {
        if (!isFirebaseConfigured || !auth) {
            throw new Error('Firebase configuration missing. Please fill client/.env with your Firebase web credentials.');
        }

        setAuthError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const loggedInUser = userCredential.user;

            await syncMongoProfile(loggedInUser);
            setUser(loggedInUser);
            return loggedInUser;
        } catch (error) {
            const friendlyMsg = getFriendlyAuthErrorMessage(error);
            setAuthError(friendlyMsg);
            throw new Error(friendlyMsg);
        }
    };

    // Log Out
    const logOut = async () => {
        setAuthError(null);
        if (auth) {
            await signOut(auth);
        }
        setUser(null);
        setMongoUser(null);
    };

    // Modular Google Sign-In (prepared for future social login)
    const loginWithGoogle = async () => {
        if (!isFirebaseConfigured || !auth || !googleProvider) {
            throw new Error('Firebase / Google Auth not configured.');
        }

        setAuthError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await syncMongoProfile(result.user);
            setUser(result.user);
            return result.user;
        } catch (error) {
            const friendlyMsg = getFriendlyAuthErrorMessage(error);
            setAuthError(friendlyMsg);
            throw new Error(friendlyMsg);
        }
    };

    // Helper to get fresh token for backend calls
    const getIdToken = async (forceRefresh = false) => {
        if (!user) return null;
        try {
            return await user.getIdToken(forceRefresh);
        } catch {
            return null;
        }
    };

    // Update candidate profile
    const updateProfileData = async (updates) => {
        if (!user) throw new Error('User not authenticated.');
        const token = await getIdToken();
        const res = await updateUserProfile(token, updates);
        if (res?.data) {
            setMongoUser(res.data);
        }
        return res;
    };

    const value = {
        user,
        mongoUser,
        loading,
        authError,
        isConfigured: isFirebaseConfigured,
        signUp,
        logIn,
        logOut,
        loginWithGoogle,
        getIdToken,
        updateProfileData,
        refreshProfile: () => user && syncMongoProfile(user),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
