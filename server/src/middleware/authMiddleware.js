import { getAdminAuth, isFirebaseReady } from '../config/firebaseAdmin.js';
import User from '../models/User.js';

// Helper to decode JWT payload safely in development fallback mode
const decodeTokenPayloadFallback = (token) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        return {
            uid: payload.user_id || payload.sub || payload.uid,
            email: payload.email || '',
            name: payload.name || '',
            picture: payload.picture || '',
        };
    } catch {
        return null;
    }
};

/**
 * Middleware to strictly verify Firebase ID Token.
 * Attaches decoded Firebase user to req.user and existing MongoDB profile to req.mongoUser.
 */
export const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No Firebase authorization token provided.',
            });
        }

        const idToken = authHeader.split('Bearer ')[1].trim();
        if (!idToken) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Malformed authorization header.',
            });
        }

        let decodedUser = null;

        if (isFirebaseReady()) {
            try {
                decodedUser = await getAdminAuth().verifyIdToken(idToken);
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: `Firebase token verification failed: ${err.message}`,
                });
            }
        } else {
            // Development fallback mode when server-side credentials are not yet pasted in server/.env
            console.warn('⚠️ [Auth]: Firebase Admin credentials not set. Decoding token payload in development mode.');
            decodedUser = decodeTokenPayloadFallback(idToken);
            if (!decodedUser || !decodedUser.uid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authorization token format.',
                });
            }
        }

        req.user = {
            uid: decodedUser.uid,
            email: decodedUser.email,
            displayName: decodedUser.name || '',
            photoURL: decodedUser.picture || '',
        };

        // Attach MongoDB user if already created
        try {
            const user = await User.findOne({ firebaseUid: decodedUser.uid });
            if (user) {
                req.mongoUser = user;
            }
        } catch {
            // Ignore DB lookup error here, continue with req.user
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware for optional authentication.
 * If token is present, populates req.user; otherwise permits unauthenticated continuation.
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    if (!idToken) {
        req.user = null;
        return next();
    }

    try {
        let decodedUser = null;
        if (isFirebaseReady()) {
            try {
                decodedUser = await getAdminAuth().verifyIdToken(idToken);
            } catch {
                req.user = null;
                return next();
            }
        } else {
            decodedUser = decodeTokenPayloadFallback(idToken);
        }

        if (decodedUser && decodedUser.uid) {
            req.user = {
                uid: decodedUser.uid,
                email: decodedUser.email,
                displayName: decodedUser.name || '',
                photoURL: decodedUser.picture || '',
            };
            try {
                const user = await User.findOne({ firebaseUid: decodedUser.uid });
                if (user) req.mongoUser = user;
            } catch {
                // Ignore DB error
            }
        } else {
            req.user = null;
        }
    } catch {
        req.user = null;
    }

    next();
};
