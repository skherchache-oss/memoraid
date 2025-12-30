import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AppData, UserProfile, UserLevel, LearningStyle, UserRole, CognitiveCapsule } from '../types';
import { XIcon, UserIcon, MailIcon, TrophyIcon, FlameIcon, BrainIcon, SchoolIcon, CrownIcon, ChevronRightIcon, LogOutIcon, CheckCircleIcon, SendIcon, GraduationCapIcon } from '../constants';
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
    onNavigateToReviews?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, onUpdateProfile, addToast, selectedCapsuleIds, setSelectedCapsuleIds, currentUser, onOpenGroupManager, isOpenAsPage = false, onNavigateToReviews }) => {
    const { t, language } = useLanguage();
    const isInitialMount = useRef(true);
    
    // Correction de l'initialisation du nom selon la langue (Gère Apprenant/Learner)
    const [name, setName] = useState(() => {
        if (profile.user.name === 'Apprenant' || profile.user.name === 'Learner') {
            return t('default_username');
        }
        return profile.user.name;
    });

    const [email, setEmail] = useState(profile.user.email || '');
    const [level, setLevel] = useState<UserLevel>(profile.user.level || 'intermediate');
    const [role, setRole] = useState<UserRole>(profile.user.role || 'student');
    const [learningStyle, setLearningStyle] = useState<LearningStyle>(profile.user.learningStyle || 'textual');
    const [isPremium, setIsPremium] = useState(profile.user.isPremium || false);
    
    useEffect(() => {
        if (profile.user.isPremium !== isPremium) setIsPremium(profile.user.isPremium || false);
    }, [profile.user.isPremium]);

    // Effet pour mettre à jour le nom si la langue change et que c'est le nom par défaut
    useEffect(() => {
        if (name === 'Apprenant' || name === 'Learner') {
            setName(t('default_username'));
        }
    }, [language, t, name]);

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
        <div className={`bg-gray-50 dark:bg-zinc-950 flex flex-col ${isOpenAsPage ? 'min-h-[calc(100vh-140px)] pb-10' : 'rounded-[40px] shadow-2xl w-full max-w-2xl h-[90vh] overflow-hidden'}`} onClick={e => e.stopPropagation()}>
            <header className={`flex items-center justify-between p-6 md:p-8 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 ${isOpenAsPage ? '' : 'sticky top-0 z-10'}`}>
                <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter">
                    <UserIcon className="w-8 h-8 text-emerald-500" />
                    {t('my_space')}
                </h2>
                {!isOpenAsPage && (
                    <button onClick={onClose} className="p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                        <XIcon className="w-6 h-6 text-slate-500 dark:text-zinc-400" />
                    </button>
                )}
            </header>

            <div className={`space-y-10 overflow-y-auto flex-grow ${isOpenAsPage ? 'py-8' : 'p-6 md:p-8'}`}>
                
                {/* CARTE 1 : IDENTITÉ APPRENANT (Thème Émeraude) */}
                <section className="bg-emerald-50/30 dark:bg-emerald-950/20 rounded-[32px] p-8 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl transition-all duration-700"></div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className={`w-28 h-28 rounded-[32px] flex items-center justify-center text-4xl font-bold transition-transform group-hover:rotate-3 shadow-2xl ${role === 'teacher' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                {currentUser?.photoURL ? (
                                    <img src={currentUser.photoURL} className="w-full h-full rounded-[32px] object-cover" alt="Profile" />
                                ) : (
                                    role === 'teacher' ? <SchoolIcon className="w-14 h-14" /> : <GraduationCapIcon className="w-14 h-14" />
                                )}
                            </div>
                            {isPremium && (
                                <div className="absolute -top-3 -right-3 p-2 bg-amber-400 rounded-full border-4 border-white dark:border-zinc-900 shadow-lg">
                                    <CrownIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center md:text-left flex-grow">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{name}</h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                <span>{t('level_short')} {profile.user.gamification?.level || 1}</span>
                                <span className="text-slate-200 dark:text-zinc-800">•</span>
                                <span>{role === 'teacher' ? t('role_teacher') : t('role_student')}</span>
                                <span className="text-slate-200 dark:text-zinc-800">•</span>
                                <span className="text-emerald-500">{t('learner')}</span>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2.5 text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                    <FlameIcon className="w-4 h-4" /> {profile.user.gamification?.currentStreak || 0} {t('days')}
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <TrophyIcon className="w-4 h-4" /> {profile.user.gamification?.xp || 0} XP
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CARTE 2 : ANALYSES & PERFORMANCES (Thème Neutre/Ardoise) */}
                <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 mb-8 flex items-center gap-4">
                        <div className="w-8 h-px bg-slate-100 dark:bg-zinc-800"></div>
                        {t('analytics_title')}
                    </h3>
                    <ProgressionDashboard capsules={profile.capsules} onNavigateToReviews={onNavigateToReviews} />
                </section>

                {/* CARTE 3 : INFORMATIONS PERSONNELLES (Thème Indigo) */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-indigo-500 px-2 flex items-center gap-4">
                        <div className="w-8 h-px bg-indigo-100 dark:bg-indigo-900/30"></div>
                        {t('personal_info')}
                    </h3>
                    <div className="bg-indigo-50/10 dark:bg-indigo-900/5 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 overflow-hidden divide-y divide-indigo-50 dark:divide-indigo-900/20 shadow-sm">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('username')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="bg-transparent text-slate-900 dark:text-white font-bold text-left md:text-right outline-none focus:text-indigo-500 transition-colors py-1" />
                        </div>
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('email_profile')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-slate-900 dark:text-white font-bold text-left md:text-right outline-none focus:text-indigo-500 transition-colors py-1" />
                        </div>
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <BrainIcon className="w-4 h-4" /> {t('learning_style')}
                            </label>
                            <select value={learningStyle} onChange={e => setLearningStyle(e.target.value as LearningStyle)} className="bg-white dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 text-slate-800 dark:text-white font-bold py-2 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm shadow-sm transition-all">
                                <option value="textual">{t('style_textual')}</option>
                                <option value="visual">{t('style_visual')}</option>
                                <option value="auditory">{t('style_auditory')}</option>
                                <option value="kinesthetic">{t('style_kinesthetic')}</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* ACCÈS GROUPES / CLASSES (Thème Indigo/Intermédiaire) */}
                {currentUser && (
                    <button onClick={onOpenGroupManager} className="w-full bg-white dark:bg-zinc-900 rounded-[28px] p-8 border border-slate-100 dark:border-zinc-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-indigo-200 transition-all group shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[22px] group-hover:rotate-6 transition-transform">
                                <SchoolIcon className="w-7 h-7" />
                            </div>
                            <div className="text-left">
                                <span className="block font-black text-slate-800 dark:text-zinc-100 text-lg">{role === 'teacher' ? t('my_classes') : t('my_groups')}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collaboration active</span>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-7 h-7 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                )}

                {/* PARTAGE & DONNÉES (Thème Gris/Sérieux) */}
                <section className="bg-slate-100/50 dark:bg-zinc-900/50 rounded-[40px] p-8 md:p-10 border border-slate-200 dark:border-zinc-800 shadow-inner">
                    <h4 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:text-zinc-400 mb-8 flex items-center gap-4">
                        <MailIcon className="w-5 h-5" /> {t('share_revisions')}
                    </h4>
                    <div className="bg-white dark:bg-zinc-950 rounded-[24px] border border-slate-200 dark:border-zinc-800 max-h-56 overflow-y-auto mb-8 shadow-sm">
                        {profile.capsules.length > 0 ? Object.keys(groupedCapsules).map(cat => (
                            <div key={cat}>
                                <div className="px-5 py-2.5 bg-slate-50 dark:bg-zinc-800 text-[10px] font-black text-slate-400 uppercase sticky top-0 border-b border-slate-100 dark:border-zinc-800 z-10">{cat}</div>
                                {groupedCapsules[cat].map(c => (
                                    <div key={c.id} className="flex items-center px-5 py-4 border-b border-slate-50 dark:border-zinc-900 last:border-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors" onClick={() => setSelectedCapsuleIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])}>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-5 transition-all ${selectedCapsuleIds.includes(c.id) ? 'bg-emerald-500 border-emerald-500 rotate-6' : 'border-slate-300 dark:border-zinc-700'}`}>
                                            {selectedCapsuleIds.includes(c.id) && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 truncate">{c.title}</span>
                                    </div>
                                ))}
                            </div>
                        )) : (
                            <div className="p-12 text-center">
                                <p className="text-xs font-black text-slate-400 italic uppercase tracking-widest">{t('no_modules')}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleSendEmail} disabled={selectedCapsuleIds.length === 0} className="w-full py-4.5 bg-slate-900 dark:bg-zinc-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-4 shadow-xl shadow-slate-200 dark:shadow-none">
                        <SendIcon className="w-5 h-5" /> {t('send_email')}
                    </button>
                </section>

                {/* PREMIUM SECTION (CARTE Ambre/Or) */}
                <div id="premium-section-anchor" className="grid grid-cols-1 gap-4 scroll-mt-24">
                    <div className={`rounded-[36px] p-8 flex items-center justify-between border-2 transition-all shadow-lg ${isPremium ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-amber-200'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-[24px] shadow-2xl ${isPremium ? 'bg-amber-400 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>
                                <CrownIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight">Memoraid Premium</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{isPremium ? 'Accès Illimité Actif' : t('premium_status_sub')}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                            <input type="checkbox" className="sr-only peer" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                </div>

                {/* DÉCONNEXION */}
                {currentUser && (
                    <button onClick={async () => { await signOut(auth!); onClose(); }} className="w-full py-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-3xl text-xs font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                        <LogOutIcon className="w-5 h-5" /> {t('logout')}
                    </button>
                )}
            </div>
        </div>
    );

    if (isOpenAsPage) return content;
    return <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>{content}</div>;
};

export default ProfileModal;