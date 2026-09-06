import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';
import { Lock, LogIn } from 'lucide-react';
import { playClick } from '../../utils/sound';

/**
 * Component to protect authenticated student views or actions.
 * If user is not authenticated, renders a fallback gate or opens AuthModal.
 */
export const AuthGuard = ({ children, fallback = null, promptTitle = 'Authentication Required' }) => {
    const { user, loading } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-[200px] flex items-center justify-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        if (fallback) return fallback;

        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto my-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Lock size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{promptTitle}</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Please sign in with your student account to access this assessment module and track your verified score record.
                </p>
                <button
                    onClick={() => {
                        playClick();
                        setModalOpen(true);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                    <LogIn size={16} /> Sign In / Register
                </button>
                <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
        );
    }

    return children;
};

export default AuthGuard;
