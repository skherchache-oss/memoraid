import { useState, useMemo, useEffect } from 'react';
import type { Group, LearningModule as CognitiveCapsule } from '../types';
import { SchoolIcon, UsersIcon, ClipboardListIcon, XIcon, BookOpenIcon, Trash2Icon, ChevronDownIcon, PlusIcon, RefreshCwIcon } from '../constants';
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

    // Tri alphabétique des classes
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
        const finalName = newClassName.trim();
        if (finalName.length < 2) {
            addToast("Le nom doit faire au moins 2 caractères.", "error");
            return;
        }
        if (createLoading) return;
        setCreateLoading(true);
        try {
            const response = await createGroup(finalName);
            if (response && response.success) {
                addToast(`Classe "${finalName}" créée !`, "success");
                setNewClassName('');
                setIsCreatingClass(false);
                if (response.classId) setSelectedGroupId(response.classId); 
            }
        } catch (error: any) {
            addToast(error.message || "Erreur de création", "error");
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
            await shareModuleToGroup(userId, selectedGroup, capsule);
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
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Espace Enseignant</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <aside className="w-full md:w-80 bg-slate-50/50 dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 flex flex-col flex-shrink-0 overflow-y-auto">
                        <div className="p-6">
                            <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 block">Navigation Classes</label>
                            
                            {!isCreatingClass ? (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <select 
                                            className="relative w-full p-4 pr-12 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 text-base font-black text-slate-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-md appearance-none cursor-pointer"
                                            value={selectedGroupId || ''}
                                            onChange={(e) => setSelectedGroupId(e.target.value)}
                                            disabled={sortedGroups.length === 0}
                                        >
                                            {sortedGroups.length === 0 ? (
                                                <option value="">Aucune classe</option>
                                            ) : (
                                                <>
                                                    <option value="" disabled>Sélectionner une classe</option>
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
                                        <PlusIcon className="w-4 h-4" /> Nouvelle Classe
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateClass} className="space-y-3 p-4 bg-white dark:bg-zinc-900 rounded-[28px] border-2 border-emerald-500 shadow-2xl animate-fade-in-fast">
                                    <input 
                                        type="text" 
                                        autoFocus 
                                        placeholder="Nom (ex: 3ème B)" 
                                        value={newClassName} 
                                        onChange={(e) => setNewClassName(e.target.value)} 
                                        className="w-full p-4 border-2 border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-950 dark:text-white outline-none font-bold placeholder:text-slate-300" 
                                        required
                                        minLength={2}
                                        disabled={createLoading}
                                    />
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={createLoading || newClassName.trim().length < 2} 
                                            className="flex-1 bg-emerald-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none"
                                        >
                                            {createLoading ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : 'Créer'}
                                        </button>
                                        <button 
                                            type="button" 
                                            disabled={createLoading}
                                            onClick={() => { setIsCreatingClass(false); setNewClassName(''); }} 
                                            className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <nav className="flex flex-grow flex-col px-4 space-y-2 mt-4 pb-10">
                            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`}>
                                <SchoolIcon className="w-5 h-5" /> Vue d'ensemble
                            </button>
                            <button onClick={() => setActiveTab('classes')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'classes' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`}>
                                <UsersIcon className="w-5 h-5" /> Étudiants
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none translate-x-1' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`}>
                                <ClipboardListIcon className="w-5 h-5" /> Affectations
                            </button>
                        </nav>
                    </aside>

                    <main className="flex-grow p-4 md:p-10 overflow-y-auto bg-white dark:bg-zinc-900">
                        {!selectedGroup ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-30 text-center py-20">
                                <SchoolIcon className="w-20 h-20 mb-6" />
                                <p className="font-black uppercase tracking-widest text-xs">
                                    {sortedGroups.length === 0 ? "Créez votre première classe pour commencer" : "Sélectionnez une classe à gauche"}
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-fade-in-fast pb-20 md:pb-0">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6 md:space-y-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-slate-50 dark:bg-zinc-800/30 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                                            <div>
                                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">{selectedGroup.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code d'invitation :</span>
                                                    <span className="bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 select-all font-mono text-xl px-4 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">{selectedGroup.inviteCode}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setGroupToDelete(selectedGroup)} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 rounded-2xl transition-colors self-end md:self-center">
                                                <Trash2Icon className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-[32px] shadow-sm hover:shadow-md transition-shadow group">
                                                <UsersIcon className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Élèves actifs</p>
                                            </div>
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-emerald-100 dark:border-emerald-900/30 rounded-[32px] shadow-sm hover:shadow-md transition-shadow group">
                                                <SchoolIcon className="w-8 h-8 text-emerald-600 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{stats.averageMastery}%</p>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-2">Moyenne Classe</p>
                                            </div>
                                            <div className="p-8 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-[32px] shadow-sm hover:shadow-md transition-shadow group">
                                                <BookOpenIcon className="w-8 h-8 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
                                                <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalCapsules}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Modules Partagés</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'classes' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Liste des élèves</h3>
                                            <span className="text-xs font-bold text-slate-400">{selectedGroup.members?.filter(m => m.role === 'student' || m.role === undefined).length} inscrits</span>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                    <tr>
                                                        <th className="p-8">Nom de l'élève</th>
                                                        <th className="p-8 text-right">Maîtrise estimée</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                    {selectedGroup.members?.filter(m => m.role === 'student' || m.role === undefined).map((member, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="p-8 font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                {member.name}
                                                            </td>
                                                            <td className="p-8 text-right font-mono text-slate-400">-</td>
                                                        </tr>
                                                    ))}
                                                    {(selectedGroup.members?.filter(m => m.role === 'student' || m.role === undefined).length === 0) && (
                                                        <tr>
                                                            <td colSpan={2} className="p-20 text-center">
                                                                <div className="max-w-xs mx-auto">
                                                                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">Aucun élève n'a encore rejoint cette classe via le code d'invitation.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Modules partagés</h3>
                                            <button onClick={() => setIsAssigningModule(true)} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[22px] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">
                                                <PlusIcon className="w-5 h-5" /> Partager un module
                                            </button>
                                        </div>

                                        {isAssigningModule && (
                                            <div className="p-8 bg-indigo-50 dark:bg-zinc-800/50 rounded-[40px] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 animate-fade-in-fast mb-8">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sélectionner un module à partager</h4>
                                                    <button onClick={() => setIsAssigningModule(false)} className="p-2 hover:bg-white rounded-full transition-colors"><XIcon className="w-5 h-5 text-indigo-300"/></button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                                                    {teacherPersonalCapsules.length > 0 ? teacherPersonalCapsules.map(cap => (
                                                        <button key={cap.id} onClick={() => handleAssignModule(cap)} className="w-full flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                                            <span className="font-bold text-sm truncate pr-4">{cap.title}</span>
                                                            <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-white/20"><PlusIcon className="w-4 h-4 text-indigo-600 group-hover:text-white" /></div>
                                                        </button>
                                                    )) : (
                                                        <div className="col-span-2 text-center text-slate-400 py-10 italic text-sm">
                                                            Vous n'avez pas encore créé de modules personnels à partager.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            {classCapsules.length > 0 ? classCapsules.map(module => (
                                                <div key={module.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm group hover:border-emerald-300 dark:hover:border-emerald-900 transition-all">
                                                    <div className="flex items-center gap-5 min-w-0">
                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600"><BookOpenIcon className="w-6 h-6" /></div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-slate-900 dark:text-white truncate text-lg">{module.title}</h4>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stade SRS : {module.reviewStage}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setCapsuleToUnshare(module)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2Icon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="text-center py-20 bg-slate-50/50 dark:bg-zinc-800/20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                                                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                        <BookOpenIcon className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Aucun module n'est encore partagé</p>
                                                    <button onClick={() => setIsAssigningModule(true)} className="mt-6 text-xs font-black text-emerald-600 hover:underline uppercase tracking-widest">Commencer maintenant</button>
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
                message={`Cette action est irréversible. Toutes les données de la classe "${groupToDelete?.name}" seront perdues.`}
                confirmText="Supprimer définitivement" 
            />

            <ConfirmationModal 
                isOpen={!!capsuleToUnshare} 
                onClose={() => setCapsuleToUnshare(null)} 
                onConfirm={async () => {
                    if (selectedGroupId && capsuleToUnshare) {
                        await unshareModuleFromGroup(selectedGroupId, capsuleToUnshare.id);
                        addToast("Module retiré.", "success");
                        setCapsuleToUnshare(null);
                    }
                }} 
                title="Retirer ce module ?" 
                message="Les élèves de cette classe ne pourront plus accéder à ce contenu spécifique."
                confirmText="Retirer" 
            />
        </div>
    );
};

export default TeacherDashboard;
