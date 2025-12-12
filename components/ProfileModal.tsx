
import React, { useState, useEffect } from 'react';
import type { AppData, UserProfile, UserLevel, LearningStyle, UserRole } from '../types';
import { XIcon, UserIcon, MailIcon, TrophyIcon, FlameIcon, BrainIcon, SchoolIcon, CrownIcon, ChevronRightIcon, LogOutIcon, CheckCircleIcon, Share2Icon, PlusIcon, GraduationCapIcon } from '../constants';
import { ToastType } from '../hooks/useToast';
import ProgressionDashboard from './ProgressionDashboard';
import { auth } from '../services/firebase';
import { signOut, User } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileModalProps {
    profile: AppData;
    onClose: () => void;
    onUpdateProfile: (newProfile: UserProfile) => void;
    addToast: (message: string, type: ToastType) => void;
    selectedCapsuleIds: string[];
    setSelectedCapsuleIds: React.Dispatch<React.SetStateAction<string[]>>;
    currentUser: User | null;
    onOpenGroupManager: () => void;
    isOpenAsPage?: boolean;
    installPrompt?: any;
    onInstall?: () => void;
    isIOS?: boolean;
    isStandalone?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, onUpdateProfile, addToast, selectedCapsuleIds, setSelectedCapsuleIds, currentUser, onOpenGroupManager, isOpenAsPage = false, installPrompt, onInstall, isIOS, isStandalone }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(profile.user.name);
    const [email, setEmail] = useState(profile.user.email || '');
    const [level, setLevel] = useState<UserLevel>(profile.user.level || 'intermediate');
    const [role, setRole] = useState<UserRole>(profile.user.role || 'student');
    const [learningStyle, setLearningStyle] = useState<LearningStyle>(profile.user.learningStyle || 'textual');
    const [isPremium, setIsPremium] = useState(profile.user.isPremium || false);
    
    // Auto-save detection
    useEffect(() => {
        const isNameChanged = name.trim() !== profile.user.name;
        const isEmailChanged = email.trim() !== (profile.user.email || '');
        const isLevelChanged = level !== (profile.user.level || 'intermediate');
        const isRoleChanged = role !== (profile.user.role || 'student');
        const isStyleChanged = learningStyle !== (profile.user.learningStyle || 'textual');
        const isPremiumChanged = isPremium !== (profile.user.isPremium || false);
        
        if (isNameChanged || isEmailChanged || isLevelChanged || isStyleChanged || isPremiumChanged || isRoleChanged) {
             // Debounce save slightly to avoid too many updates
             const timer = setTimeout(() => {
                 onUpdateProfile({
                    ...profile.user,
                    name: name.trim(),
                    email: email.trim(),
                    role,
                    level,
                    learningStyle,
                    isPremium
                });
             }, 800);
             return () => clearTimeout(timer);
        }
    }, [name, email, level, learningStyle, isPremium, role, profile.user, onUpdateProfile]);

    const handleSendEmail = () => {
        if (selectedCapsuleIds.length === 0) {
            addToast(t('select_at_least_one'), 'info');
            return;
        }

        const selectedCapsules = profile.capsules.filter(c => selectedCapsuleIds.includes(c.id));
        const subjectKey = selectedCapsules.length === 1 ? 'email_subject_single' : 'email_subject_plural';
        const subject = t(subjectKey)
            .replace('{title}', selectedCapsules[0]?.title)
            .replace('{count}', selectedCapsules.length.toString());

        const body = selectedCapsules.map(capsule => {
            const concepts = capsule.keyConcepts.map(c => `- ${c.concept}: ${c.explanation}`).join('\n');
            return `
----------------------------------
${capsule.title.toUpperCase()}
----------------------------------
${capsule.summary}

${t('email_body_concepts')} :
${concepts}
            `.trim();
        }).join('\n\n');

        window.location.href = `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
            addToast(t('logout_success'), "info");
            if (!isOpenAsPage) onClose();
        }
    };

    const handleCapsuleSelectionChange = (capsuleId: string) => {
        setSelectedCapsuleIds(prev =>
            prev.includes(capsuleId) ? prev.filter(id => id !== capsuleId) : [...prev, capsuleId]
        );
    };

    const content = (
        <div className={`bg-gray-50 dark:bg-zinc-950 flex flex-col ${isOpenAsPage ? 'h-full rounded-none shadow-none bg-transparent border-none' : 'rounded-3xl shadow-2xl w-full max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden'}`} onClick={e => e.stopPropagation()}>
            {/* HEADER SIMPLIFIÉ */}
            <header className={`flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 sticky top-0 z-10`}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-emerald-500" />
                    {t('my_space')}
                </h2>
                {!isOpenAsPage && (
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                        <XIcon className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
                    </button>
                )}
            </header>

            <div className={`space-y-6 overflow-y-auto flex-grow ${isOpenAsPage ? 'py-6 px-0' : 'p-6'}`}>
                
                {/* 1. CARTE D'IDENTITÉ & GAMIFICATION */}
                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {currentUser?.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    role === 'teacher' ? <SchoolIcon className="w-10 h-10" /> : <GraduationCapIcon className="w-10 h-10" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 rounded-full p-1">
                                <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    Niv. {profile.user.gamification?.level || 1}
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{name}</h3>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">{email || t('email_placeholder')}</p>
                            <div className="mt-3 flex items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <FlameIcon className="w-4 h-4 text-orange-500" />
                                    {profile.user.gamification?.currentStreak || 0} jours
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                    {profile.user.gamification?.xp || 0} XP
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badges Minimalistes */}
                    {profile.user.gamification?.badges && profile.user.gamification.badges.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {profile.user.gamification.badges.map(badge => (
                                <div key={badge.id} className="flex-shrink-0 w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-900/30" title={badge.name}>
                                    <TrophyIcon className="w-5 h-5" />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 2. ACTIONS RAPIDES (INSTALL & PREMIUM) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logique d'affichage "Installer" */}
                    {isStandalone ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">Application Installée</h3>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">Prêt pour le hors-ligne</p>
                            </div>
                        </div>
                    ) : (
                        isIOS ? (
                            <div className="bg-slate-100 dark:bg-zinc-800 rounded-xl p-4 border border-slate-200 dark:border-zinc-700">
                                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Installer sur iPhone</h3>
                                <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                                    <div className="flex items-center gap-1">1. Appuyez sur <Share2Icon className="w-3 h-3 text-blue-500 inline"/></div>
                                    <div className="flex items-center gap-1">2. Puis <span className="font-bold">Sur l'écran d'accueil</span> <PlusIcon className="w-3 h-3 inline border border-current rounded-sm"/></div>
                                </div>
                            </div>
                        ) : (
                            installPrompt && (
                                <button 
                                    onClick={onInstall}
                                    className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md hover:bg-blue-700 transition-colors text-left"
                                >
                                    <div>
                                        <h3 className="font-bold text-sm">Installer l'app</h3>
                                        <p className="text-xs text-blue-100 mt-0.5">Accès hors-ligne & rapide</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-white/80" />
                                </button>
                            )
                        )
                    )}
                    
                    <div className={`rounded-xl p-4 flex items-center justify-between border transition-colors ${isPremium ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isPremium ? 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>
                                <CrownIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Memoraid Premium</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">{isPremium ? 'Actif' : 'Débloquer les fonctions'}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                </div>

                {/* 3. PROGRESSION */}
                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Analyses</h3>
                    <ProgressionDashboard capsules={profile.capsules} />
                </section>

                {/* 4. PARAMÈTRES & DONNÉES */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white px-1">{t('personal_info')}</h3>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                        {/* Champ Nom */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-zinc-400">{t('username')}</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="bg-transparent text-slate-800 dark:text-white font-semibold text-right focus:outline-none focus:text-emerald-600 placeholder:text-slate-300"
                                placeholder="Votre nom"
                            />
                        </div>

                        {/* Champ Email */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-zinc-400">{t('email')}</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-transparent text-slate-800 dark:text-white font-semibold text-right focus:outline-none focus:text-emerald-600 placeholder:text-slate-300"
                                placeholder="email@exemple.com"
                            />
                        </div>

                        {/* Rôle */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-zinc-400">{t('account_type')}</label>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                                <button onClick={() => setRole('student')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${role === 'student' ? 'bg-white dark:bg-zinc-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>{t('role_student')}</button>
                                <button onClick={() => setRole('teacher')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${role === 'teacher' ? 'bg-white dark:bg-zinc-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>{t('role_teacher')}</button>
                            </div>
                        </div>

                        {/* Style Apprentissage */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                                <BrainIcon className="w-4 h-4" /> {t('learning_style')}
                            </label>
                            <select 
                                value={learningStyle}
                                onChange={(e) => setLearningStyle(e.target.value as LearningStyle)}
                                className="bg-transparent text-slate-800 dark:text-white font-semibold text-right focus:outline-none cursor-pointer text-sm"
                            >
                                <option value="textual">Textuel (Lecteur)</option>
                                <option value="visual">Visuel (Images)</option>
                                <option value="auditory">Auditif (Écoute)</option>
                                <option value="kinesthetic">Kinesthésique (Action)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* 5. GESTION GROUPES */}
                {currentUser && (
                    <button
                        onClick={onOpenGroupManager}
                        className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                <SchoolIcon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-zinc-200">{role === 'teacher' ? t('my_classes') : t('my_groups')}</span>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                    </button>
                )}

                {/* 6. EXPORT EMAIL (Seule action conservée) */}
                <section className="bg-slate-100 dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-3 flex items-center gap-2">
                        <MailIcon className="w-4 h-4" />
                        Partager mes révisions
                    </h4>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 max-h-32 overflow-y-auto mb-3">
                        {profile.capsules.length > 0 ? (
                            profile.capsules.map(capsule => (
                                <div key={capsule.id} className="flex items-center px-3 py-2 border-b border-slate-50 dark:border-zinc-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => handleCapsuleSelectionChange(capsule.id)}>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${selectedCapsuleIds.includes(capsule.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-zinc-600'}`}>
                                        {selectedCapsuleIds.includes(capsule.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-zinc-300 truncate">{capsule.title}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 p-3 italic text-center">Aucune capsule disponible.</p>
                        )}
                    </div>
                    <button 
                        onClick={handleSendEmail}
                        disabled={selectedCapsuleIds.length === 0}
                        className="w-full py-2 bg-slate-800 dark:bg-zinc-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                    >
                        Envoyer le résumé par email
                    </button>
                </section>

                {/* 7. DÉCONNEXION */}
                {currentUser && (
                    <button 
                        onClick={handleSignOut}
                        className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <LogOutIcon className="w-4 h-4" />
                        {t('logout')}
                    </button>
                )}
            </div>
        </div>
    );

    if (isOpenAsPage) return content;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            {content}
        </div>
    );
};

export default ProfileModal;
