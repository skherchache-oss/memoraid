
import React, { useState } from 'react';
import type { PremiumPack, PremiumCategory, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, StarIcon, GraduationCapIcon, LockIcon, UnlockIcon, CheckCircleIcon, GlobeIcon, MicIcon, CodeIcon, DnaIcon, BrainIcon, RefreshCwIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- ASSETS STATIQUES POUR LES PACKS (SVG Base64) ---
const SKETCH_FORGETTING = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjlmZiIvPgogIDxwYXRoIGQ9Ik01MCA1MCBMNTAgMjUwIEwzNTAgMjUwIiBzdHJva2U9IiM0NzU1NjkiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgogIDxwYXRoIGQ9Ik01MCA1MCBRIDEwMCAyNTAgMzUwIDI1MCIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjQiLz4KICA8dGV4dCB4PSIzNSIgeT0iNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBzdHJva2U9Im5vbmUiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJlbmQiPjEwMCUgTVNDPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMjcwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgc3Ryb2tlPSJub25lIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UZW1wcyAoSm91cnMpPC90ZXh0Pgo8L3N2Zz4=";
const SKETCH_MEMORY_FLOW = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VmMmZmZSIvPgogIDxyZWN0IHg9IjIwIiB5PSIxMDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IndoaXRlIi8+CiAgPHRleHQgeD0iNjAiIHk9IjEyNSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5TZW5zPC90ZXh0PgogIDxwYXRoIGQ9Ik0xMDAgMTIwIEwxNDAgMTIwIiBzdHJva2U9IiM2NjYiIG1hcmtlci1lbmQ9InVybCgjYXJyb3cpIi8+CiAgPHJlY3QgeD0iMTQwIiB5PSIxMDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiNkYmU0ZmYiLz4KICA8dGV4dCB4PSIxODAiIHk9IjEyNSIgZm9udC1zaXplPSIxMCIgaGVpZ2h0PSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5UcmF2YWlsPC90ZXh0Pgo8L3N2Zz4=";
const SKETCH_ACTIVE_PASSIVE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZjZmNmYyIvPgogIDxsaW5lIHgxPSIyMDAiIHkxPSI1MCIgeDI9IjIwMCIgeTI9IjI1MCIgc3Ryb2tlPSIjZGRkIiBzdHJva2UtZGFzaGFycmF5PSI0LDQiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY2NiI+UEFTU0lWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxMzAiIHI9IjM1IiBmaWxsPSIjZDFmYWU1IiBzdHJva2U9IiMxMGI5ODEiLz4KICA8cGF0aCBkPSJNMjg1IDEzMCBMMjk1IDE0MCBMMzE1IDEyMCIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+";
const SKETCH_CHUNKING = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIzMCwgNzApIj4KICAgIDxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiNkMWZhZTUiIHN0cm9rZT0iIzEwYjk4MSIvPgogICAgPHRleHQgeD0iMTAiIHk9IjU1IiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDU5Njc5Ij5DaHVuazwvdGV4dD4KICA8L2c+Cjwvc3ZnPg==";

// --- DONNÉES DU PACK APPRENDRE À APPRENDRE ---
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: '1. Pourquoi on oublie ce qu\'on apprend',
        summary: 'Le cerveau humain trie l’information pour éviter la surcharge. Comprendre l\'oubli est le premier pas pour mieux retenir.',
        keyConcepts: [{ concept: 'L’oubli naturel', explanation: 'Le cerveau élimine les données peu utilisées pour rester performant.' }, { concept: 'La courbe de l’oubli', explanation: 'Sans rappel, l\'information s\'efface de manière exponentielle.' }],
        examples: ['Relire sans se questionner', 'Apprendre massivement la veille'],
        quiz: [{ question: "Que montre la courbe de l'oubli ?", options: ["Perte rapide sans rappel", "Mémoire infinie"], correctAnswer: "Perte rapide sans rappel", explanation: "..." }],
        memoryAidImage: SKETCH_FORGETTING.split('base64,')[1],
        createdAt: Date.now() - 100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_2',
        title: '2. Comment fonctionne la mémoire',
        summary: 'Le trajet de l\'info : sensorielle, de travail, puis long terme.',
        keyConcepts: [{ concept: 'Mémoire de travail', explanation: 'Espace limité de manipulation des infos.' }, { concept: 'Consolidation', explanation: 'Le sommeil fixe les connaissances.' }],
        examples: ['Attention focalisée', 'Sommeil réparateur'],
        memoryAidImage: SKETCH_MEMORY_FLOW.split('base64,')[1],
        createdAt: Date.now() - 90, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_3',
        title: '3. Mémoire passive vs mémoire active',
        summary: 'Lire est passif, se questionner est actif. L\'effort est le moteur de l\'ancrage.',
        keyConcepts: [{ concept: 'Illusion de maîtrise', explanation: 'Confondre familiarité visuelle et savoir réel.' }, { concept: 'Rappel Actif', explanation: 'Forcer le cerveau à reconstruire l\'info.' }],
        examples: ['Se tester plutôt que relire'],
        memoryAidImage: SKETCH_ACTIVE_PASSIVE.split('base64,')[1],
        createdAt: Date.now() - 80, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_4',
        title: '4. La répétition espacée',
        summary: 'Mémoriser durablement en révisant à des intervalles croissants.',
        keyConcepts: [{ concept: 'SRS', explanation: 'Spaced Repetition System : revoir juste avant d\'oublier.' }],
        examples: ['J+1, J+4, J+7...'],
        createdAt: Date.now() - 70, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_5',
        title: '5. Pourquoi relire ne suffit pas',
        summary: 'La relecture simple crée un faux sentiment de confiance sans effort neuronal.',
        keyConcepts: [{ concept: 'Reconnaissance vs Rappel', explanation: 'Reconnaître un texte n\'est pas savoir le définir.' }],
        examples: ['Lire 5 fois le même cours'],
        createdAt: Date.now() - 60, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_6',
        title: '6. Se tester pour mieux mémoriser',
        summary: 'Le test est un outil d\'apprentissage, pas seulement d\'évaluation.',
        keyConcepts: [{ concept: 'Testing Effect', explanation: 'Chercher une réponse renforce le chemin neuronal.' }],
        examples: ['Quiz avant l\'examen'],
        createdAt: Date.now() - 50, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_7',
        title: '7. Comprendre avant d’apprendre',
        summary: 'Le cerveau retient ce qui fait sens. Organiser l\'info facilite le stockage.',
        keyConcepts: [{ concept: 'Encodage sémantique', explanation: 'Relier les nouvelles infos à vos acquis.' }],
        examples: ['Expliquer avec ses propres mots'],
        createdAt: Date.now() - 40, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_8',
        title: '8. Apprendre en expliquant',
        summary: 'La méthode Feynman : enseigner pour clarifier ses propres lacunes.',
        keyConcepts: [{ concept: 'Simplification', explanation: 'Si on ne peut pas l\'expliquer simplement, on n\'a pas compris.' }],
        examples: ['Enseigner à un ami imaginaire'],
        createdAt: Date.now() - 30, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_9',
        title: '9. Utiliser les images et les schémas',
        summary: 'Le double codage : associer mots et visuels pour un ancrage décuplé.',
        keyConcepts: [{ concept: 'Visualisation', explanation: 'Les images sont traitées plus vite que le texte.' }],
        examples: ['Faire un sketchnote'],
        createdAt: Date.now() - 20, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_10',
        title: '10. Apprendre en petites doses',
        summary: 'Vaincre la surcharge cognitive par le fractionnement et le chunking.',
        keyConcepts: [{ concept: 'Chunking', explanation: 'Regrouper les données en unités de sens cohérentes.' }],
        examples: ['Pomodoro'],
        memoryAidImage: SKETCH_CHUNKING.split('base64,')[1],
        createdAt: Date.now() - 10, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, quiz: [], flashcards: [], sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: 'Parcours complet en 10 étapes : de la science de l\'oubli au fractionnement des savoirs. Devenez un expert de votre propre mémoire.',
        category: 'expert',
        price: 3.99,
        capsuleCount: 10,
        coverColor: 'bg-indigo-700',
        capsules: CAPSULES_APPRENDRE
    }
];

