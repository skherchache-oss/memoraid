import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AppData, UserProfile, UserLevel, LearningStyle, UserRole, CognitiveCapsule } from '../types';
import { XIcon, UserIcon, MailIcon, TrophyIcon, FlameIcon, BrainIcon, SchoolIcon, CrownIcon, ChevronRightIcon, ChevronDownIcon, LogOutIcon, CheckCircleIcon, Share2Icon, PlusIcon, GraduationCapIcon, SparklesIcon, SendIcon } from '../constants';
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
    onNavigateToReviews?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, onUpdateProfile, addToast, selectedCapsuleIds, setSelectedCapsuleIds, currentUser, onOpenGroupManager, isOpenAsPage = false, installPrompt, onInstall, isIOS, isStandalone, onNavigateToReviews }) => {
    const { t } = useLanguage();
    const isInitialMount = useRef(true);
    
    const [name, setName] = useState(profile.user.name === 'Apprenant' || profile.user.name === 'Learner' ? t('default_username') : profile.user.name);
    const [email, setEmail] = useState(profile.user.email || '');
    const [level, setLevel] = useState<UserLevel>(profile.user.level || 'intermediate');
    const [role, setRole] = useState<UserRole>(profile.user.role || 'student');
    const [learningStyle, setLearningStyle] = useState<LearningStyle>(profile.user.learningStyle || 'textual');
    const [isPremium, setIsPremium] = useState(profile.user.isPremium || false);
    
    // Sync local state when external profile changes (but not if we just updated it)
    useEffect(() => {
        if (profile.user.name !== name && name === t('default_username')) setName(profile.user.name);
        if (profile.user.isPremium !== isPremium) setIsPremium(profile.user.isPremium || false);
    }, [profile.user]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const isChanged = 
            name !== profile.user.name ||
            email !== (profile.user.email || '') ||
            level !== profile.user.level ||
            role !== profile.user.role ||
            learningStyle !== profile.user.learningStyle ||
            isPremium !== (profile.user.isPremium || false);

        if (isChanged) {
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
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [name, email, level, role, learningStyle, isPremium, onUpdateProfile, profile.user]);

    const handleSendEmail = () => {
        if (selectedCapsuleIds.length === 0) { addToast(t('select_at_least_one'), 'info'); return; }
        const selectedCapsules = profile.capsules.filter(c => selectedCapsuleIds.includes(c.id));
        const subject = t(selectedCapsules.length === 1 ? 'email_subject_single' : 'email_subject_plural').replace('{title}', selectedCapsules[0]?.title).replace('{count}', selectedCapsules.length.toString());
        const body = selectedCapsules.map(c => `${c.title.toUpperCase()}\n${c.summary}\n${c.keyConcepts.map(kc => `- ${kc.concept}: ${kc.explanation}`).join('\n')}`).join('\n\n');
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const groupedCapsules = useMemo(() => {
        const groups: Record<string, CognitiveCapsule[]> = {};
        profile.capsules.forEach(c => {
            const cat = c.category || t('uncategorized');
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(c);
        });
        return groups;
    }, [profile.capsules, t]);

    const content = (
        <div className={`bg-gray-50 dark:bg-zinc-950 flex flex-col ${isOpenAsPage ? 'min-h-[calc(100vh-140px)] pb-10' : 'rounded-3xl shadow-2xl w-full max-w-2xl h-[90vh] overflow-hidden'}`} onClick={e => e.stopPropagation()}>
            <header className={`flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 ${isOpenAsPage ? '' : 'sticky top-0 z-10'}`}>
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

            <div className={`space-y-6 overflow-y-auto flex-grow ${isOpenAsPage ? 'py-6' : 'p-6'}`}>
                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${role === 'teacher' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            {currentUser?.photoURL ? <img src={currentUser.photoURL} className="w-full h-full rounded-full object-cover" /> : role === 'teacher' ? <SchoolIcon className="w-10 h-10" /> : <GraduationCapIcon className="w-10 h-10" />}
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{name}</h3>
                            <div className="mt-3 flex items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 px-3 py-1 rounded-full"><FlameIcon className="w-4 h-4 text-orange-500" /> {profile.user.gamification?.currentStreak || 0} {t('days')}</div>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 px-3 py-1 rounded-full"><TrophyIcon className="w-4 h-4 text-yellow-500" /> {profile.user.gamification?.xp || 0} XP</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('analytics_title')}</h3>
                    <ProgressionDashboard capsules={profile.capsules} onNavigateToReviews={onNavigateToReviews} />
                </section>

                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 px-1 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-indigo-500" /> {t('personal_info')}</h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm">
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-500">{t('username')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="bg-transparent text-slate-800 dark:text-white font-semibold text-right outline-none" />
                        </div>
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-500">{t('email_profile')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-slate-800 dark:text-white font-semibold text-right outline-none" />
                        </div>
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/30 dark:bg-indigo-900/10">
                            <label className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2"><BrainIcon className="w-5 h-5 text-indigo-600" /> {t('learning_style')}</label>
                            <select value={learningStyle} onChange={e => setLearningStyle(e.target.value as LearningStyle)} className="bg-white dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 text-slate-800 dark:text-white font-semibold py-1 px-3 rounded-lg outline-none">
                                <option value="textual">{t('style_textual')}</option>
                                <option value="visual">{t('style_visual')}</option>
                                <option value="auditory">{t('style_auditory')}</option>
                                <option value="kinesthetic">{t('style_kinesthetic')}</option>
                            </select>
                        </div>
                    </div>
                </section>

                {currentUser && (
                    <button onClick={onOpenGroupManager} className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><SchoolIcon className="w-5 h-5" /></div><span className="font-semibold text-slate-700 dark:text-zinc-200">{role === 'teacher' ? t('my_classes') : t('my_groups')}</span></div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                    </button>
                )}

                <section className="bg-slate-100 dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-3 flex items-center gap-2"><MailIcon className="w-4 h-4" /> {t('share_revisions')}</h4>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 max-h-48 overflow-y-auto mb-3">
                        {profile.capsules.length > 0 ? Object.keys(groupedCapsules).map(cat => (
                            <div key={cat}>
                                <div className="px-3 py-1 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-500 uppercase sticky top-0 border-b border-slate-100 dark:border-zinc-800">{cat}</div>
                                {groupedCapsules[cat].map(c => (
                                    <div key={c.id} className="flex items-center px-3 py-2 border-b border-slate-50 dark:border-zinc-800 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCapsuleIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${selectedCapsuleIds.includes(c.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>{selectedCapsuleIds.includes(c.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}</div>
                                        <span className="text-sm text-slate-700 dark:text-zinc-300 truncate">{c.title}</span>
                                    </div>
                                ))}
                            </div>
                        )) : <p className="text-xs text-slate-400 p-3 italic text-center">Aucune capsule.</p>}
                    </div>
                    <button onClick={handleSendEmail} disabled={selectedCapsuleIds.length === 0} className="w-full py-2 bg-slate-800 dark:bg-zinc-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"><SendIcon className="w-4 h-4" /> {t('send_email')}</button>
                </section>

                <div id="premium-section-anchor" className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-24">
                    <div className={`rounded-xl p-4 flex items-center justify-between border transition-colors ${isPremium ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isPremium ? 'bg-amber-100 dark:bg-amber-800 text-amber-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}><CrownIcon className="w-5 h-5" /></div>
                            <div><h3 className="font-bold text-sm text-slate-800 dark:text-white">Memoraid Premium</h3><p className="text-xs text-slate-500">{isPremium ? 'Actif' : 'Débloquer les fonctions'}</p></div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                </div>

                {currentUser && <button onClick={async () => { await signOut(auth!); onClose(); }} className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"><LogOutIcon className="w-4 h-4" /> {t('logout')}</button>}
            </div>
        </div>
    );

    if (isOpenAsPage) return content;
    return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>{content}</div>;
};

export default ProfileModal;