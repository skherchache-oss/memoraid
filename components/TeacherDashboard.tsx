import React, { useState, useMemo, useEffect } from 'react';
import type { Group, CognitiveCapsule } from '../types';
import { SchoolIcon, UsersIcon, ClipboardListIcon, XIcon, BookOpenIcon, DownloadIcon, RefreshCwIcon, PlusIcon, Trash2Icon, ChevronDownIcon, SendIcon, SparklesIcon } from '../constants';
import { downloadBlob, generateFilename } from '../services/pdfService';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createGroup, shareCapsuleToGroup, deleteGroup, unshareCapsuleFromGroup } from '../services/cloudService';
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
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [isAssigningModule, setIsAssigningModule] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [capsuleToUnshare, setCapsuleToUnshare] = useState<CognitiveCapsule | null>(null);

    // Synchronisation de la sélection au démarrage ou si la liste change
    useEffect(() => {
        if (!selectedGroupId && teacherGroups.length > 0) {
            setSelectedGroupId(teacherGroups[0].id);
        }
    }, [teacherGroups, selectedGroupId]);

    const selectedGroup = useMemo(() => 
        teacherGroups.find(g => g.id === selectedGroupId), 
    [teacherGroups, selectedGroupId]);
    
    const classCapsules = useMemo(() => 
        allGroupCapsules.filter(c => c && c.groupId === selectedGroupId), 
    [allGroupCapsules, selectedGroupId]);

    const stats = useMemo(() => {
        if (!selectedGroup) return { totalStudents: 0, totalCapsules: 0, averageMastery: 0 };
        const members = Array.isArray(selectedGroup.members) ? selectedGroup.members : [];
        const totalStudents = members.filter(m => m.role === 'student' || m.role === undefined).length;
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
    }, [selectedGroup, classCapsules]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newClassName.trim();
        if (!trimmedName || createLoading) return;
        
        setCreateLoading(true);
        try {
            const newGroup = await createGroup(userId, userName, trimmedName);
            setNewClassName('');
            setIsCreatingClass(false);
            setSelectedGroupId(newGroup.id); 
            addToast(`Classe "${trimmedName}" créée !`, "success");
        } catch (error: any) {
            addToast("Erreur lors de la création.", "error");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteClassConfirm = async () => {
        if (!groupToDelete) return;
        try {
            await deleteGroup(groupToDelete.id);
            addToast("Classe supprimée.", "success");
            if (selectedGroupId === groupToDelete.id) setSelectedGroupId(null);
            setGroupToDelete(null);
        } catch (e) { addToast("Erreur suppression.", "error"); }
    };

    const handleAssignModule = async (capsule: CognitiveCapsule) => {
        if (!selectedGroup) return;
        try {
            await shareCapsuleToGroup(userId, selectedGroup, capsule);
            addToast(`Module partagé avec la classe !`, "success");
            setIsAssigningModule(false);
        } catch (error) { addToast("Erreur de partage.", "error"); }
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
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Espace Classes</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <aside className="w-full md:w-72 bg-slate-50/50 dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 flex flex-col flex-shrink-0">
                        <div className="p-4 md:p-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Choisir la classe</label>
                            
                            {!isCreatingClass ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select 
                                            className="w-full p-3.5 pr-10 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-bold text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none disabled:opacity-50"
                                            value={selectedGroupId || ''}
                                            onChange={(e) => setSelectedGroupId(e.target.value)}
                                            disabled={teacherGroups.length === 0}
                                        >
                                            {teacherGroups.length === 0 ? (
                                                <option value="">Aucune classe</option>
                                            ) : (
                                                <>
                                                    <option value="" disabled>Sélectionner...</option>
                                                    {teacherGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </>
                                            )}
                                        </select>
                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button onClick={() => setIsCreatingClass(true)} className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 py-3 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 transition-all uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                                        <PlusIcon className="w-3.5 h-3.5" /> Créer une classe
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateClass} className="space-y-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-emerald-500/20 shadow-xl animate-fade-in-fast">
                                    <input 
                                        type="text" 
                                        autoFocus 
                                        placeholder="Nom de classe" 
                                        value={newClassName} 
                                        onChange={(e) => setNewClassName(e.target.value)} 
                                        className="w-full p-4 border-2 border-emerald-300 rounded-xl bg-white text-slate-950 outline-none font-bold" 
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={createLoading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center justify-center">
                                            {createLoading ? <RefreshCwIcon className="w-3 h-3 animate-spin" /> : 'Créer'}
                                        </button>
                                        <button type="button" onClick={() => setIsCreatingClass(false)} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">Annuler</button>
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <nav className="flex flex-grow flex-col px-4 space-y-2 mt-4">
                            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <SchoolIcon className="w-5 h-5" /> Vue d'ensemble
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'classes' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <UsersIcon className="w-5 h-5" /> Étudiants
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'}`}>
                                <ClipboardListIcon className="w-5 h-5" /> Affectations
                            </button>
                        </nav>
                    </aside>

                    <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-white dark:bg-zinc-900">
                        {!selectedGroup ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-30 text-center py-20">
                                <SchoolIcon className="w-20 h-20 mb-6" />
                                <p className="font-black uppercase tracking-widest text-xs">
                                    {teacherGroups.length === 0 ? "Créez votre première classe pour commencer" : "Sélectionnez une classe à gauche"}
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-fade-in-fast pb-20 md:pb-0">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6 md:space-y-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedGroup.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Code : <span className="text-emerald-600 dark:text-emerald-400 select-all font-mono text-base ml-2">{selectedGroup.inviteCode}</span></p>
                                            </div>
                                            <button onClick={() => setGroupToDelete(selectedGroup)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 rounded-2xl transition-colors">
                                                <Trash2Icon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                            <div className="p-6 md:p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800">
                                                <UsersIcon className="w-6 h-6 text-blue-500 mb-4" />
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Élèves</p>
                                            </div>
                                            <div className="p-6 md:p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30">
                                                <SchoolIcon className="w-6 h-6 text-emerald-600 mb-4" />
                                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{stats.averageMastery}%</p>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Moyenne</p>
                                            </div>
                                            <div className="p-6 md:p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800">
                                                <BookOpenIcon className="w-6 h-6 text-purple-500 mb-4" />
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalCapsules}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Modules</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'classes' && (
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                    <tr>
                                                        <th className="p-6">Élève</th>
                                                        <th className="p-6 text-right">Maîtrise</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                    {selectedGroup.members?.filter(m => m.role === 'student' || m.role === undefined).map((member, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-6 font-bold text-slate-700 dark:text-zinc-200">{member.name}</td>
                                                            <td className="p-6 text-right text-slate-400">-</td>
                                                        </tr>
                                                    ))}
                                                    {(selectedGroup.members?.filter(m => m.role === 'student').length === 0) && (
                                                        <tr>
                                                            <td colSpan={2} className="p-10 text-center text-slate-400 italic text-sm">Aucun élève n'a encore rejoint cette classe.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Modules partagés</h3>
                                            <button onClick={() => setIsAssigningModule(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                                <PlusIcon className="w-4 h-4" /> Partager un module
                                            </button>
                                        </div>

                                        {isAssigningModule && (
                                            <div className="p-6 bg-indigo-50 dark:bg-zinc-800 rounded-[32px] border-2 border-dashed border-indigo-200 animate-fade-in-fast mb-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">Mes modules personnels</h4>
                                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                    {teacherPersonalCapsules.length > 0 ? teacherPersonalCapsules.map(cap => (
                                                        <button key={cap.id} onClick={() => handleAssignModule(cap)} className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group">
                                                            <span className="font-bold text-sm truncate">{cap.title}</span>
                                                            <PlusIcon className="w-4 h-4 text-indigo-200 group-hover:text-white" />
                                                        </button>
                                                    )) : (
                                                        <p className="text-center text-slate-400 py-4 italic text-xs">Vous n'avez pas encore créé de modules personnels.</p>
                                                    )}
                                                </div>
                                                <button onClick={() => setIsAssigningModule(false)} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 underline">Annuler</button>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {classCapsules.length > 0 ? classCapsules.map(capsule => (
                                                <div key={capsule.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm group">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600"><BookOpenIcon className="w-5 h-5" /></div>
                                                        <h4 className="font-black text-slate-900 dark:text-white truncate">{capsule.title}</h4>
                                                    </div>
                                                    <button onClick={() => setCapsuleToUnshare(capsule)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="text-center py-10 opacity-30">
                                                    <BookOpenIcon className="w-12 h-12 mx-auto mb-2" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">Aucun module partagé</p>
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

            <ConfirmationModal 
                isOpen={!!groupToDelete} 
                onClose={() => setGroupToDelete(null)} 
                onConfirm={handleDeleteClassConfirm} 
                title="Supprimer la classe ?" 
                message={`Cette action est irréversible. Toutes les données de "${groupToDelete?.name}" seront perdues.`}
                confirmText="Supprimer" 
            />

            <ConfirmationModal 
                isOpen={!!capsuleToUnshare} 
                onClose={() => setCapsuleToUnshare(null)} 
                onConfirm={async () => {
                    if (selectedGroupId && capsuleToUnshare) {
                        await unshareCapsuleFromGroup(selectedGroupId, capsuleToUnshare.id);
                        addToast("Module retiré.", "success");
                        setCapsuleToUnshare(null);
                    }
                }} 
                title="Retirer ce module ?" 
                message="Les élèves ne pourront plus accéder à ce contenu depuis cette classe."
                confirmText="Retirer" 
            />
        </div>
    );
};

export default TeacherDashboard;