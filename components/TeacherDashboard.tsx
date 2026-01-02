
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, CognitiveCapsule } from '../types';
import { SchoolIcon, UsersIcon, ClipboardListIcon, XIcon, BookOpenIcon, DownloadIcon, RefreshCwIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon } from '../constants';
import { downloadBlob, generateFilename } from '../services/pdfService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createGroup } from '../services/cloudService';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';

interface TeacherDashboardProps {
    onClose: () => void;
    teacherGroups: Group[];
    allGroupCapsules: CognitiveCapsule[];
    onAssignTask: (groupId: string, capsule: CognitiveCapsule) => void;
    userId: string;
    userName: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onClose, teacherGroups = [], allGroupCapsules = [], onAssignTask, userId, userName }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'assignments'>('overview');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Sécurisation des données d'entrée
    const safeGroups = useMemo(() => Array.isArray(teacherGroups) ? teacherGroups.filter(g => g && g.id) : [], [teacherGroups]);
    const safeCapsules = useMemo(() => Array.isArray(allGroupCapsules) ? allGroupCapsules : [], [allGroupCapsules]);

    // Sélection automatique de la première classe au chargement
    useEffect(() => {
        if (!selectedGroupId && safeGroups.length > 0) {
            setSelectedGroupId(safeGroups[0].id);
        }
    }, [safeGroups, selectedGroupId]);

    const selectedGroup = useMemo(() => 
        safeGroups.find(g => g.id === selectedGroupId), 
    [safeGroups, selectedGroupId]);
    
    const classCapsules = useMemo(() => 
        safeCapsules.filter(c => c && c.groupId === selectedGroupId), 
    [safeCapsules, selectedGroupId]);

    const stats = useMemo(() => {
        if (!selectedGroup) return { totalStudents: 0, totalCapsules: 0, averageMastery: 0 };
        
        const members = Array.isArray(selectedGroup.members) ? selectedGroup.members : [];
        const totalStudents = members.filter(m => m && m.role !== 'owner').length;
        const totalCapsules = classCapsules.length;
        
        let totalMasterySum = 0;
        let recordedScores = 0;
        
        classCapsules.forEach(cap => {
            if (cap && Array.isArray(cap.groupProgress)) {
                cap.groupProgress.forEach(prog => {
                    if (prog) {
                        totalMasterySum += (prog.masteryScore || 0);
                        recordedScores++;
                    }
                });
            }
        });
        
        const averageMastery = recordedScores > 0 ? Math.round(totalMasterySum / recordedScores) : 0;

        return { totalStudents, totalCapsules, averageMastery };
    }, [selectedGroup, classCapsules]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedName = newClassName.trim();
        if (!trimmedName || createLoading) return;
        
        if (!userId) {
            addToast("Vous devez être connecté.", "error");
            return;
        }
        
        setCreateLoading(true);
        try {
            const newGroup = await createGroup(userId, userName, trimmedName);
            setNewClassName('');
            setIsCreatingClass(false);
            setSelectedGroupId(newGroup.id);
            setActiveTab('overview');
            addToast(`Classe "${trimmedName}" créée !`, "success");
        } catch (error: any) {
            console.error("Create Class Error:", error);
            addToast("Erreur lors de la création.", "error");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleExportReport = async () => {
        if (!selectedGroup) return;
        setExportStatus('loading');
        
        try {
            const doc = await PDFDocument.create();
            const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
            const fontNormal = await doc.embedFont(StandardFonts.Helvetica);
            let page = doc.addPage();
            let y = page.getHeight() - 50;

            page.drawText(`Rapport : ${selectedGroup.name}`, { x: 50, y, size: 20, font: fontBold });
            y -= 40;

            const students = (Array.isArray(selectedGroup.members) ? selectedGroup.members : []).filter(m => m && m.role !== 'owner');
            for (const student of students) {
                if (y < 50) {
                    page = doc.addPage();
                    y = page.getHeight() - 50;
                }
                page.drawText(student.name || "Inconnu", { x: 50, y, size: 12, font: fontNormal });
                y -= 20;
            }

            const pdfBytes = await doc.save();
            downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Rapport', selectedGroup.name, 'pdf'));
            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 2000);
        } catch (e) {
            setExportStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-zinc-800">
                <header className="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 p-6 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                            <SchoolIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('teacher_space')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('class_management')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors group">
                        <XIcon className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
                    </button>
                </header>

                <div className="flex flex-grow overflow-hidden">
                    <aside className="w-72 bg-slate-50/50 dark:bg-zinc-950 border-r border-slate-100 dark:border-zinc-800 flex flex-col">
                        <div className="p-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t('select_class')}</label>
                            
                            {!isCreatingClass ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 pr-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none"
                                            value={selectedGroupId || ''}
                                            onChange={(e) => setSelectedGroupId(e.target.value)}
                                        >
                                            <option value="" disabled>{safeGroups.length > 0 ? "Choisir une classe..." : "Aucune classe"}</option>
                                            {safeGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <PlusIcon className="w-4 h-4 rotate-45" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsCreatingClass(true)}
                                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white py-3 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 transition-all active:scale-95"
                                    >
                                        <PlusIcon className="w-4 h-4" /> {t('new_class')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateClass} className="space-y-3 animate-fade-in-fast bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder={t('class_name')}
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="w-full p-3 text-sm border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-zinc-800 dark:text-white"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="submit" 
                                            disabled={!newClassName.trim() || createLoading}
                                            className="flex-1 bg-emerald-600 text-white text-xs py-2.5 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
                                        >
                                            {createLoading ? "..." : t('create')}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsCreatingClass(false)}
                                            className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 text-xs py-2.5 rounded-lg font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        <nav className="flex-grow px-4 space-y-2">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900'}`}
                            >
                                <SchoolIcon className="w-5 h-5" /> {t('overview')}
                            </button>
                            <button 
                                onClick={() => setActiveTab('classes')}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'classes' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900'}`}
                            >
                                <UsersIcon className="w-5 h-5" /> {t('students')}
                            </button>
                            <button 
                                onClick={() => setActiveTab('assignments')}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900'}`}
                            >
                                <ClipboardListIcon className="w-5 h-5" /> {t('assignments')}
                            </button>
                        </nav>
                    </aside>

                    <main className="flex-grow p-8 overflow-y-auto bg-white dark:bg-zinc-900">
                        {!selectedGroup ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-zinc-800">
                                <SchoolIcon className="w-20 h-20 mb-6 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-xs">Sélectionnez ou créez une classe à gauche</p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-fade-in-fast">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedGroup.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Code d'invitation : <span className="text-emerald-600 dark:text-emerald-400 select-all font-mono text-base ml-2">{selectedGroup.inviteCode || 'N/A'}</span></p>
                                            </div>
                                            <button 
                                                onClick={handleExportReport}
                                                disabled={exportStatus !== 'idle'}
                                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                                            >
                                                {exportStatus === 'loading' ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                                                {t('export_report')}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <div className="p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800">
                                                <UsersIcon className="w-6 h-6 text-blue-500 mb-4" />
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('students')}</p>
                                            </div>
                                            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30">
                                                <SchoolIcon className="w-6 h-6 text-emerald-600 mb-4" />
                                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{stats.averageMastery}%</p>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">{t('class_average')}</p>
                                            </div>
                                            <div className="p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800">
                                                <BookOpenIcon className="w-6 h-6 text-purple-500 mb-4" />
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalCapsules}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('shared_capsules')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'classes' && (
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('student_list')}</h3>
                                        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                    <tr>
                                                        <th className="p-6">{t('username')}</th>
                                                        <th className="p-6">Rôle</th>
                                                        <th className="p-6 text-right">Maîtrise</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                    {(Array.isArray(selectedGroup?.members) ? selectedGroup.members : []).map((member, idx) => (
                                                        <tr key={member?.userId || idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                            <td className="p-6 font-bold text-slate-700 dark:text-zinc-200">{member?.name || "Apprenant"}</td>
                                                            <td className="p-6">
                                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member?.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                    {member?.role === 'owner' ? "Prof" : "Élève"}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 text-right text-slate-400">-</td>
                                                        </tr>
                                                    ))}
                                                    {(Array.isArray(selectedGroup?.members) && selectedGroup.members.length === 0) && (
                                                        <tr>
                                                            <td colSpan={3} className="p-10 text-center text-slate-400 italic">Aucun élève dans cette classe.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Modules partagés</h3>
                                        <div className="space-y-4">
                                            {classCapsules.length > 0 ? classCapsules.map(capsule => {
                                                const totalMembers = Array.isArray(selectedGroup?.members) ? selectedGroup.members.length : 1;
                                                const progressCount = Array.isArray(capsule.groupProgress) ? capsule.groupProgress.length : 0;
                                                const completionRate = Math.round((progressCount / Math.max(1, totalMembers - 1)) * 100);
                                                
                                                return (
                                                    <div key={capsule.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                                                                <BookOpenIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-black text-slate-900 dark:text-white">{capsule.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-32 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${completionRate}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-black text-emerald-600">
                                                                {completionRate}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="text-center py-20 bg-slate-50/50 dark:bg-zinc-950/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucune capsule partagée avec cette classe</p>
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
        </div>
    );
};

export default TeacherDashboard;