const PremiumStore: React.FC<PremiumStoreProps> = ({ onUnlockPack, unlockedPackIds, isPremiumUser }) => {
    const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

    const handleBuy = (pack: PremiumPack) => {
        setLoadingPackId(pack.id);
        setTimeout(() => {
            onUnlockPack(pack);
            setLoadingPackId(null);
        }, 1500);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 min-h-screen pb-20">
            <div className="bg-slate-900 text-white py-14 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 uppercase tracking-tighter">
                    <ShoppingBagIcon className="w-10 h-10 text-amber-400" />
                    Packs de Savoir
                </h1>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    Explorez des parcours structurés pour maîtriser de nouveaux sujets. Contenus enrichis avec mnémotechniques et schémas visuels inclus (ne consomme pas votre quota).
                </p>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MOCK_PACKS.map(pack => {
                        const isUnlocked = unlockedPackIds.includes(pack.id);
                        // Changement : "expert" devient "Fondamentaux"
                        const categoryLabel = pack.category === 'expert' ? 'Fondamentaux' : pack.category.toUpperCase();
                        
                        return (
                            <div key={pack.id} className="group bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow-2xl transition-all flex flex-col">
                                <div className={`h-40 ${pack.coverColor} relative flex items-center justify-center overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                                    <BrainIcon className="w-20 h-20 text-white/90 transform group-hover:scale-110 transition-transform duration-500" />
                                    {isUnlocked && <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-1.5 rounded-full"><CheckCircleIcon className="w-6 h-6 text-white" /></div>}
                                </div>
                                <div className="p-8 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-700 px-2.5 py-1 rounded-full">{categoryLabel}</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pack.capsuleCount} modules</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{pack.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-zinc-400 mb-8 flex-grow leading-relaxed font-medium">{pack.description}</p>
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{isPremiumUser ? 'OFFERT' : `${pack.price} €`}</span>
                                        {isUnlocked ? (
                                            <span className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-zinc-700 text-slate-500 rounded-xl font-black uppercase text-xs tracking-widest"><UnlockIcon className="w-4 h-4" /> Débloqué</span>
                                        ) : (
                                            <button onClick={() => handleBuy(pack)} disabled={!!loadingPackId} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-none active:scale-95">
                                                {loadingPackId === pack.id ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : isPremiumUser ? 'Ajouter' : 'Débloquer'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PremiumStore;
