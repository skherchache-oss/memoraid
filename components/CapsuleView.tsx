import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group } from '../types';
import Quiz from './Quiz';
import { LightbulbIcon, MessageSquareIcon, DownloadIcon, Volume2Icon, StopCircleIcon, RefreshCwIcon, ImageIcon, SparklesIcon, ChevronLeftIcon, Share2Icon, FileTextIcon, ZapIcon, LockIcon, PlayIcon, ListChecksIcon, LayersIcon, AlertCircleIcon, TagIcon, XIcon } from '../constants';
import { generateMemoryAidDrawing, generateMnemonic } from '../services/geminiService';
import { downloadCapsulePdf, downloadFlashcardsPdf, downloadQuizPdf, downloadBlob } from '../services/pdfService';
import { exportToPPTX } from '../services/exportService';
import { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import { checkTtsAvailability, recordTtsSuccess } from '../services/quotaManager';
import { segmentText } from '../services/voiceUtils';

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
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
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
    onNavigateToProfile: () => void;
    addToast: (message: string, type: ToastType) => void;
    userGroups: Group[];
    onShareCapsule: (group: Group, capsule: CognitiveCapsule) => void;
    currentUserId?: string;
    currentUserName?: string;
    isPremium?: boolean;
}

// Fixed error in file components/CapsuleView.tsx on line 327: Added onStartActiveLearning to destructured props
const CapsuleView: React.FC<CapsuleViewProps> = ({ 
    capsule, 
    addToast, 
    onBackToList, 
    onSetMemoryAid, 
    onSetMnemonic, 
    onMarkAsReviewed, 
    onSetCategory, 
    onStartFlashcards, 
    onStartCoaching, 
    onNavigateToProfile, 
    isPremium,
    onStartActiveLearning
}) => {
    const { language, t } = useLanguage();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const stopRequestRef = useRef<boolean>(false);

    const [memoryAidImage, setMemoryAidImage] = useState<string | null>(capsule.memoryAidImage ? `data:image/png;base64,${capsule.memoryAidImage}` : null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [mnemonic, setMnemonic] = useState<string | null>(capsule.mnemonic || null);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryInput, setCategoryInput] = useState(capsule.category || '');

    // Sécurité : assurer que les tableaux requis existent
    const keyConcepts = capsule.keyConcepts || [];
    const examples = capsule.examples || [];
    const quiz = capsule.quiz || [];

    const stopAudio = useCallback(() => {
        stopRequestRef.current = true;
        activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
            source.disconnect();
        });
        activeSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsSpeaking(false);
        setIsBuffering(false);
    }, []);

    useEffect(() => {
        const handleStopAll = (e: any) => {
            if (e.detail?.origin === 'capsule-reader') return;
            stopAudio();
        };
        window.addEventListener('memoraid-stop-audio', handleStopAll);
        return () => {
            window.removeEventListener('memoraid-stop-audio', handleStopAll);
            stopAudio();
        };
    }, [stopAudio]);

    const fullTextToRead = useMemo(() => {
        let text = `${capsule.title || ''}. ${capsule.summary || ''}. `;
        text += language === 'fr' ? "Concepts clés : " : "Key concepts: ";
        keyConcepts.forEach(c => { text += `${c.concept}. ${c.explanation}. `; });
        if (examples.length > 0) {
            text += language === 'fr' ? "Exemples : " : "Examples: ";
            examples.forEach(e => { text += `${e}. `; });
        }
        return text;
    }, [capsule, keyConcepts, examples, language]);

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        window.dispatchEvent(new CustomEvent('memoraid-stop-audio', { detail: { origin: 'capsule-reader' } }));
        stopRequestRef.current = false;
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { 
            addToast(avail.reason!, 'info'); 
            return; 
        }
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        
        nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;
        const chunks = segmentText(fullTextToRead, isPremium ? 40 : 20);
        if (chunks.length === 0) return;
        setIsBuffering(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const queueChunk = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) return;
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: chunks[index] }] }],
                    config: { 
                        responseModalities: [Modality.AUDIO], 
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: language === 'fr' ? 'Kore' : 'Zephyr' } } }
                    },
                });
                const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (!base64 || stopRequestRef.current) return;
                const buffer = await decodeAudioData(decode(base64), audioContextRef.current!, 24000, 1);
                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer; 
                source.connect(audioContextRef.current!.destination);
                const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current!.currentTime);
                source.start(startTime);
                nextStartTimeRef.current = startTime + buffer.duration;
                activeSourcesRef.current.add(source);
                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0 && index === chunks.length - 1) setIsSpeaking(false);
                };
                setIsBuffering(false); 
                setIsSpeaking(true); 
                recordTtsSuccess();
                queueChunk(index + 1);
            } catch (e) { stopAudio(); }
        };
        queueChunk(0);
    };

    const handleSaveCategory = () => {
        onSetCategory(capsule.id, categoryInput.trim());
        setIsEditingCategory(false);
        addToast(t('category_updated'), "success");
    };

    const handleGenerateMnemonic = async () => {
        setIsGeneratingMnemonic(true);
        try {
            const res = await generateMnemonic(capsule, language);
            setMnemonic(res);
            onSetMnemonic(capsule.id, res);
            addToast("Mnémotechnique générée !", "success");
        } catch (e) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingMnemonic(false); }
    };

    const handleGenerateDrawing = async () => {
        if (!isPremium && !capsule.isPremiumContent) { addToast(t('sketch_premium_only'), "info"); return; }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            setMemoryAidImage(`data:image/png;base64,${res.imageData}`);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis généré !", "success");
        } catch (e) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingImage(false); }
    };

    const canSeeSection = isPremium || capsule.isPremiumContent;

    // PROTECTION CRITIQUE : Si pas de titre, on n'affiche rien (évite l'écran noir par crash)
    if (!capsule.title) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 md:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in w-full max-w-none">
            <button onClick={onBackToList} className="flex items-center gap-2 p-5 text-sm font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all w-full">
                <ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}
            </button>
            <div className="p-6 md:p-12 lg:p-16">
                <header className="mb-12">
                    <div className="flex justify-between items-start gap-6 mb-4">
                        <div className="flex-grow">
                            <div className="mb-4 flex items-center gap-2">
                                {isEditingCategory ? (
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 px-3 py-1 rounded-full animate-fade-in-fast border border-emerald-200">
                                        <input type="text" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="text-xs font-black uppercase tracking-widest bg-transparent outline-none w-32" placeholder={t('category_placeholder')} autoFocus />
                                        <button onClick={handleSaveCategory} className="text-emerald-500"><ZapIcon className="w-4 h-4" /></button>
                                        <button onClick={() => setIsEditingCategory(false)} className="text-slate-400"><XIcon className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditingCategory(true)} className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all">
                                        <TagIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{capsule.category || t('uncategorized')}</span>
                                    </button>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">{capsule.title}</h1>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => exportToPPTX(capsule)} className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors shadow-sm" title="Exporter PPTX"><DownloadIcon className="w-6 h-6 text-slate-600 dark:text-zinc-300" /></button>
                            <button className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors shadow-sm"><Share2Icon className="w-6 h-6 text-slate-600 dark:text-zinc-300"/></button>
                        </div>
                    </div>
                    <p className="text-lg md:text-2xl text-slate-500 dark:text-zinc-400 leading-relaxed font-medium mb-10 max-w-4xl">{capsule.summary}</p>
                    
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isSpeaking ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200'}`}>
                                <Volume2Icon className="w-7 h-7" />
                            </div>
                            <div>
                                <span className="block text-sm font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-widest">{isSpeaking ? t('reading_in_progress') : isBuffering ? t('voice_preparing') : "Mode Audio Immersif"}</span>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/50 font-bold uppercase tracking-tighter">Écoutez votre savoir n'importe où</p>
                            </div>
                        </div>
                        <button onClick={handleToggleSpeech} className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isSpeaking || isBuffering ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {isBuffering ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : isSpeaking ? <StopCircleIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                            {isSpeaking || isBuffering ? t('stop') : t('listen_all')}
                        </button>
                    </div>
                </header>

                <div className="space-y-24">
                    {/* Concepts */}
                    <section>
                        <h2 className="flex items-center text-2xl font-black text-slate-800 dark:text-zinc-100 mb-8 uppercase tracking-tighter"><LightbulbIcon className="w-8 h-8 mr-4 text-amber-500" /> {t('key_concepts')}</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {keyConcepts.map((c, i) => (
                                <div key={i} className="group p-8 bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xl hover:border-emerald-200 dark:hover:border-zinc-700">
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-4 leading-tight">{c.concept}</h3>
                                    <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-medium mb-6">{c.explanation}</p>
                                    {c.deepDive && (
                                        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><SparklesIcon className="w-3.5 h-3.5" /> {t('deep_dive_label')}</p>
                                            <p className="text-sm text-slate-500 dark:text-zinc-400 italic leading-relaxed">{c.deepDive}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Mémorisation */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        <section className="bg-orange-50/50 dark:bg-orange-900/10 p-10 rounded-[2.5rem] border border-orange-200 dark:border-orange-800 shadow-sm flex flex-col h-full">
                            <h2 className="flex items-center text-2xl font-black text-orange-900 dark:text-orange-200 mb-8 uppercase tracking-tighter"><ZapIcon className="w-8 h-8 mr-4 text-orange-500" /> {t('mnemonic_title')}</h2>
                            <div className="flex-grow flex flex-col justify-center text-center">
                                {mnemonic ? (
                                    <>
                                        <p className="text-2xl md:text-3xl font-serif italic text-orange-800 dark:text-orange-100 leading-relaxed px-4">"{mnemonic}"</p>
                                        <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="mt-8 text-xs font-black uppercase tracking-widest text-orange-600 hover:underline flex items-center gap-2 mx-auto"><RefreshCwIcon className={`w-4 h-4 ${isGeneratingMnemonic ? 'animate-spin' : ''}`} /> {t('regenerate')}</button>
                                    </>
                                ) : (
                                    <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-16 border-2 border-dashed border-orange-300 rounded-3xl text-orange-600 font-black uppercase tracking-widest hover:bg-orange-50 transition-all">{isGeneratingMnemonic ? t('generating_mnemonic') : t('generate_mnemonic')}</button>
                                )}
                            </div>
                        </section>

                        <section className="bg-violet-50/50 dark:bg-violet-900/10 p-10 rounded-[2.5rem] border border-violet-200 dark:border-violet-800 shadow-sm flex flex-col h-full">
                            <h2 className="flex items-center text-2xl font-black text-violet-900 dark:text-violet-200 mb-8 uppercase tracking-tighter"><ImageIcon className="w-8 h-8 mr-4 text-violet-500" /> {t('memory_aid_sketch')}</h2>
                            <div className="flex-grow flex flex-col justify-center items-center">
                                {canSeeSection ? (
                                    memoryAidImage ? (
                                        <div className="w-full space-y-6">
                                            <div className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-lg border border-slate-200 group relative">
                                                <img src={memoryAidImage} alt="Sketch" className="w-full h-auto"/>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                    <button onClick={() => setMemoryAidImage(null)} className="p-3 bg-red-600 text-white rounded-xl shadow-lg"><XIcon className="w-6 h-6"/></button>
                                                    <button onClick={handleGenerateDrawing} className="p-3 bg-violet-600 text-white rounded-xl shadow-lg"><RefreshCwIcon className="w-6 h-6"/></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-center text-violet-600/80 font-bold uppercase tracking-tight px-4">{capsule.memoryAidDescription}</p>
                                        </div>
                                    ) : (
                                        <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="w-full py-16 border-2 border-dashed border-violet-300 rounded-3xl text-violet-600 font-black uppercase tracking-widest hover:bg-violet-50 transition-all">
                                            {isGeneratingImage ? <RefreshCwIcon className="w-6 h-6 animate-spin mx-auto mb-2"/> : <SparklesIcon className="w-6 h-6 mx-auto mb-2"/>}
                                            {isGeneratingImage ? "Dessin en cours..." : t('generate_sketch')}
                                        </button>
                                    )
                                ) : (
                                    <div className="text-center py-8">
                                        <LockIcon className="w-12 h-12 text-violet-400 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm text-violet-700 dark:text-violet-300 font-bold mb-6 px-10">{t('sketch_premium_only')}</p>
                                        <button onClick={onNavigateToProfile} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md">{t('activate_in_profile')}</button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Quiz */}
                    <div className="pt-16 border-t border-slate-100 dark:border-zinc-800">
                        {quiz.length > 0 && <Quiz questions={quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} />}
                    </div>

                    {/* Outils de révision bas de page */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-10">
                        <button onClick={onStartFlashcards} className="flex flex-col items-center justify-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all"><SparklesIcon className="w-8 h-8" /> Flashcards</button>
                        <button onClick={onStartCoaching} className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all"><MessageSquareIcon className="w-8 h-8" /> Coach IA</button>
                        <button onClick={() => downloadCapsulePdf(capsule)} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all"><FileTextIcon className="w-8 h-8" /> PDF</button>
                        <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all"><LayersIcon className="w-8 h-8" /> Print</button>
                        <button onClick={() => downloadQuizPdf(capsule)} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all"><ListChecksIcon className="w-8 h-8" /> Quiz</button>
                        <button onClick={onStartActiveLearning} className="flex flex-col items-center justify-center gap-3 p-6 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all shadow-emerald-200 dark:shadow-none"><PlayIcon className="w-8 h-8" /> Étude</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapsuleView;