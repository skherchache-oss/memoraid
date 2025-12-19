
import React from 'react';
import { MemoraidLogoIcon, UserIcon, FlameIcon, GlobeIcon, SunIcon, MoonIcon, CalendarIcon, ShoppingBagIcon, PlusIcon } from '../constants';
import type { User } from 'firebase/auth';
import { getLevelProgress } from '../services/gamificationService';
import type { GamificationStats } from '../types';
import type { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
    onOpenProfile: () => void;
    onLogin: () => void;
    currentUser: User | null;
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
    const xpProgress = gamification ? getLevelProgress(gamification.xp) : 0;

    const handleXpClick = () => {
        addToast("Points d'Expérience (XP) : Créez des capsules et faites des quiz pour progresser !", 'info');
    };

    const navItemClass = (view: string) => `
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
        ${currentView === view 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm' 
            : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-200'}
    `;

    return (
        <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-zinc-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* LOGO & TITRE */}
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={onLogoClick}
                            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 focus:outline-none hover:opacity-80 transition-opacity"
                            aria-label="Retour à l'accueil"
                        >
                            <MemoraidLogoIcon className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
                            <h1 className="hidden lg:block text-2xl font-extrabold text-emerald-700 dark:text-emerald-500 tracking-tight">
                                Memoraid
                            </h1>
                        </button>

                        {/* DESKTOP NAVIGATION */}
                        <nav className="hidden md:flex items-center gap-1">
                            <button onClick={() => onNavigate('create')} className={navItemClass('create')}>
                                <PlusIcon className="w-4 h-4" />
                                {t('nav_create')}
                            </button>
                            <button onClick={() => onNavigate('agenda')} className={navItemClass('agenda')}>
                                <CalendarIcon className="w-4 h-4" />
                                {t('nav_agenda')}
                            </button>
                            <button onClick={() => onNavigate('store')} className={navItemClass('store')}>
                                <ShoppingBagIcon className="w-4 h-4" />
                                {t('nav_store')}
                            </button>
                        </nav>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* THEME SWITCHER */}
                        <button
                            onClick={onToggleTheme}
                            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 transition-all hover:ring-2 hover:ring-emerald-500"
                            title={currentTheme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
                            aria-label="Changer de thème"
                        >
                            {currentTheme === 'dark' ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-indigo-600" />}
                        </button>

                        {/* GAMIFICATION STATS */}
                        {gamification && (
                            <div 
                                className="flex items-center gap-2 bg-emerald-50 dark:bg-zinc-800/50 rounded-full px-2 py-1 md:px-3 border border-emerald-100 dark:border-zinc-700 cursor-pointer hover:bg-emerald-100 dark:hover:bg-zinc-700 transition-colors"
                                onClick={handleXpClick}
                                title="Cliquez pour voir les détails"
                            >
                                <div className="hidden sm:flex items-center gap-1">
                                    <FlameIcon className={`w-5 h-5 ${gamification.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
                                    <span className={`font-bold text-sm ${gamification.currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>
                                        {gamification.currentStreak}
                                    </span>
                                </div>
                                <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-zinc-600"></div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end w-full">
                                        <div className="md:hidden flex items-center">
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                Lvl {gamification.level}
                                            </span>
                                        </div>

                                        <div className="hidden md:block min-w-[100px]">
                                            <div className="flex justify-between w-full text-[10px] font-bold text-slate-600 dark:text-zinc-300 leading-none mb-1">
                                                <span>Niv. {gamification.level}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400">{Math.floor(gamification.xp)} XP</span>
                                            </div>
                                            <div className="w-full bg-emerald-100 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${xpProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LANGUAGE SELECTOR */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-2 md:py-1.5 rounded-full md:rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Changer de langue / Switch language"
                        >
                            <GlobeIcon className="w-5 h-5" />
                            <span className="hidden md:inline ml-1 text-xs font-bold uppercase">{language}</span>
                        </button>

                        {/* USER SECTION */}
                        {currentUser ? (
                            <button
                                onClick={onOpenProfile}
                                className={`group relative w-9 h-9 flex items-center justify-center rounded-full transition-all overflow-hidden border-2 ${
                                    isPremium 
                                        ? 'border-amber-400 ring-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                        : 'border-slate-200 dark:border-zinc-700 hover:border-emerald-500'
                                }`}
                                aria-label="Mon Profil"
                            >
                                {currentUser.photoURL ? (
                                    <img 
                                        src={currentUser.photoURL} 
                                        alt="Profil" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${isPremium ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onLogin}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs sm:text-sm font-bold rounded-full transition-all shadow-sm whitespace-nowrap ${
                                        isPremium 
                                            ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    <span className="hidden sm:inline">{t('login_signup')}</span>
                                    <span className="sm:hidden">{isPremium ? 'Login ★' : 'Login'}</span>
                                </button>
                                {/* BOUTON PROFIL POUR INVITÉ */}
                                <button
                                    onClick={onOpenProfile}
                                    className={`hidden md:flex items-center justify-center p-2 rounded-full transition-all border ${
                                        isPremium 
                                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] hover:scale-105' 
                                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 hover:border-emerald-500'
                                    }`}
                                    aria-label="Ouvrir le profil invité"
                                >
                                    <UserIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
