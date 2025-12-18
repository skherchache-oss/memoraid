
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group, Comment, CollaborativeTask } from '../types';
import Quiz from './Quiz';
import { LightbulbIcon, ListChecksIcon, MessageSquareIcon, DownloadIcon, TagIcon, Volume2Icon, StopCircleIcon, RefreshCwIcon, ImageIcon, SparklesIcon, ChevronLeftIcon, PlayIcon, Share2Icon, FileTextIcon, UserIcon, SendIcon, MonitorIcon, CrownIcon, CheckSquareIcon, PresentationIcon, BookIcon, PrinterIcon, ZapIcon, LockIcon, ClockIcon, LayersIcon, XIcon } from '../constants';
import { isCapsuleDue } from '../services/srsService';
import { generateMemoryAidDrawing, expandKeyConcept, regenerateQuiz, generateMnemonic, cleanMarkdown } from '../services/geminiService';
import { downloadFlashcardsPdf, downloadCapsulePdf, generateFilename, downloadQuizPdf } from '../services/pdfService';
import { exportToPPTX, exportToEPUB } from '../services/exportService';
import { ToastType } from '../hooks/useToast';
import { addCommentToCapsule, saveCapsuleToCloud, assignTaskToMember, updateTaskStatus } from '../services/cloudService';
import FocusMode from './FocusMode';
import { useLanguage } from '../contexts/LanguageContext';
import { checkImageQuota, incrementImageQuota, getQuotaStats, checkTtsAvailability, recordTtsSuccess, triggerTtsSafetyLock } from '../services/quotaManager';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface CapsuleViewProps {
    capsule: CognitiveCapsule;
    allCapsules: CognitiveCapsule[];
    selectedCapsuleIds: string[];
    onStartCoaching: () => void;
    onStartFlashcards: () => void;
    onStartActiveLearning: () => void;
    onMarkAsReviewed: (capsuleId: string, score?: number, type?: 'quiz' | 'flashcard' | 'manual') => void;
    onSetCategory: (capsuleId: string, category: string) => void;
    allCategories: string[];
    onSetMemoryAid: (capsuleId: string, imageData: string | null, description: string | null) => void;
    onSetMnemonic: (capsuleId: string, mnemonic: string) => void; 
    onUpdateQuiz: (capsuleId: string, newQuiz: QuizQuestion[]) => void;
    onBackToList: () => void;
    addToast: (message: string, type: ToastType) => void;
    userGroups: Group[];
    onShareCapsule: (group: Group, capsule: CognitiveCapsule) => void;
    currentUserId?: string;
    currentUserName?: string;
    isPremium?: boolean;
}

