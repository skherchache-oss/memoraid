import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { XIcon, AlertTriangleIcon, RefreshCwIcon, ChevronLeftIcon, EyeIcon, EyeOffIcon } from '../constants';
import { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
    onClose: () => void;
    addToast: (message: string, type: ToastType) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, addToast }) => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ message: string } | null>(null);

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setLoading(true);
        setError(null);
        try {
            // CRITIQUE : Détection mobile pour redirection au lieu de popup
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
            if (isMobile) {
                addToast("Redirection vers Google...", "info");
                await signInWithRedirect(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
                addToast(t('connection_restored'), "success");
                onClose();
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError({ message: "Erreur de connexion. Réessayez." });
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                addToast(t('connection_restored'), "success");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                addToast("Bienvenue sur Memoraid !", "success");
            }
            onClose();
        } catch (err: any) {
            setError({ message: "Identifiants invalides ou erreur service." });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center md:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 w-full h-full md:h-auto md:rounded-[40px] md:shadow-2xl md:max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {isForgotPassword ? t('reset_password') : (isLogin ? t('login') : t('create_account'))}
                        </h2>
                        <button onClick={onClose} className="p-2"><XIcon className="w-6 h-6 text-slate-400" /></button>
                    </div>
                </header>

                <div className="px-6 md:px-8 pb-8 space-y-6">
                    {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-200">{error.message}</div>}
                    {!isForgotPassword && (
                        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-4 px-4 py-4 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-2 border-slate-100 dark:border-zinc-700 rounded-2xl hover:border-emerald-500 transition-all font-black text-sm shadow-sm">
                            {loading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />}
                            {t('continue_google')}
                        </button>
                    )}
                    <form onSubmit={isLogin ? handleEmailAuth : handleEmailAuth} className="space-y-4">
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none" placeholder={t('email')} />
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none" placeholder={t('password')} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{loading ? <RefreshCwIcon className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? t('login') : t('create_account'))}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default AuthModal;