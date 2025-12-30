import React, { useState, useMemo } from 'react';
import type { Group, CognitiveCapsule } from '../types';
import { SchoolIcon, UsersIcon, ClipboardListIcon, XIcon, BookOpenIcon, DownloadIcon, RefreshCwIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon } from '../constants';
import { downloadBlob, generateFilename } from '../services/pdfService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createGroup } from '../services/cloudService';
import { useLanguage } from '../contexts/LanguageContext';

interface TeacherDashboardProps {
    onClose: () => void;
    teacherGroups: Group[];
    allGroupCapsules: CognitiveCapsule[];
    onAssignTask: (groupId: string, capsule: CognitiveCapsule) => void;
    userId: string;
    userName: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onClose, teacherGroups, allGroupCapsules, onAssignTask, userId, userName }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'assignments'>('overview');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(teacherGroups[0]?.id || null);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const selectedGroup = teacherGroups.find(g => g.id === selectedGroupId);
    
    const classCapsules = useMemo(() => 
        allGroupCapsules.filter(c => c.groupId === selectedGroupId), 
    [allGroupCapsules, selectedGroupId]);

    const stats = useMemo(() => {
        if (!selectedGroup) return null;
        
        const totalStudents = selectedGroup.members.filter(m => m.role !== 'owner').length;
        const totalCapsules = classCapsules.length;
        
        let totalMasterySum = 0;
        let recordedScores = 0;
        
        classCapsules.forEach(cap => {
            cap.groupProgress?.forEach(prog => {
                totalMasterySum += prog.masteryScore;
                recordedScores++;
            });
        });
        
        const averageMastery = recordedScores > 0 ? Math.round(totalMasterySum / recordedScores) : 0;

        return { totalStudents, totalCapsules, averageMastery };
    }, [selectedGroup, classCapsules]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const trimmedName = newClassName.trim();
        if (!trimmedName) return;
        
        if (!userId) {
            alert("Vous devez être connecté pour créer une classe.");
            return;
        }
        
        setCreateLoading(true);
        try {
            console.log("Tentative de création de la classe:", trimmedName);
            const newGroup = await createGroup(userId, userName, trimmedName);
            console.log("Classe créée avec succès:", newGroup.id);
            
            // On force la sélection de la nouvelle classe après le délai de propagation Firestore
            setSelectedGroupId(newGroup.id);
            setNewClassName('');
            setIsCreatingClass(false);
            setActiveTab('overview');
        } catch (error) {
            console.error("Erreur lors de la création de la classe:", error);
            alert("Erreur technique lors de la création. Veuillez réessayer.");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleExportReport = async () => {
        if (!selectedGroup) return;
        setExportStatus('loading');
        
        try {
            const doc = await PDFDocument.create();
            const font = await doc.embedFont(StandardFonts.Helvetica);
            const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
            let page = doc.addPage();
            let y = page.getHeight() - 50;

            const addBrandingToDoc = (page: any, width: number, height: number) => {
                page.drawText('MEMORAID', {
                    x: width - 80,
                    y: height - 30,
                    size: 10,
                    font: fontBold,
                    color: rgb(0.06, 0.73, 0.5), 
                });
            };
            addBrandingToDoc(page, page.getWidth(), page.getHeight());

            page.drawText(`Rapport de Classe : ${selectedGroup.name}`, { x: 50, y, size: 20, font: fontBold });
            y -= 30;
            page.drawText(`Date : ${new Date().toLocaleDateString()}`, { x: 50, y, size: 12, font });
            y -= 40;

            page.drawText("Étudiant", { x: 50, y, size: 12, font: fontBold });
            page.drawText("Moyenne", { x: 200, y, size: 12, font: fontBold });
            page.drawText("Dernière activité", { x: 300, y, size: 12, font: fontBold });
            y -= 20;
            page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 20;

            const students = selectedGroup.members.filter(m => m.role !== 'owner');
            for (const student of students) {
                let studentTotal = 0;
                let studentCount = 0;
                let lastActive = 0;

                classCapsules.forEach(cap => {
                    const prog = cap.groupProgress?.find(p => p.userId === student.userId);
                    if (prog) {
                        studentTotal += prog.masteryScore;
                        studentCount++;
                        if (prog.lastReviewed > lastActive) lastActive = prog.lastReviewed;
                    }
                });

                const avg = studentCount > 0 ? Math.round(studentTotal / studentCount) : 0;
                const lastActiveDate = lastActive > 0 ? new Date(lastActive).toLocaleDateString() : '-';

                if (y < 50) {
                    page = doc.addPage();
                    addBrandingToDoc(page, page.getWidth(), page.getHeight());
                    y = page.getHeight() - 50;
                }

                page.drawText(student.name, { x: 50, y, size: 10, font });
                page.drawText(`${avg}%`, { x: 200, y, size: 10, font });
                page.drawText(lastActiveDate, { x: 300, y, size: 10, font });
                y -= 20;
            }

            const pdfBytes = await doc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadBlob(blob, generateFilename('Rapport', selectedGroup.name, 'pdf'));
            
            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
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
                                    <select 
                                        className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none"
                                        value={selectedGroupId || ''}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                    >
                                        {teacherGroups.length > 0 ? teacherGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        )) : <option value="">{t('no_class')}</option>}
                                    </select>
                                    <button 
                                        onClick={() => setIsCreatingClass(true)}
                                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 py-3 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 transition-all active:scale-95"
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
                                        className="w-full p-3 text-sm border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="submit" 
                                            disabled={!newClassName.trim() || createLoading}
                                            className="flex-1 bg-emerald-600 text-white text-xs py-2.5 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                        >
                                            {createLoading ? '...' : t('create')}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsCreatingClass(false)}
                                            className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-xs py-2.5 rounded-lg font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
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
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800'}`}
                            >
                                <SchoolIcon className="w-5 h-5" /> {t('overview')}
                            </button>
                            <button 
                                onClick={() => setActiveTab('classes')}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'classes' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800'}`}
                            >
                                <UsersIcon className="w-5 h-5" /> {t('students')}
                            </button>
                            <button 
                                onClick={() => setActiveTab('assignments')}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'assignments' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800'}`}
                            >
                                <ClipboardListIcon className="w-5 h-5" /> {t('assignments')}
                            </button>
                        </nav>
                    </aside>

                    <main className="flex-grow p-8 overflow-y-auto bg-white dark:bg-zinc-900">
                        {!selectedGroup ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-zinc-800">
                                <SchoolIcon className="w-20 h-20 mb-6 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-xs">Sélectionnez ou créez une classe</p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-fade-in-fast">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedGroup.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Tableau de bord Enseignant</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-zinc-800/50 px-5 py-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-inner">
                                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Code d'invitation</span>
                                                <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-widest select-all uppercase">{selectedGroup.inviteCode}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-8 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                                                    <UsersIcon className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalStudents}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('students')}</p>
                                            </div>
                                            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
                                                    <SchoolIcon className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{stats?.averageMastery}%</p>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">{t('class_average')}</p>
                                            </div>
                                            <div className="p-8 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6">
                                                    <BookOpenIcon className="w-6 h-6 text-purple-500" />
                                                </div>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalCapsules}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('shared_capsules')}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                                            <button 
                                                onClick={handleExportReport}
                                                disabled={exportStatus !== 'idle'}
                                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
                                            >
                                                {exportStatus === 'loading' ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : (exportStatus === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />)}
                                                {exportStatus === 'loading' ? '...' : (exportStatus === 'success' ? t('report_downloaded') : t('export_report'))}
                                            </button>
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
                                                        <th className="p-6">{t('role')}</th>
                                                        <th className="p-6 text-right">{t('progression')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                    {selectedGroup.members.length > 0 ? selectedGroup.members.map(member => (
                                                        <tr key={member.userId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                            <td className="p-6 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-slate-700 dark:text-zinc-200">{member.name}</span>
                                                            </td>
                                                            <td className="p-6">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                                    {member.role === 'owner' ? t('role_teacher') : t('role_student')}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 text-right text-sm text-slate-400">-</td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={3} className="p-12 text-center text-slate-400 italic font-medium">{t('no_students')}</td>
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
                                        <div className="grid grid-cols-1 gap-4">
                                            {classCapsules.length > 0 ? classCapsules.map(capsule => (
                                                <div key={capsule.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                            <BookOpenIcon className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{capsule.title}</h4>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{capsule.keyConcepts.length} concepts • {capsule.quiz.length} questions</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('completion_rate')}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-32 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${capsule.groupProgress ? Math.round((capsule.groupProgress.length / Math.max(1, selectedGroup.members.length - 1)) * 100) : 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                                                {capsule.groupProgress ? Math.round((capsule.groupProgress.length / Math.max(1, selectedGroup.members.length - 1)) * 100) : 0}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-20 bg-slate-50/50 dark:bg-zinc-950/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucune capsule dans cette classe</p>
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