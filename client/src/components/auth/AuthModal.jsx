import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Mail,
    Lock,
    User,
    GraduationCap,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playClick } from '../../utils/sound';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const { logIn, signUp, isConfigured } = useAuth();
    const [mode, setMode] = useState(initialMode); // 'login' | 'signup'

    // Form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [collegeName, setCollegeName] = useState('');

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setCollegeName('');
        setErrorMessage('');
        setSuccessMessage('');
        setShowPassword(false);
    };

    const handleSwitchMode = (newMode) => {
        playClick();
        setMode(newMode);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleClose = () => {
        playClick();
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!isConfigured) {
            setErrorMessage('Firebase configuration missing in client/.env. Please paste your Firebase keys to sign in or register.');
            return;
        }

        if (!email.trim() || !password) {
            setErrorMessage('Please provide both email and password.');
            return;
        }

        if (mode === 'signup') {
            if (password.length < 6) {
                setErrorMessage('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match.');
                return;
            }
            if (!displayName.trim()) {
                setErrorMessage('Please enter your full name.');
                return;
            }
        }

        setLoading(true);
        try {
            if (mode === 'signup') {
                await signUp(email, password, displayName, collegeName);
                setSuccessMessage('Account created successfully! Welcome aboard.');
            } else {
                await logIn(email, password);
                setSuccessMessage('Successfully signed in!');
            }

            setTimeout(() => {
                handleClose();
            }, 600);
        } catch (err) {
            setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                {mode === 'login' ? 'Candidate Sign In' : 'Register Candidate Profile'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {mode === 'login'
                                    ? 'Access your cognitive scores and candidate history'
                                    : 'Create your account for verified score tracking'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Pending Firebase Config Warning Banner */}
                    {!isConfigured && (
                        <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                            <ShieldAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Firebase Configuration Required:</span>
                                <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                                    Paste your Firebase Web credentials into <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">client/.env</code> to activate live authentication.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Mode Toggle Tabs */}
                    <div className="px-6 pt-4">
                        <div className="p-1 bg-slate-100 rounded-2xl flex">
                            <button
                                type="button"
                                onClick={() => handleSwitchMode('login')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                                    mode === 'login'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchMode('signup')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                                    mode === 'signup'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {errorMessage && (
                        <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                            <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
                        {mode === 'signup' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="e.g. Alex Kumar"
                                            required
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        College / University Name
                                    </label>
                                    <div className="relative">
                                        <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={collegeName}
                                            onChange={(e) => setCollegeName(e.target.value)}
                                            placeholder="e.g. National Institute of Technology"
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="candidate@university.edu"
                                    required
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Confirm Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-98 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
                                </>
                            ) : (
                                <span>{mode === 'login' ? 'Sign In to Portal' : 'Create Candidate Account'}</span>
                            )}
                        </button>
                    </form>

                    {/* Footer Toggle */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
                        {mode === 'login' ? (
                            <span>
                                Don&apos;t have an account yet?{' '}
                                <button
                                    onClick={() => handleSwitchMode('signup')}
                                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                    Register now
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already registered?{' '}
                                <button
                                    onClick={() => handleSwitchMode('login')}
                                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                    Sign in
                                </button>
                            </span>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuthModal;