const CapsuleView: React.FC<CapsuleViewProps> = ({ capsule, onUpdateQuiz, addToast, onBackToList, onSetMemoryAid, onSetMnemonic, allCategories, onSetCategory, onMarkAsReviewed, onStartActiveLearning, onStartFlashcards, onStartCoaching, userGroups, onShareCapsule, currentUserId, currentUserName, isPremium }) => {
    const { language, t } = useLanguage();
    const isDue = isCapsuleDue(capsule);
    
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryInput, setCategoryInput] = useState(capsule.category || '');
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [isBuffering, setIsBuffering] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const stopRequestRef = useRef<boolean>(false);

    const formatImageSrc = (src: string | null | undefined) => {
        if (!src) return null;
        return src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
    };

    const [memoryAidImage, setMemoryAidImage] = useState<string | null>(formatImageSrc(capsule.memoryAidImage));
    const [memoryAidDescription, setMemoryAidDescription] = useState<string | null>(capsule.memoryAidDescription || null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [mnemonic, setMnemonic] = useState<string | null>(capsule.mnemonic || null);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
    const [expandedConcepts, setExpandedConcepts] = useState<Record<string, string>>({});
    const [loadingConcepts, setLoadingConcepts] = useState<Record<string, boolean>>({});
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState(checkTtsAvailability(!!isPremium));

    useEffect(() => {
        window.scrollTo(0, 0);
        setMemoryAidImage(formatImageSrc(capsule.memoryAidImage));
        setMnemonic(capsule.mnemonic || null);
    }, [capsule.id]);

    const stopAudio = useCallback(() => {
        stopRequestRef.current = true;
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) {}
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setSpeakingId(null);
        setIsBuffering(null);
    }, []);

    const handleToggleSpeech = async (id: string, text: string) => {
        if (speakingId === id || isBuffering === id) { stopAudio(); return; }
        stopAudio(); stopRequestRef.current = false;
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { addToast(avail.reason!, 'info'); setVoiceStatus(avail); return; }
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        
        const chunks = text.split(/[.!?]+\s+/).filter(c => c.trim().length > 0).slice(0, avail.maxChunks || 3);
        if (chunks.length === 0) return;
        setIsBuffering(id);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const playChunk = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) { setSpeakingId(null); setIsBuffering(null); return; }
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: chunks[index] }] }],
                    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } },
                });
                const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (!base64) throw new Error();
                const buffer = await decodeAudioData(decode(base64), audioContextRef.current!, 24000, 1);
                if (stopRequestRef.current) return;
                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer; source.connect(audioContextRef.current!.destination);
                source.onended = () => { if (!stopRequestRef.current) playChunk(index + 1); };
                setIsBuffering(null); setSpeakingId(id); recordTtsSuccess();
                source.start(); audioSourceRef.current = source;
            } catch (e) {
                triggerTtsSafetyLock(); setVoiceStatus(checkTtsAvailability(!!isPremium)); stopAudio();
            }
        };
        playChunk(0);
    };

    const handleGenerateMnemonic = async () => {
        setIsGeneratingMnemonic(true);
        try {
            const res = await generateMnemonic(capsule, language);
            setMnemonic(res);
            onSetMnemonic(capsule.id, res);
            addToast("Astuce générée !", "success");
        } catch (e) { addToast("Erreur", "error"); } finally { setIsGeneratingMnemonic(false); }
    };

    const handleGenerateDrawing = async () => {
        const quota = checkImageQuota(capsule.id, !!isPremium);
        if (!quota.allowed) { addToast(quota.reason!, "info"); return; }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            const src = `data:image/png;base64,${res.imageData}`;
            setMemoryAidImage(src);
            setMemoryAidDescription(res.description);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis réussi !", "success");
        } catch (e: any) { addToast(e.message, "error"); } finally { setIsGeneratingImage(false); }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in pb-20">
            <button onClick={onBackToList} className="md:hidden flex items-center gap-1 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 w-full border-b border-slate-100 dark:border-zinc-800"><ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}</button>
            
            <div className="p-6 md:p-10">
                <div className="mb-8">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{capsule.title}</h2>
                        <div className="flex gap-2">
                             <button onClick={() => setShowShareMenu(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><Share2Icon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="relative">
                        <p className="text-base md:text-lg text-slate-600 dark:text-zinc-300 pr-12 leading-relaxed">{capsule.summary}</p>
                        <button onClick={() => handleToggleSpeech('summary', capsule.summary)} className="absolute top-0 right-0 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                            {isBuffering === 'summary' ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : speakingId === 'summary' ? <StopCircleIcon className="w-5 h-5 text-emerald-500" /> : <Volume2Icon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* BOÎTE À OUTILS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                    <button onClick={onStartFlashcards} className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"><LayersIcon className="w-4 h-4" /> Flashcards</button>
                    <button onClick={onStartCoaching} className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"><MessageSquareIcon className="w-4 h-4" /> Coach IA</button>
                    <button onClick={() => downloadCapsulePdf(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"><FileTextIcon className="w-4 h-4" /> Fiche PDF</button>
                    <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"><PrinterIcon className="w-4 h-4" /> Cartes (Print)</button>
                </div>

                <div className="space-y-12">
                    {/* SECRET DE MÉMORISATION */}
                    <div className="animate-fade-in">
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4"><ZapIcon className="w-6 h-6 mr-3 text-orange-500" /> {t('mnemonic_title')}</h3>
                        {mnemonic ? (
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 relative group">
                                <blockquote className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-zinc-100 text-center leading-relaxed">"{mnemonic}"</blockquote>
                                <button onClick={handleGenerateMnemonic} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-600 transition-all"><RefreshCwIcon className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-6 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-2xl text-orange-600 dark:text-orange-400 font-bold flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
                                {isGeneratingMnemonic ? <RefreshCwIcon className="w-6 h-6 animate-spin"/> : <SparklesIcon className="w-6 h-6"/>}
                                {isGeneratingMnemonic ? t('generating_mnemonic') : t('generate_mnemonic')}
                            </button>
                        )}
                    </div>

                    {/* CONCEPTS */}
                    <div>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4"><LightbulbIcon className="w-6 h-6 mr-3 text-amber-500" /> {t('key_concepts')}</h3>
                        <div className="grid gap-4">
                            {capsule.keyConcepts.map((c, i) => (
                                <div key={i} className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <p className="font-bold text-lg text-slate-900 dark:text-white mb-1">{c.concept}</p>
                                    <p className="text-slate-600 dark:text-zinc-300">{c.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CROQUIS */}
                    <div>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4"><ImageIcon className="w-6 h-6 mr-3 text-violet-500" /> {t('memory_aid_sketch')}</h3>
                        {isPremium ? (
                            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4">
                                {memoryAidImage ? (
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl border border-slate-200 shadow-sm"><img src={memoryAidImage} alt="Sketch" className="w-full h-auto rounded-lg"/></div>
                                        <div className="flex gap-4"><button onClick={() => setMemoryAidImage(null)} className="text-sm font-bold text-slate-400 hover:text-red-500">Effacer</button></div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 flex items-center gap-2 mx-auto disabled:opacity-50">
                                            {isGeneratingImage ? <RefreshCwIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                                            {isGeneratingImage ? t('sketching') : t('generate_sketch')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-2xl border border-amber-200 dark:border-amber-800/30 text-center">
                                <LockIcon className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                <h4 className="font-bold text-amber-800 dark:text-amber-400">{t('premium_features')}</h4>
                                <p className="text-sm text-amber-700">{t('sketch_premium_only')}</p>
                            </div>
                        )}
                    </div>

                    <Quiz questions={capsule.quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} />
                </div>
            </div>

            {showShareMenu && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowShareMenu(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between font-bold"><h3>{t('share_group')}</h3><button onClick={() => setShowShareMenu(false)}><XIcon className="w-5 h-5"/></button></div>
                        <div className="p-2">{userGroups.length > 0 ? userGroups.map(g => (
                            <button key={g.id} onClick={() => { onShareCapsule(g, capsule); setShowShareMenu(false); addToast("Partagé !", "success"); }} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-sm transition-colors">{g.name}</button>
                        )) : <p className="p-4 text-sm text-slate-400 italic text-center">Aucun groupe.</p>}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapsuleView;
