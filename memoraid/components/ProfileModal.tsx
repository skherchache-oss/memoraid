import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AppData, UserProfile, UserLevel, LearningStyle, UserRole, CognitiveCapsule, Group } from '../types';
import { XIcon, UserIcon, MailIcon, TrophyIcon, FlameIcon, BrainIcon, SchoolIcon, CrownIcon, ChevronRightIcon, LogOutIcon, CheckCircleIcon, SendIcon, GraduationCapIcon, ChevronDownIcon, CameraIcon, RefreshCwIcon, ImageIcon, SettingsIcon, ShieldCheckIcon, UsersIcon } from '../constants';
import { ToastType } from '../hooks/useToast';
import ProgressionDashboard from './ProgressionDashboard';
import { auth } from '../services/firebase';
import { signOut, type User } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileModalProps {
    profile: AppData;
    onClose: () => void;
    onUpdateProfile: (newProfile: Partial<UserProfile>) => void;
    addToast: (message: string, type: ToastType) => void;
    selectedCapsuleIds: string[];
    setSelectedCapsuleIds: React.Dispatch<React.SetStateAction<string[]>>;
    currentUser: User | null;
    onOpenGroupManager: () => void;
    userGroups?: Group[];
    isOpenAsPage?: boolean;
    onNavigateToReviews?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, onUpdateProfile, addToast, selectedCapsuleIds, setSelectedCapsuleIds, currentUser, onOpenGroupManager, userGroups = [], isOpenAsPage = false, onNavigateToReviews }) => {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [localName, setLocalName] = useState(profile.user.name);
    const isEditingRef = useRef(false);

    useEffect(() => { if (!isEditingRef.current) setLocalName(profile.user.name); }, [profile.user.name]);

    const handleLogout = async () => {
        try { await signOut(auth); onClose(); addToast("Déconnexion réussie", "info"); } catch (err) { addToast("Erreur lors de la déconnexion", "error"); }
    };

    const handleSaveName = () => {
        isEditingRef.current = false;
        const cleanName = localName.trim();
        if (!currentUser || cleanName === profile.user.name) return;
        if (cleanName === "") { setLocalName(profile.user.name); return; }
        onUpdateProfile({ name: cleanName });
        addToast("Nom mis à jour", "success");
    };

    const photoSource = useMemo(() => {
        if (profile.user.photoURL && profile.user.photoURL.length > 10) return profile.user.photoURL;
        if (currentUser?.photoURL) return currentUser.photoURL;
        return null;
    }, [profile.user.photoURL, currentUser?.photoURL]);

    const isValidPhoto = typeof photoSource === 'string' && (photoSource.startsWith('http') || photoSource.startsWith('data:image'));

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
        <div className={`bg-white dark:bg-zinc-950 flex flex-col ${isOpenAsPage ? 'min-h-screen pb-safe' : 'rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-md:h-full md:max-w-2xl h-[90vh] overflow-hidden'}`} onClick={e => e.stopPropagation()}>
            <header className={`flex items-center justify-between p-5 md:p-8 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 ${isOpenAsPage ? 'sticky top-0 z-10' : ''}`}>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 md:gap-4 tracking-tighter uppercase">
                    <UserIcon className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
                    {t('my_space')}
                </h2>
                <div className="flex items-center gap-2 md:gap-3">
                    {currentUser && (
                        <button onClick={handleLogout} className="p-2 md:px-4 md:py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all flex items-center gap-2">
                            <LogOutIcon className="w-4 h-4" /><span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{t('logout')}</span>
                        </button>
                    )}
                    {!isOpenAsPage && <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors"><XIcon className="w-6 h-6 text-slate-500" /></button>}
                </div>
            </header>

            <div className={`space-y-6 overflow-y-auto flex-grow ${isOpenAsPage ? 'py-6 px-4 md:px-8 pb-32' : 'p-6 md:p-8'}`}>
                <section className="relative mb-4">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="relative group/avatar">
                            <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`w-28 h-28 md:w-32 md:h-32 rounded-[32px] md:rounded-[40px] flex items-center justify-center shadow-2xl overflow-hidden cursor-pointer transition-all border-4 ${profile.user.role === 'teacher' ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-emerald-100 dark:border-emerald-900/30'} hover:scale-105`}>
                                {isValidPhoto ? <img src={photoSource as string} className={`w-full h-full object-cover ${isUploading ? 'opacity-40' : 'opacity-100'}`} alt="Profile" referrerPolicy="no-referrer" /> : <div className={`w-full h-full flex items-center justify-center ${profile.user.role === 'teacher' ? 'bg-indigo-500' : 'bg-emerald-500'}`}><UserIcon className="w-14 h-14 md:w-16 md:h-16 text-white/50" /></div>}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">{isUploading ? <RefreshCwIcon className="w-8 h-8 text-white animate-spin" /> : <CameraIcon className="w-8 h-8 text-white" />}</div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !currentUser) return; if (file.size > 1024 * 1024) { addToast("Image trop lourde (max 1Mo).", "error"); return; } setIsUploading(true); const reader = new FileReader(); reader.onloadend = () => { onUpdateProfile({ photoURL: reader.result as string }); setIsUploading(false); addToast("Photo mise à jour !", "success"); }; reader.readAsDataURL(file); }} className="sr-only" accept="image/*" />
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 truncate max-w-[280px] md:max-w-none">{profile.user.name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30"><TrophyIcon className="w-3 h-3" /> Lvl {profile.user.gamification?.level || 1}</div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/30"><FlameIcon className="w-3 h-3" /> {profile.user.gamification?.currentStreak || 0} {t('days')}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 dark:bg-zinc-900/30 rounded-[32px] p-6 border border-slate-100 dark:border-zinc-800"><ProgressionDashboard capsules={profile.capsules} onNavigateToReviews={onNavigateToReviews} /></section>

                {currentUser && (
                    <div className="space-y-4">
                        <button onClick={onOpenGroupManager} className="w-full bg-white dark:bg-zinc-900 rounded-[32px] p-5 md:p-6 border-2 border-indigo-500/20 hover:border-indigo-500 transition-all group flex items-center justify-between shadow-xl shadow-indigo-500/5">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="p-3.5 md:p-4 bg-indigo-500 text-white rounded-[20px] md:rounded-[24px] group-hover:rotate-6 transition-transform shadow-lg"><SchoolIcon className="w-6 h-6 md:w-7 md:h-7" /></div>
                                <div className="text-left"><span className="block font-black text-slate-900 dark:text-zinc-100 text-lg md:text-xl tracking-tight leading-none mb-1">{profile.user.role === 'teacher' ? t('my_classes') : t('my_groups')}</span><span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('manage_collaborations')}</span></div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 group-hover:translate-x-1 transition-all"><ChevronRightIcon className="w-5 h-5" /></div>
                        </button>

                        {profile.user.role === 'teacher' && userGroups.length > 0 && (
                            <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-[32px] p-5 md:p-6 border border-slate-100 dark:border-zinc-800 animate-fade-in">
                                <div className="flex items-center gap-2 mb-5 px-1"><UsersIcon className="w-4 h-4 text-emerald-500" /><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('enrolled_students')}</h4></div>
                                <div className="space-y-4">
                                    {userGroups.map(group => {
                                        const memberMap = new Map<string, any>();
                                        const profId = group.teacherId || currentUser.uid;
                                        (group.members || []).forEach(m => {
                                            if (m.userId === profId) return;
                                            const existing = memberMap.get(m.userId);
                                            const isPlaceholder = !m.name || m.name === 'Synchronisation en cours...' || m.name.includes('#') || m.name === 'Invité';
                                            if (!existing || (existing.isPending && !isPlaceholder)) { memberMap.set(m.userId, { ...m, isPending: isPlaceholder }); }
                                        });
                                        (group.memberIds || []).forEach(id => {
                                            if (id === profId) return;
                                            if (!memberMap.has(id)) { memberMap.set(id, { userId: id, name: "Synchronisation...", isPending: true }); }
                                        });
                                        const identifiedMembers = Array.from(memberMap.values());
                                        const totalCount = identifiedMembers.length;
                                        return (
                                            <div key={group.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-zinc-700">
                                                <div className="flex justify-between items-center mb-4"><span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate pr-2">{group.name}</span><span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg flex-shrink-0">{totalCount} {totalCount > 1 ? t('students').toLowerCase() : t('student').toLowerCase()}</span></div>
                                                {totalCount > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {identifiedMembers.map((s, idx) => (
                                                            <div key={`${s.userId}-${idx}`} className={`flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 rounded-xl border ${s.isPending ? 'border-dotted border-slate-200 animate-pulse' : 'border-slate-100 dark:border-zinc-800'}`}><div className={`w-4 h-4 rounded-full text-white text-[7px] flex items-center justify-center font-black ${s.isPending ? 'bg-slate-300' : 'bg-emerald-500'}`}>{s.isPending ? '?' : (s.name?.charAt(0).toUpperCase() || '?')}</div><span className={`text-[9px] font-bold ${s.isPending ? 'text-slate-400 italic' : 'text-slate-600 dark:text-zinc-300'}`}>{s.name}</span></div>
                                                        ))}
                                                    </div>
                                                ) : <p className="text-[9px] text-slate-400 italic">{t('no_students_invite_code').replace('{code}', group.inviteCode)}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <section className="bg-slate-100 dark:bg-zinc-900 rounded-[32px] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-inner-sm">
                    <div className="px-5 py-4 bg-slate-200/50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 flex items-center gap-2"><SettingsIcon className="w-3.5 h-3.5" /> {t('personal_info')}</h3><ShieldCheckIcon className="w-4 h-4 text-emerald-500/50" /></div>
                    <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                        <div className="px-5 py-5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"><label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('username')}</label><input type="text" value={localName} disabled={!currentUser} onChange={e => { isEditingRef.current = true; setLocalName(e.target.value); }} onBlur={handleSaveName} className="bg-white dark:bg-zinc-800 md:bg-transparent px-3 py-2 md:p-0 rounded-xl border md:border-0 border-slate-100 dark:border-zinc-700 text-slate-900 dark:text-white font-black md:text-right outline-none focus:text-indigo-600 text-sm" /></div>
                    </div>
                </section>

                <section className="bg-slate-50 dark:bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-slate-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 mb-6 flex items-center gap-3"><MailIcon className="w-4 h-4" /> {t('share_revisions')}</h4>
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 max-h-52 overflow-y-auto mb-6 shadow-sm divide-y divide-slate-50 dark:divide-zinc-900">
                        {profile.capsules.length > 0 ? Object.keys(groupedCapsules).map(cat => (
                            <div key={cat}><div className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 text-[8px] font-black text-slate-400 uppercase tracking-widest sticky top-0 border-b border-slate-100 dark:border-zinc-800 z-10">{cat}</div>
                                {groupedCapsules[cat].map(c => (
                                    <div key={c.id} className="flex items-center px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors" onClick={() => setSelectedCapsuleIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}><div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mr-4 flex-shrink-0 transition-all ${selectedCapsuleIds.includes(c.id) ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-300 dark:border-zinc-700'}`}>{selectedCapsuleIds.includes(c.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}</div><span className="text-sm font-bold text-slate-700 dark:text-zinc-300 truncate">{c.title}</span></div>
                                ))}
                            </div>
                        )) : <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest italic">{t('no_modules')}</div>}
                    </div>
                    <button onClick={() => { if (selectedCapsuleIds.length === 0) return; const selectedCapsules = profile.capsules.filter(c => selectedCapsuleIds.includes(c.id)); let bodyText = ""; selectedCapsules.forEach(capsule => { bodyText += `--- ${capsule.title.toUpperCase()} ---\n${capsule.summary}\n\nCONCEPTS CLÉS :\n${capsule.keyConcepts.map((kc, i) => `${i + 1}. ${kc.concept}: ${kc.explanation}`).join('\n')}\n\n`; }); window.location.href = `mailto:?subject=${encodeURIComponent(selectedCapsules.length === 1 ? t('email_subject_single').replace('{title}', selectedCapsules[0].title) : t('email_subject_plural').replace('{count}', selectedCapsules.length.toString()))}&body=${encodeURIComponent(bodyText)}`; }} disabled={selectedCapsuleIds.length === 0} className="w-full py-5 bg-slate-900 dark:bg-zinc-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-xl"><SendIcon className="w-4 h-4" /> {t('send_email')}</button>
                </section>
                
                {currentUser && <button onClick={handleLogout} className="w-full py-6 text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all rounded-2xl mb-8"><LogOutIcon className="w-4 h-4" /> {t('logout')}</button>}
            </div>
        </div>
    );
    if (isOpenAsPage) return content;
    return <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>{content}</div>;
};

export default ProfileModal;