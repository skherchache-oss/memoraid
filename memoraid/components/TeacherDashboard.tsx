import React, { useState, useMemo, useEffect } from 'react';
import type { Group, LearningModule as CognitiveCapsule, GroupMember } from '../types';
import { SchoolIcon, UsersIcon, ClipboardListIcon, XIcon, BookOpenIcon, Trash2Icon, ChevronDownIcon, PlusIcon, RefreshCwIcon, MailIcon, Share2Icon } from '../constants';
import { createGroup, deleteGroup, shareModuleToGroup, unshareModuleFromGroup } from '../services/cloudService';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';

interface TeacherDashboardProps {
    onClose: () => void;
    teacherGroups: Group[];
    allGroupCapsules: CognitiveCapsule[];
    teacherPersonalCapsules: CognitiveCapsule[];
    onAssignTask: (groupId: string, capsule: CognitiveCapsule) => void;
    userId: string;
    userName: string;
    onNavigateToCreate: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
    onClose, 
    teacherGroups = [], 
    allGroupCapsules = [], 
    teacherPersonalCapsules = [],
    userId, 
    userName,
    onNavigateToCreate
}) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'assignments'>('overview');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState(''); 
    const [createLoading, setCreateLoading] = useState(false);
    
    const [isAssigningModule, setIsAssigningModule] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [capsuleToUnshare, setCapsuleToUnshare] = useState<CognitiveCapsule | null>(null);

    const formatSafeDate = (dateVal: any) => {
        if (!dateVal) return '-';
        let d: Date;
        if (dateVal && typeof dateVal === 'object' && 'seconds' in dateVal) {
            d = new Date(dateVal.seconds * 1000);
        } else {
            d = new Date(dateVal);
        }
        if (d.toString() === 'Invalid Date') return '-';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const sortedGroups = useMemo(() => {
        return [...teacherGroups].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [teacherGroups]);

    useEffect(() => {
        if (!selectedGroupId && sortedGroups.length > 0) {
            setSelectedGroupId(sortedGroups[0].id);
        }
    }, [sortedGroups, selectedGroupId]);

    const selectedGroup = useMemo(() => 
        sortedGroups.find(g => g.id === selectedGroupId), 
    [sortedGroups, selectedGroupId]);
    
    const classCapsules = useMemo(() => 
        allGroupCapsules.filter(c => c && c.groupId === selectedGroupId), 
    [allGroupCapsules, selectedGroupId]);

    // LISTE DES ÉLÈVES DÉDOUBLONNÉE ET PRIORISÉE (JAN 14 > JAN 12)
    const studentsList = useMemo(() => {
        if (!selectedGroup) return [];
        const memberMap = new Map<string, any>();
        const membersArray = selectedGroup.members || [];
        const profId = selectedGroup.teacherId || userId;

        // 1. On traite les membres enregistrés.
        membersArray.forEach(m => {
            if (m.userId === profId) return; 
            
            const isPlaceholder = !m.name || m.name === 'Synchronisation en cours...' || m.name.includes('#') || m.name === 'Invité';
            const existing = memberMap.get(m.userId);
            
            if (!existing) {
                memberMap.set(m.userId, { ...m, isPending: isPlaceholder });
            } else {
                // Si on a déjà une entrée, et que celle-ci est un nom réel, elle gagne.
                if (existing.isPending && !isPlaceholder) {
                    memberMap.set(m.userId, { ...m, isPending: false });
                } 
                // Si les deux sont des noms réels, on prend la plus récente (Jan 14)
                else if (!existing.isPending && !isPlaceholder) {
                    const existingDate = (existing.joinedAt?.seconds) ? existing.joinedAt.seconds * 1000 : new Date(existing.joinedAt).getTime();
                    const currentDate = (m.joinedAt?.seconds) ? m.joinedAt.seconds * 1000 : new Date(m.joinedAt).getTime();
                    if (currentDate > existingDate) {
                        memberMap.set(m.userId, { ...m, isPending: false });
                    }
                }
            }
        });
        
        // 2. Vérifier les memberIds qui n'auraient ABSOLUMENT aucune entrée dans 'members'
        (selectedGroup.memberIds || []).forEach(id => {
            if (id !== profId && !memberMap.has(id)) {
                memberMap.set(id, {
                    userId: id,
                    name: `Synchronisation en cours...`,
                    isPending: true,
                    joinedAt: selectedGroup.createdAt || Date.now(),
                    role: 'student'
                });
            }
        });

        const list = Array.from(memberMap.values());
        return list.sort((a, b) => {
            const dateA = (a.joinedAt && a.joinedAt.seconds) ? a.joinedAt.seconds * 1000 : new Date(a.joinedAt).getTime();
            const dateB = (b.joinedAt && b.joinedAt.seconds) ? b.joinedAt.seconds * 1000 : new Date(b.joinedAt).getTime();
            return dateB - dateA;
        });
    }, [selectedGroup, userId]);

    const stats = useMemo(() => {
        const totalStudents = studentsList.length;
        const totalCapsules = classCapsules.length;
        let totalMasterySum = 0;
        let recordedScores = 0;
        classCapsules.forEach(cap => {
            if (cap && Array.isArray(cap.groupProgress)) {
                cap.groupProgress.forEach(prog => {
                    totalMasterySum += (prog.masteryScore || 0);
                    recordedScores++;
                });
            }
        });
        return { totalStudents, totalCapsules, averageMastery: recordedScores > 0 ? Math.round(totalMasterySum / recordedScores) : 0 };
    }, [studentsList, classCapsules]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalName = newClassName.trim();
        if (finalName.length < 2) { addToast("Min. 2 char.", "error"); return; }
        if (createLoading) return;
        setCreateLoading(true);
        try {
            const response = await createGroup(finalName);
            if (response && response.success) {
                addToast(t('capsule_created'), "success");
                setNewClassName('');
                setIsCreatingClass(false);
                if (response.classId) setSelectedGroupId(response.classId); 
            }
        } catch (error: any) { addToast(error.message || t('error_generation'), "error");
        } finally { setCreateLoading(false); }
    };

    const handleDeleteClassConfirm = async () => {
        if (!groupToDelete) return;
        try {
            await deleteGroup(groupToDelete.id);
            addToast(t('delete_error'), "success");
            if (selectedGroupId === groupToDelete.id) setSelectedGroupId(null);
            setGroupToDelete(null);
        } catch (e) { addToast(t('delete_error'), "error"); }
    };

    const handleAssignModule = async (capsule: CognitiveCapsule) => {
        if (!selectedGroup) return;
        try {
            await shareModuleToGroup(userId, selectedGroup, capsule);
            addToast(t('capsule_created'), "success");
            setIsAssigningModule(false);
        } catch (error) { addToast(t('share_error'), "error"); }
    };

    const handleShareByEmail = () => {
        if (!selectedGroup) return;
        const subject = encodeURIComponent(`${t('join_a_class')} "${selectedGroup.name}"`);
        const body = encodeURIComponent(
            `Bonjour,\n\nJe vous invite à rejoindre ma classe sur Memoraid.\n\n` +
            `Votre code d'accès : ${selectedGroup.inviteCode}\n\n` +
            `Pour nous rejoindre :\n` +
            `1. Connectez-vous sur https://memoraid-app.fr\n` +
            `2. Allez dans Profil > Mes Groupes\n` +
            `3. Cliquez sur "Rejoindre une classe" et entrez le code.\n\n` +
            `À bientôt !`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full h-full md:rounded-[40px] shadow-2xl md:max-w-6xl md:h-[90vh] flex flex-col overflow-hidden border border-white/5">
                
                <header className="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 p-5 md:p-6 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200/20">
                            <SchoolIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t('teacher_space')}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <aside className="w-full md:w-80 bg-slate-50/50 dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 flex flex-col flex-shrink-0 overflow-y-auto">
                        <div className="p-6">
                            <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 block">{t('class_nav')}</label>
                            
                            {!isCreatingClass ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <select 
                                            className="w-full p-4 pr-12 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 text-base font-black text-slate-900 dark:text-zinc-100 focus:border-emerald-500 outline-none transition-all shadow-md appearance-none cursor-pointer"
                                            value={selectedGroupId || ''}
                                            onChange={(e) => setSelectedGroupId(e.target.value)}
                                            disabled={sortedGroups.length === 0}
                                        >
                                            {sortedGroups.length === 0 ? (
                                                <option value="">{t('no_class')}</option>
                                            ) : (
                                                <>
                                                    <option value="" disabled>{t('select_class')}</option>
                                                    {sortedGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </>
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsCreatingClass(true)} 
                                        className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-emerald-700 dark:text-emerald-400 py-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 transition-all uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300"
                                    >
                                        <PlusIcon className="w-4 h-4" /> {t('new_class')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateClass} className="space-y-3 p-4 bg-white dark:bg-zinc-900 rounded-[28px] border-2 border-emerald-500 shadow-2xl animate-fade-in-fast">
                                    <input 
                                        type="text" 
                                        autoFocus 
                                        placeholder={t('class_name')} 
                                        value={newClassName} 
                                        onChange={(e) => setNewClassName(e.target.value)} 
                                        className="w-full p-4 border-2 border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-950 dark:text-white outline-none font-bold placeholder:text-slate-300" 
                                        required
                                        minLength={2}
                                        disabled={createLoading}
                                    />
                                    <div className="flex gap-2 pt-2">
                                        <button type="submit" disabled={createLoading || newClassName.trim().length < 2} className="flex-1 bg-emerald-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none">
                                            {createLoading ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : t('validate')}
                                        </button>
                                        <button type="button" disabled={createLoading} onClick={() => { setIsCreatingClass(false); setNewClassName(''); }} className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                            {t('cancel')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <nav className="flex flex-grow flex-col px-4 space-y-2 mt-2 pb-10">
                            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-xl translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <SchoolIcon className="w-5 h-5" /> {t('overview')}
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'classes' ? 'bg-emerald-500 text-white shadow-xl translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <UsersIcon className="w-5 h-5" /> {t('students')}
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-xl translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <ClipboardListIcon className="w-5 h-5" /> {t('assignments')}
                            </button>
                        </nav>
                    </aside>

                    <main className="flex-grow p-4 md:p-10 overflow-y-auto bg-white dark:bg-zinc-900">
                        {!selectedGroup ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-30 text-center py-20">
                                <SchoolIcon className="w-20 h-20 mb-6" />
                                <p className="font-black uppercase tracking-widest text-xs">
                                    {sortedGroups.length === 0 ? t('create_first_class') : t('select_class')}
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-fade-in-fast pb-24">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6 md:space-y-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-slate-50 dark:bg-zinc-800/30 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                                            <div className="flex-grow">
                                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4 truncate pr-4">{selectedGroup.name}</h3>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('invitation_code')}</span>
                                                        <span className="bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 select-all font-mono text-xl px-4 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">{selectedGroup.inviteCode}</span>
                                                    </div>
                                                    <button onClick={handleShareByEmail} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/30">
                                                        <MailIcon className="w-4 h-4" /> {t('share_by_email')}
                                                    </button>
                                                </div>
                                            </div>
                                            <button onClick={() => setGroupToDelete(selectedGroup)} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 rounded-2xl transition-colors self-end md:self-center">
                                                <Trash2Icon className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-[32px] shadow-sm group">
                                                <UsersIcon className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t('students')}</p>
                                            </div>
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-emerald-100 dark:border-emerald-900/30 rounded-[32px] shadow-sm group">
                                                <SchoolIcon className="w-8 h-8 text-emerald-600 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{stats.averageMastery}%</p>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-2">{t('class_average')}</p>
                                            </div>
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-[32px] shadow-sm group">
                                                <BookOpenIcon className="w-8 h-8 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalCapsules}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t('shared_capsules')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'classes' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('student_list')}</h3>
                                            <span className="text-xs font-black text-emerald-600 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">{stats.totalStudents} {stats.totalStudents > 1 ? t('students') : t('student')}</span>
                                        </div>
                                        
                                        {studentsList.length > 0 ? (
                                            <div className="space-y-3 md:space-y-0 md:bg-white md:dark:bg-zinc-900 md:border md:border-slate-100 md:dark:border-zinc-800 md:rounded-[40px] md:overflow-hidden md:shadow-sm">
                                                <table className="hidden md:table w-full text-left">
                                                    <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                        <tr>
                                                            <th className="p-8">{t('username')}</th>
                                                            <th className="p-8 text-right">{t('enrolled_on')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                        {studentsList.map((member, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="p-8 font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${member.isPending ? 'bg-slate-300 animate-pulse' : 'bg-emerald-500'}`}>
                                                                        {member.isPending ? '?' : (member.name?.charAt(0).toUpperCase() || '?')}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={member.isPending ? 'text-slate-400 italic' : ''}>{member.name}</span>
                                                                        {member.isPending && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">En attente de connexion...</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="p-8 text-right font-mono text-xs text-slate-400">
                                                                    {formatSafeDate(member.joinedAt)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                <div className="grid md:hidden grid-cols-1 gap-3">
                                                    {studentsList.map((member, idx) => (
                                                        <div key={idx} className="p-5 bg-white dark:bg-zinc-800 rounded-[28px] border border-slate-100 dark:border-zinc-700 flex items-center justify-between shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl ${member.isPending ? 'bg-slate-200 animate-pulse' : 'bg-emerald-500'}`}>
                                                                    {member.isPending ? '?' : (member.name?.charAt(0).toUpperCase() || '?')}
                                                                </div>
                                                                <div>
                                                                    <p className={`font-black leading-none mb-1 ${member.isPending ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>{member.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.isPending ? 'Synchro requise' : t('role_student')}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('enrolled_on')}</p>
                                                                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">{formatSafeDate(member.joinedAt)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-20 text-center bg-slate-50/50 dark:bg-zinc-950/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-zinc-800">
                                                <div className="max-w-xs mx-auto">
                                                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                                    <p className="text-slate-400 font-bold text-sm leading-relaxed mb-6">{t('no_students')}</p>
                                                    <button onClick={handleShareByEmail} className="px-6 py-3 bg-white dark:bg-zinc-900 text-emerald-600 border border-emerald-100 dark:border-emerald-800 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-50">
                                                        {t('invite_students_btn')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('share_module_title')}</h3>
                                            <button onClick={() => setIsAssigningModule(true)} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[22px] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">
                                                <PlusIcon className="w-5 h-5" /> {t('share_a_module_btn')}
                                            </button>
                                        </div>

                                        {isAssigningModule && (
                                            <div className="p-8 bg-indigo-50 dark:bg-zinc-800/50 rounded-[40px] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 animate-fade-in-fast mb-8">
                                                <div className="flex justify-between items-center mb-6 px-2">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{t('select_module_to_share')}</h4>
                                                    <button onClick={() => setIsAssigningModule(false)} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors"><XIcon className="w-5 h-5 text-indigo-300"/></button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                                    {teacherPersonalCapsules.length > 0 ? teacherPersonalCapsules.map(cap => (
                                                        <button key={cap.id} onClick={() => handleAssignModule(cap)} className="w-full flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                                            <span className="font-bold text-sm truncate pr-4">{cap.title}</span>
                                                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg group-hover:bg-white/20 flex-shrink-0"><PlusIcon className="w-4 h-4 text-indigo-600 group-hover:text-white" /></div>
                                                        </button>
                                                    )) : (
                                                        <div className="col-span-2 text-center text-slate-400 py-10 italic text-sm">
                                                            {t('no_personal_modules_to_share')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            {classCapsules.length > 0 ? classCapsules.map(module => (
                                                <div key={module.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm group hover:border-emerald-300 dark:hover:border-emerald-900 transition-all">
                                                    <div className="flex items-center gap-5 min-w-0">
                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 flex-shrink-0"><BookOpenIcon className="w-6 h-6" /></div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-slate-900 dark:text-white truncate text-lg">{module.title}</h4>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('srs_stage')} {module.reviewStage}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setCapsuleToUnshare(module)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2Icon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="text-center py-20 bg-slate-50/50 dark:bg-zinc-800/20 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-zinc-800">
                                                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                        <BookOpenIcon className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('no_modules_shared_yet')}</p>
                                                    <button onClick={() => setIsAssigningModule(true)} className="mt-6 text-xs font-black text-emerald-600 hover:underline uppercase tracking-widest">{t('start_now')}</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <ConfirmationModal isOpen={!!groupToDelete} onClose={() => setGroupToDelete(null)} onConfirm={handleDeleteClassConfirm} title="Supprimer la classe ?" message={`Cette action est irréversible. Toutes les données de la classe "${groupToDelete?.name}" seront perdues.`} confirmText="Supprimer définitivement" />
            <ConfirmationModal isOpen={!!capsuleToUnshare} onClose={() => setCapsuleToUnshare(null)} onConfirm={async () => { if (selectedGroupId && capsuleToUnshare) { await unshareModuleFromGroup(selectedGroupId, capsuleToUnshare.id); addToast(t('report_downloaded'), "success"); setCapsuleToUnshare(null); } }} title="Retirer ce module ?" message="Les élèves de cette classe ne pourront plus accéder à ce contenu spécifique." confirmText="Retirer" />
        </div>
    );
};

export default TeacherDashboard;