import React from 'react';
import { 
    CrownIcon, 
    CheckCircleIcon, 
    SparklesIcon, 
    BrainIcon
} from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { APPRENDRE_PACK } from '../services/packContent';
import type { PremiumPack } from '../types';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
}

const PremiumStore: React.FC<PremiumStoreProps> = ({ onUnlockPack, unlockedPackIds }) => {
    const { t } = useLanguage();
    const isApprendreUnlocked = unlockedPackIds.includes(APPRENDRE_PACK.id);

    return (
        <div className="bg-white dark:bg-zinc-900 min-h-screen pb-32 animate-fade-in">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16 md:py-24 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 rotate-12"><CrownIcon className="w-32 h-32" /></div>
                    <div className="absolute bottom-10 right-10 -rotate-12"><SparklesIcon className="w-40 h-40" /></div>
                </div>
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-amber-500/30">
                        <CrownIcon className="w-4 h-4" /> Memoraid+
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">
                        Passez à la vitesse supérieure
                    </h1>
                    <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed opacity-90">
                        Choisissez un abonnement pour les fonctions illimitées ou explorez nos packs thématiques.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 relative z-20">
                {/* SECTION 1: ABONNEMENTS */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10 justify-center">
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Options d'Abonnement</h2>
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Mensuel */}
                        <div className="bg-white dark:bg-zinc-800 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-zinc-700 flex flex-col items-center text-center group">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Mensuel</span>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">4,99 €</span>
                                <span className="text-slate-400 font-bold">/mois</span>
                            </div>
                            <ul className="text-left space-y-3 mb-8 w-full px-4">
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> IA Illimitée</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Mode Coach Oral</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Export PowerPoint</li>
                            </ul>
                            <button disabled className="w-full py-4 bg-slate-100 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                Bientôt disponible
                            </button>
                        </div>

                        {/* Annuel */}
                        <div className="bg-white dark:bg-zinc-800 p-8 rounded-[40px] shadow-2xl border-2 border-emerald-500 flex flex-col items-center text-center relative group">
                            <div className="absolute -top-4 bg-emerald-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">Économique</div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Annuel</span>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">49,99 €</span>
                                <span className="text-slate-400 font-bold">/an</span>
                            </div>
                            <ul className="text-left space-y-3 mb-8 w-full px-4">
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Tout le contenu Premium</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Accès aux nouveaux packs</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 font-medium"><CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Support prioritaire</li>
                            </ul>
                            <button disabled className="w-full py-4 bg-slate-100 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                Bientôt disponible
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: PACKS THÉMATIQUES */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-12 justify-center">
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Packs de Savoir</h2>
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Pack: Apprendre à apprendre - DISPONIBLE */}
                        <div className={`group bg-white dark:bg-zinc-800 rounded-[40px] shadow-xl border overflow-hidden hover:-translate-y-2 transition-all duration-500 ${isApprendreUnlocked ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-zinc-700'}`}>
                            <div className="h-48 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                    <BrainIcon className="w-32 h-32 text-white" />
                                </div>
                                <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                    {isApprendreUnlocked ? 'Débloqué' : 'Top Vente'}
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">{APPRENDRE_PACK.title}</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                    {APPRENDRE_PACK.description}
                                </p>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix du pack</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">3,99 €</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenu</span>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-zinc-300">{APPRENDRE_PACK.capsuleCount} Modules</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUnlockPack(APPRENDRE_PACK)}
                                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${
                                        isApprendreUnlocked 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                                        : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'
                                    }`}
                                >
                                    {isApprendreUnlocked ? 'Contenu débloqué' : 'Débloquer ce pack'}
                                </button>
                            </div>
                        </div>

                        {/* Placeholder Pack 2 */}
                        <div className="group bg-white dark:bg-zinc-800 rounded-[40px] shadow-xl border border-slate-100 dark:border-zinc-700 overflow-hidden opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-700 p-8 flex flex-col justify-between">
                                <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                    Expert
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">Pack Langues Express</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                    Structurez votre apprentissage des langues avec des listes de fréquences et des contextes culturels optimisés.
                                </p>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">14,99 €</span>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">À venir</span>
                                </div>
                                <button disabled className="w-full py-4 bg-slate-50 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                    Indisponible
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transparence Box */}
                <div className="max-w-2xl mx-auto p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[40px] text-center mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Engagement Memoraid</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-500 leading-relaxed font-medium">
                        L'achat d'un pack vous donne un accès illimité à vie à ces modules spécifiques. L'abonnement Memoraid+ débloque quant à lui l'ensemble des outils d'IA générative de l'application. 
                        <br /><br />
                        <strong className="text-slate-800 dark:text-zinc-300">Phase de pré-lancement : aucune transaction réelle n'est effectuée. Cliquez sur débloquer pour simuler l'accès au contenu.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumStore;