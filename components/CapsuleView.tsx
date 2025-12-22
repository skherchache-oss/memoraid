
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group } from '../types';
import Quiz from './Quiz';
import { 
    LightbulbIcon, 
    DownloadIcon, 
    Volume2Icon, 
    StopCircleIcon, 
    RefreshCwIcon, 
    ImageIcon, 
    SparklesIcon, 
    ChevronLeftIcon, 
    Share2Icon, 
    FileTextIcon, 
    ZapIcon, 
    PlayIcon, 
    ListChecksIcon, 
    LayersIcon, 
    TagIcon, 
    XIcon, 
    PresentationIcon, 
    CheckCircleIcon, 
    ChevronRightIcon,
    CrownIcon,
    MaximizeIcon,
    MinimizeIcon
} from '../constants';
import { generateMemoryAidDrawing, generateMnemonic } from '../services/geminiService';
import { downloadCapsulePdf, downloadFlashcardsPdf, downloadQuizPdf, downloadBlob } from '../services/pdfService';
import { exportToPPTX } from '../services/exportService';
import { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import { checkTtsAvailability, recordTtsSuccess } from '../services/quotaManager';
import { segmentText } from '../services/voiceUtils';

// Helper pour décoder le base64 en Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Fonction de décodage PCM ultra-stable.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // On crée une vue sur une copie exacte pour éviter les erreurs d'alignement de buffer
  const safeBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const length = Math.floor(safeBuffer.byteLength / 2);
  const dataInt16 = new Int16Array(length);
  const view = new DataView(safeBuffer);

  for (let i = 0; i < length; i++) {
    dataInt16[i] = view.getInt16(i * 2, true);
  }

  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return audioBuffer;
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
    isPremium?: boolean;
}

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
    const [isFullscreenSketch, setIsFullscreenSketch] = useState(false);
    
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

    useEffect(() => {
        setMemoryAidImage(capsule.memoryAidImage ? `data:image/png;base64,${capsule.memoryAidImage}` : null);
        setMnemonic(capsule.mnemonic || null);
        setCategoryInput(capsule.category || '');
        setIsFullscreenSketch(false);
    }, [capsule.id, capsule.memoryAidImage, capsule.mnemonic, capsule.category]);

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
    }, [capsule.title, capsule.summary, keyConcepts, examples, language]);

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        window.dispatchEvent(new CustomEvent('memoraid-stop-audio', { detail: { origin: 'capsule-reader' } }));
        stopRequestRef.current = false;
        
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { 
            addToast(avail.reason!, 'info'); 
            return; 
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
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
                    if (activeSourcesRef.current.size === 0 && index === chunks.length - 1) {
                        setIsSpeaking(false);
                    }
                };

                setIsBuffering(false); 
                setIsSpeaking(true); 
                recordTtsSuccess();
                queueChunk(index + 1);
            } catch (e) {
                stopAudio();
            }
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
        if (!isPremium && !capsule.isPremiumContent) { 
            addToast(t('sketch_premium_only'), "info"); 
            return; 
        }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            setMemoryAidImage(`data:image/png;base64,${res.imageData}`);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis généré !", "success");
        } catch (e) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingImage(false); }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Memoraid - ${capsule.title}`,
            text: `Découvre ma capsule d'apprentissage sur "${capsule.title}" avec Memoraid !`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                addToast("Lien copié !", "success");
            }
        } catch (err) {
            addToast("Erreur de partage", "error");
        }
    };

    const handleGoPremium = () => {
        onNavigateToProfile();
    };

    if (!capsule || !capsule.title) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 md:rounded-[40px] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in w-full max-w-none">
            {/* Navigation Header */}
            <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-50 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <button 
                    onClick={onBackToList} 
                    className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:translate-x-1 transition-transform"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                    {t('back_list')}
                </button>
                <button 
                    onClick={handleShare}
                    className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:text-emerald-600 rounded-2xl transition-all"
                >
                    <Share2Icon className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 md:p-12 space-y-12">
                {/* Header Section */}
                <header className="text-center max-w-4xl mx-auto space-y-6">
                    <div className="flex justify-center">
                        {isEditingCategory ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={categoryInput} 
                                    onChange={(e) => setCategoryInput(e.target.value)}
                                    className="px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-emerald-500 bg-white dark:bg-zinc-800 outline-none"
                                    autoFocus
                                />
                                <button onClick={handleSaveCategory} className="text-emerald-600"><CheckCircleIcon className="w-5 h-5"/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsEditingCategory(true)}
                                className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                <TagIcon className="w-3 h-3" />
                                {capsule.category || t('uncategorized')}
                            </button>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                        {capsule.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 dark:text-zinc-400 font-medium max-w-3xl mx-auto leading-relaxed">
                        {capsule.summary}
                    </p>
                </header>

                {/* Modes Control Bar */}
                <div className="max-w-5xl mx-auto">
                    <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 md:p-6 rounded-[32px] border border-slate-100 dark:border-zinc-800">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Speech Button */}
                            <div className="w-full md:w-64">
                                <button 
                                    onClick={handleToggleSpeech}
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                                        isSpeaking ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-zinc-700'
                                    }`}
                                >
                                    {isBuffering ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : isSpeaking ? <StopCircleIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />}
                                    <span>{isBuffering ? t('voice_preparing') : isSpeaking ? t('stop') : t('listen_all')}</span>
                                </button>
                            </div>

                            <div className="hidden md:block w-px h-10 bg-slate-200 dark:bg-zinc-700"></div>

                            {/* Action Grids */}
                            <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                                <button onClick={onStartActiveLearning} className="col-span-2 md:col-span-1 flex items-center justify-center gap-3 p-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200/50 dark:shadow-none">
                                    <PlayIcon className="w-4 h-4" />
                                    <span>{t('active_learning_start')}</span>
                                </button>
                                <button onClick={onStartCoaching} className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 rounded-2xl border border-slate-200 dark:border-zinc-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                                    <span>Coach</span>
                                </button>
                                <button onClick={onStartFlashcards} className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 rounded-2xl border border-slate-200 dark:border-zinc-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                                    <LayersIcon className="w-4 h-4 text-blue-500" />
                                    <span>Flashcards</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
                    {/* Key Concepts */}
                    <div className="lg:col-span-8 space-y-12">
                        <section>
                            <h2 className="flex items-center gap-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><LightbulbIcon className="w-7 h-7" /></div>
                                {t('key_concepts')}
                            </h2>
                            <div className="space-y-8">
                                {keyConcepts.map((concept, idx) => (
                                    <div key={idx} className="group bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-slate-50 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all border-l-8 border-l-amber-400">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{concept.concept}</h3>
                                        <p className="text-slate-600 dark:text-zinc-300 text-lg leading-relaxed">{concept.explanation}</p>
                                        {concept.deepDive && (
                                            <details className="mt-8 group/deep">
                                                <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    <ZapIcon className="w-4 h-4" />
                                                    {t('deep_dive_label')}
                                                    <ChevronRightIcon className="w-4 h-4 group-open/deep:rotate-90 transition-transform" />
                                                </summary>
                                                <div className="mt-4 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl text-slate-700 dark:text-zinc-300 italic border-l-4 border-emerald-500 animate-fade-in-fast">
                                                    {concept.deepDive}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {examples.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">{t('examples')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {examples.map((ex, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-start gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                            <span className="text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">{ex}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Visual Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Sketchnote Section */}
                        <section className="bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative group/sketch">
                            <div className="p-6 pb-0 flex items-center justify-between">
                                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    {t('memory_aid_sketch')}
                                </h3>
                                {memoryAidImage && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); downloadBlob(new Blob([decode(memoryAidImage.split(',')[1])], {type:'image/png'}), `Sketch_${capsule.title}.png`); }}
                                        className="p-2 text-white/40 hover:text-white transition-colors"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="aspect-square relative p-4 flex items-center justify-center cursor-zoom-in" onClick={() => setIsFullscreenSketch(true)}>
                                {isGeneratingImage ? (
                                    <div className="flex flex-col items-center gap-4 text-emerald-400">
                                        <RefreshCwIcon className="w-12 h-12 animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Memoraid dessine...</span>
                                    </div>
                                ) : memoryAidImage ? (
                                    <div className="relative w-full h-full rounded-3xl overflow-hidden group/img">
                                        <img src={memoryAidImage} alt="Synthèse" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <MaximizeIcon className="w-10 h-10 text-white drop-shadow-lg" />
                                        </div>
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/sketch:opacity-100 transition-opacity">
                                            <button onClick={handleGenerateDrawing} className="p-2.5 bg-black/60 backdrop-blur-md text-white rounded-xl hover:bg-emerald-500"><RefreshCwIcon className="w-4 h-4"/></button>
                                            <button onClick={() => setMemoryAidImage(null)} className="p-2.5 bg-black/60 backdrop-blur-md text-white rounded-xl hover:bg-red-500"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center p-10 border-2 border-dashed border-white/10 rounded-[40px] h-full w-full">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6">Visualisez vos concepts</p>
                                        {isPremium || capsule.isPremiumContent ? (
                                            <button onClick={handleGenerateDrawing} className="px-8 py-3 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20">Générer le croquis</button>
                                        ) : (
                                            <button onClick={handleGoPremium} className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20">
                                                <CrownIcon className="w-4 h-4" /> Premium
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Mnemonic Section */}
                        <section className="bg-emerald-600 rounded-[40px] p-8 text-white shadow-xl shadow-emerald-200/20 dark:shadow-none">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 opacity-80">
                                <ZapIcon className="w-4 h-4" /> {t('mnemonic_label')}
                            </h3>
                            {isGeneratingMnemonic ? (
                                <div className="flex items-center gap-3 py-4">
                                    <RefreshCwIcon className="w-6 h-6 animate-spin" />
                                    <span className="font-bold">Inspiration...</span>
                                </div>
                            ) : mnemonic ? (
                                <div className="space-y-6">
                                    <p className="text-2xl font-black leading-tight">"{mnemonic}"</p>
                                    <button onClick={handleGenerateMnemonic} className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 opacity-70 hover:opacity-100 transition-opacity">Regénérer</button>
                                </div>
                            ) : (
                                <button onClick={handleGenerateMnemonic} className="w-full py-4 bg-white/20 hover:bg-white/30 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors">Générer l'astuce</button>
                            )}
                        </section>
                    </div>
                </div>

                {/* Quiz Section */}
                <section className="mt-20">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
                         <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><ListChecksIcon className="w-7 h-7" /></div>
                         {t('quiz_title')}
                    </h2>
                    <Quiz questions={quiz} onComplete={(score) => onMarkAsReviewed(capsule.id, score, 'quiz')} />
                </section>

                {/* FOOTER EXPORT - STATION DE CONTRÔLE PREMIUM */}
                <footer className="pt-20 border-t border-slate-100 dark:border-zinc-800">
                    <div className="max-w-5xl mx-auto space-y-12">
                        <div className="text-center">
                            <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4">{t('advanced_export')}</h3>
                            <div className="h-1.5 w-16 bg-emerald-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <button 
                                onClick={() => downloadCapsulePdf(capsule)} 
                                className="group flex flex-col items-center p-8 bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 rounded-[32px] shadow-sm hover:shadow-2xl hover:border-emerald-500/30 transition-all hover:-translate-y-2"
                            >
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                                    <FileTextIcon className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">Fiche PDF</span>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">Télécharger</p>
                            </button>

                            <button 
                                onClick={() => exportToPPTX(capsule)} 
                                className="group flex flex-col items-center p-8 bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 rounded-[32px] shadow-sm hover:shadow-2xl hover:border-amber-500/30 transition-all hover:-translate-y-2"
                            >
                                <div className="p-5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                                    <PresentationIcon className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">PowerPoint</span>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">Exporter</p>
                            </button>

                            <button 
                                onClick={() => downloadFlashcardsPdf(capsule)} 
                                className="group flex flex-col items-center p-8 bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 rounded-[32px] shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all hover:-translate-y-2"
                            >
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                    <LayersIcon className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">Flashcards</span>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">Imprimer</p>
                            </button>

                            <button 
                                onClick={() => downloadQuizPdf(capsule)} 
                                className="group flex flex-col items-center p-8 bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 rounded-[32px] shadow-sm hover:shadow-2xl hover:border-purple-500/30 transition-all hover:-translate-y-2"
                            >
                                <div className="p-5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                                    <ListChecksIcon className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">Quiz PDF</span>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">Évaluer</p>
                            </button>
                        </div>

                        <div className="flex justify-center pt-8">
                             <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-50 dark:bg-zinc-800 rounded-full border border-slate-100 dark:border-zinc-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                    Dernière révision : {capsule.lastReviewed ? new Date(capsule.lastReviewed).toLocaleDateString() : 'Jamais'}
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Lightbox Mode */}
            {isFullscreenSketch && memoryAidImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in"
                    onClick={() => setIsFullscreenSketch(false)}
                >
                    <button className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-8 h-8" /></button>
                    <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center gap-8" onClick={e => e.stopPropagation()}>
                        <img src={memoryAidImage} alt="Sketchnote" className="max-w-full max-h-[75vh] object-contain rounded-[40px] shadow-2xl border border-white/5" />
                        <div className="flex gap-6">
                             <button 
                                onClick={() => downloadBlob(new Blob([decode(memoryAidImage.split(',')[1])], {type:'image/png'}), `Memoraid_Sketch_${capsule.title}.png`)}
                                className="px-10 py-5 bg-white text-zinc-900 rounded-[20px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-3"
                            >
                                <DownloadIcon className="w-6 h-6" /> Télécharger
                            </button>
                            <button onClick={() => setIsFullscreenSketch(false)} className="px-10 py-5 bg-white/5 text-white rounded-[20px] font-black uppercase text-xs tracking-widest border border-white/10 hover:bg-white/20 transition-all">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapsuleView;
