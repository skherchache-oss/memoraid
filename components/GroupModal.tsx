
import React, { useState } from 'react';
/* Import RefreshCwIcon from constants */
import { XIcon, UserIcon, SparklesIcon, ZapIcon, SchoolIcon, ChevronRightIcon, PlusIcon, GraduationCapIcon, RefreshCwIcon } from '../constants';
import type { Group } from '../types';
import { createGroup, joinGroup } from '../services/cloudService';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';

interface GroupModalProps {
    onClose: () => void;
    userId: string;
    userName: string;
    userGroups: Group[];
    addToast: (message: string, type: ToastType) => void;
}

type ToastType = 'success' | 'error' | 'info';

const GroupModal: React.FC<GroupModalProps> = ({ onClose, userId, userName, userGroups, addToast }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'list' | 'join'>('list');
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = inviteCode.trim().toUpperCase();
        if (!code) return;
        
        setIsLoading(true);
        try {
            await joinGroup(userId, userName, code);
            addToast("Félicitations ! Vous avez rejoint la classe.", "success");
            setMode('list');
            setInviteCode('');
            onClose(); // On ferme après succès pour montrer les nouveaux modules
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Code invalide ou erreur de connexion.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                
                <header className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500 rounded-2xl text-white">
                            <SchoolIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mes Classes</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collaboration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        <XIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="p-6 md:p-8 flex-grow overflow-y-auto min-h-[350px]">
                    {mode === 'list' && (
                        <div className="space-y-6 animate-fade-in-fast">
                            {userGroups.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Classes rejointes</p>
                                    {userGroups.map(group => (
                                        <div key={group.id} className="p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 group hover:border-indigo-300 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                                                <span className="text-[10px] px-3 py-1 bg-white dark:bg-zinc-900 text-slate-500 rounded-full font-mono border border-slate-200 dark:border-zinc-700 shadow-sm">
                                                    {group.inviteCode}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <GraduationCapIcon className="w-3.5 h-3.5" />
                                                <span>{group.members.length} membres</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                                        <SchoolIcon className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 max-w-[200px] mx-auto leading-relaxed">
                                        Vous n'avez pas encore rejoint de classe ou de groupe de travail.
                                    </p>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setMode('join')}
                                className="w-full flex items-center justify-center gap-3 p-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Rejoindre une classe
                            </button>
                        </div>
                    )}

                    {mode === 'join' && (
                        <form onSubmit={handleJoinGroup} className="space-y-6 animate-fade-in-fast">
                            <div className="text-center mb-8">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Entrez votre code</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">Saisissez le code d'invitation à 6 caractères fourni par votre professeur.</p>
                            </div>

                            <div className="relative group">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full text-center text-4xl font-black tracking-[0.3em] py-6 bg-slate-50 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 rounded-3xl focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all dark:text-white uppercase placeholder:text-slate-200 dark:placeholder:text-zinc-700"
                                    placeholder="XXXXXX"
                                    autoFocus
                                    required
                                />
                                <div className="absolute -bottom-2 -right-2 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setMode('list')} 
                                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || inviteCode.length < 4} 
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <ChevronRightIcon className="w-5 h-5" />}
                                    Valider le code
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-start gap-3">
                    <ZapIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-slate-400 font-bold uppercase tracking-tight">
                        Une fois le code validé, les modules partagés par votre professeur apparaîtront instantanément dans votre bibliothèque.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GroupModal;