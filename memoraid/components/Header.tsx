import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MemoraidLogoIcon, UserIcon, FlameIcon, GlobeIcon, SunIcon, MoonIcon, CalendarIcon, ShoppingBagIcon, PlusIcon, LayoutGridIcon, SchoolIcon, LogOutIcon, ChevronDownIcon, BRAND_FONT } from '../constants';
import type { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getLevelProgress } from '../services/gamificationService';
import type { GamificationStats, UserRole, UserProfile } from '../types';
import type { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
    onOpenProfile: () => void;
    onLogin: () => void;
    currentUser: User | null;
    userProfile?: UserProfile;
    userRole?: UserRole;
    isOnline?: boolean;
    gamification?: GamificationStats;
    addToast: (message: string, type: ToastType) => void;
    onLogoClick: () => void;
    currentTheme: 'light' | 'dark';
    onToggleTheme: () => void;
    isPremium?: boolean;
    currentView: string;
    onNavigate: (view: any) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenProfile, 
    onLogin, 
    currentUser, 
    userProfile,
    userRole = 'student',
    isOnline = true, 
    gamification, 
    addToast, 
    onLogoClick, 
    currentTheme, 
    onToggleTheme, 
    isPremium,
    currentView,
    onNavigate
}) => {
    const { language, toggleLanguage, t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const xpProgress = gamification ? getLevelProgress(gamification.xp) : 0;

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleXpClick = () => {
        addToast("Points d'Expérience (XP) : Créez des modules et faites des quiz pour progresser !", 'info');
    };

    const handleLogout = async () => {
        setIsMenuOpen(false);
        try {
            await signOut(auth);
            addToast("Déconnexion réussie", "info");
        } catch (e) {
            addToast("Erreur lors de la déconnexion", "error");
        }
    };

    const navItemClass = (view: string) => `
        group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-wide
        ${currentView === view 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
            : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'}
    `;

    const photoSource = useMemo(() => {
        if (userProfile?.photoURL && userProfile.photoURL.length > 10) return userProfile.photoURL;
        if (currentUser?.photoURL) return currentUser.photoURL;
        return null;
    }, [userProfile?.photoURL, currentUser?.photoURL]);
        
    const isValidPhoto = typeof photoSource === 'string' && (photoSource.startsWith('http') || photoSource.startsWith('data:image'));

    return (
        <header className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 dark:border-zinc-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 md:h-20">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={onLogoClick}
                            className="flex items-center gap-3 flex-shrink-0 focus:outline-none group transition-transform active:scale-95"
                            aria-label="Retour à l'accueil"
                        >
                            <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm group-hover:rotate-3 group-hover:border-emerald-500 transition-all relative">
                                <MemoraidLogoIcon className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" />
                            </div>
                            <h1 className={`hidden lg:block text-lg text-emerald-900 dark:text-white ${BRAND_FONT}`}>
                                Memoraid
                            </h1>
                        </button>

                        <nav className="hidden md:flex items-center gap-1 ml-2">
                            <button onClick={() => onNavigate('create')} className={navItemClass('create')}>
                                <PlusIcon className={`w-3.5 h-3.5 transition-transform ${currentView === 'create' ? '' : 'group-hover:rotate-90'}`} />
                                {t('nav_create')}
                            </button>
                            <button onClick={() => onNavigate('base')} className={navItemClass('base')}>
                                <LayoutGridIcon className="w-3.5 h-3.5" />
                                {t('nav_library')}
                            </button>
                            
                            {userRole === 'teacher' ? (
                                <button onClick={() => onNavigate('classes')} className={navItemClass('classes')}>
                                    <SchoolIcon className="w-3.5 h-3.5" />
                                    {t('my_classes')}
                                </button>
                            ) : (
                                <button onClick={() => onNavigate('agenda')} className={navItemClass('agenda')}>
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {t('nav_agenda')}
                                </button>
                            )}

                            <button onClick={() => onNavigate('store')} className={navItemClass('store')}>
                                <ShoppingBagIcon className="w-3.5 h-3.5" />
                                {t('nav_store')}
                            </button>
                            
                            <button onClick={() => onNavigate('profile')} className={navItemClass('profile')}>
                                <UserIcon className="w-3.5 h-3.5" />
                                {t('nav_profile')}
                            </button>
                        </nav>
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <button
                            onClick={toggleLanguage}
                            className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 transition-all hover:border-emerald-500 hover:text-emerald-500 group"
                        >
                            <GlobeIcon className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white uppercase border-2 border-white dark:border-zinc-950">
                                {language}
                            </span>
                        </button>

                        <button
                            onClick={onToggleTheme}
                            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 transition-all hover:border-emerald-500 hover:text-emerald-500"
                        >
                            {currentTheme === 'dark' ? <SunIcon className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> : <MoonIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />}
                        </button>

                        {gamification && (
                            <div 
                                className="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-zinc-900 rounded-xl px-2 md:px-3 py-1.5 md:py-2 border border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-200 dark:hover:border-zinc-700 transition-all group"
                                onClick={handleXpClick}
                            >
                                <div className="flex items-center gap-1.5">
                                    <FlameIcon className={`w-4 h-4 md:w-5 md:h-5 ${gamification.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-300'}`} />
                                    <span className="font-black text-xs md:text-sm text-slate-900 dark:text-white">
                                        {gamification.currentStreak}
                                    </span>
                                </div>
                                <div className="hidden lg:block min-w-[90px]">
                                    <div className="flex justify-between w-full text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                                        <span>Lvl {gamification.level}</span>
                                        <span>{Math.floor(gamification.xp)} XP</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${xpProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentUser ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`group relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all overflow-hidden border-2 ${
                                        isPremium 
                                            ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-lg shadow-amber-200/40' 
                                            : 'border-slate-100 dark:border-zinc-800 hover:border-emerald-500'
                                    } active:scale-90`}
                                >
                                    {isValidPhoto ? (
                                        <img 
                                            src={photoSource as string} 
                                            alt="Profil" 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${isPremium ? 'bg-amber-400 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in py-2">
                                        <div className="px-4 py-3 border-b border-slate-50 dark:border-zinc-800">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Connecté en tant que</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{userProfile?.name || currentUser.displayName}</p>
                                        </div>
                                        <button 
                                            onClick={() => { onOpenProfile(); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 transition-all text-left"
                                        >
                                            <UserIcon className="w-4 h-4" />
                                            Mon Profil
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left"
                                        >
                                            <LogOutIcon className="w-4 h-4" />
                                            {t('logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={onLogin}
                                className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    isPremium 
                                    ? 'bg-amber-500 text-white border-white ring-4 ring-amber-400/30 shadow-xl scale-105' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none'
                                }`}
                            >
                                {t('login_signup')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;