import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group } from '../types';
import Quiz from './Quiz';
import { 
    DownloadIcon, 
    Volume2Icon, 
    StopCircleIcon, 
    RefreshCwIcon, 
    ImageIcon, 
    SparklesIcon, 
    ChevronLeftIcon, 
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
    ArrowRightIcon,
    ChevronDownIcon,
    AlertCircleIcon
} from '../constants';
import { generateMemoryAidDrawing, generateMnemonic } from '../services/geminiService';
import { downloadCapsulePdf, downloadFlashcardsPdf, downloadQuizPdf } from '../services/pdfService';
import { exportToPPTX } from '../services/exportService';
import { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import { checkTtsAvailability, recordTtsSuccess } from '../services/quotaManager';
import { segmentText } from '../services/voiceUtils';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const length = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(length);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
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
    onSelectCapsule: (capsule: CognitiveCapsule) => void;
    addToast: (message: string, type: ToastType) => void;
    userGroups: Group[];
    onShareCapsule: (group: Group, capsule: CognitiveCapsule) => void;
    isPremium?: boolean;
}

const CapsuleView: React.FC<CapsuleViewProps> = ({ 
    capsule, 
    allCapsules,
    addToast, 
    onBackToList, 
    onSetMemoryAid, 
    onSetMnemonic, 
    onMarkAsReviewed, 
    onSetCategory, 
    onStartFlashcards, 
    onStartCoaching, 
    onNavigateToProfile,
    onSelectCapsule,
    isPremium,
    onStartActiveLearning
}) => {
    const { language, t } = useLanguage();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreenSketch, setIsFullscreenSketch] = useState(false);
    const [showNextSuggestion, setShowNextSuggestion] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const stopRequestRef = useRef<boolean>(false);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);
    const currentSpeedRef = useRef<number>(1);

    const [memoryAidImage, setMemoryAidImage] = useState<string | null>(capsule.memoryAidImage ? `data:image/png;base64,${capsule.memoryAidImage}` : null);
    const [mnemonic, setMnemonic] = useState<string | null>(capsule.mnemonic || null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryInput, setCategoryInput] = useState(capsule.category || '');

    const nextCapsule = useMemo(() => {
        if (!allCapsules || allCapsules.length <= 1) return null;
        const currentCategory = (capsule.category || t('uncategorized')).trim().toLowerCase();
        const collection = allCapsules
            .filter(c => (c.category || t('uncategorized')).trim().toLowerCase() === currentCategory)
            .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        const currentIndex = collection.findIndex(c => c.id === capsule.id);
        if (currentIndex !== -1 && currentIndex < collection.length - 1) return collection[currentIndex + 1];
        return null;
    }, [allCapsules, capsule.id, capsule.category, t]);

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
        if (silentAudioRef.current) silentAudioRef.current.pause();
    }, []);

    useEffect(() => {
        setShowNextSuggestion(false);
        stopAudio();
    }, [capsule.id, stopAudio]);

    // Mise à jour synchrone de la vitesse pour les sources en attente ou actives
    useEffect(() => {
        currentSpeedRef.current = playbackSpeed;
        activeSourcesRef.current.forEach(source => {
            try { source.playbackRate.value = playbackSpeed; } catch (e) {}
        });
    }, [playbackSpeed]);

    const togglePlaybackSpeed = () => {
        const speeds = [1, 1.2, 1.5, 2];
        const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
        setPlaybackSpeed(next);
    };

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        
        window.dispatchEvent(new CustomEvent('memoraid-stop-audio', { detail: { origin: 'capsule-reader' } }));
        stopRequestRef.current = false;
        
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { addToast(avail.reason!, 'info'); return; }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        // Hack iOS/Android pour garder l'AudioContext éveillé
        if (!silentAudioRef.current) {
            silentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==');
            silentAudioRef.current.loop = true;
        }
        try { await silentAudioRef.current.play(); } catch (e) {}

        const textToRead = `${capsule.title}. ${capsule.summary}. ${t('key_concepts')}: ${capsule.keyConcepts.map(c => `${c.concept}: ${c.explanation}`).join('. ')}`;
        // Segmentation plus large pour réduire les requêtes et fluidifier
        const chunks = segmentText(textToRead, isPremium ? 40 : 20);
        if (chunks.length === 0) return;

        setIsBuffering(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;

        // Pipeline de lecture Gapless avec pré-chargement
        const processQueue = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) {
                if (index >= chunks.length && activeSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                    if (silentAudioRef.current) silentAudioRef.current.pause();
                }
                return;
            }

            try {
                // Lancement de la requête Gemini TTS
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
                
                // Préparation de la source
                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer; 
                source.playbackRate.value = currentSpeedRef.current;
                source.connect(audioContextRef.current!.destination);
                
                // Calcul du timing exact pour éviter les pauses
                const now = audioContextRef.current!.currentTime;
                const startTime = Math.max(now + 0.05, nextStartTimeRef.current);
                
                source.start(startTime);
                activeSourcesRef.current.add(source);
                
                // Durée ajustée à la vitesse
                const adjustedDuration = buffer.duration / currentSpeedRef.current;
                nextStartTimeRef.current = startTime + adjustedDuration;

                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0 && index === chunks.length - 1) {
                        setIsSpeaking(false);
                        if (silentAudioRef.current) silentAudioRef.current.pause();
                    }
                };

                setIsBuffering(false); 
                setIsSpeaking(true); 
                recordTtsSuccess();

                // Lancement du chargement du segment suivant SANS ATTENDRE
                processQueue(index + 1);

            } catch (e) { 
                console.error("TTS Stream Error", e);
                if (activeSourcesRef.current.size === 0) stopAudio(); 
            }
        };

        // Lancement initial (on peut lancer les 2 premiers segments en parallèle pour bufferiser)
        processQueue(0);
    };

    const handleQuizComplete = (score: number) => {
        onMarkAsReviewed(capsule.id, score, 'quiz');
        if (score >= 60 && nextCapsule) {
            setTimeout(() => setShowNextSuggestion(true), 800);
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            setMemoryAidImage(`data:image/png;base64,${res.imageData}`);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis généré !", 'success');
        } catch (e) { addToast(t('error_generation'), 'error'); } finally { setIsGeneratingImage(false); }
    };

    const handleGenerateMnemonic = async () => {
        setIsGeneratingMnemonic(true);
        try {
            const m = await generateMnemonic(capsule, language);
            setMnemonic(m);
            onSetMnemonic(capsule.id, m);
            addToast("Astuce générée !", 'success');
        } catch (e) { addToast(t('error_generation'), 'error'); } finally { setIsGeneratingMnemonic(false); }
    };

    const handleSaveCategory = () => {
        if (categoryInput.trim()) {
            onSetCategory(capsule.id, categoryInput);
            setIsEditingCategory(false);
            addToast(t('category_updated'), 'success');
        }
    };

    const handleGoToNext = () => {
        if (nextCapsule) {
            setShowNextSuggestion(false);
            onSelectCapsule(nextCapsule);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in relative">
            
            {showNextSuggestion && nextCapsule && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-[100] animate-toast-enter pointer-events-auto">
                    <div className="bg-slate-900 dark:bg-zinc-800 text-white p-5 rounded-[32px] shadow-2xl border border-white/10 flex items-center gap-5 ring-4 ring-emerald-500/20">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                            <ArrowRightIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Continuer la série</p>
                            <h4 className="font-bold text-base truncate pr-2">{nextCapsule.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleGoToNext}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl cursor-pointer"
                            >
                                Aller
                            </button>
                            <button onClick={() => setShowNextSuggestion(false)} className="p-2.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                                <XIcon className="w-5 h-5 text-white/40" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <button onClick={onBackToList} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors uppercase text-xs tracking-widest">
                    <ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}
                </button>
                <div className="flex items-center gap-2">
                    {isEditingCategory ? (
                        <div className="flex items-center gap-2">
                            <input value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="px-3 py-1 text-xs border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-emerald-500" autoFocus />
                            <button onClick={handleSaveCategory} className="p-1.5 bg-emerald-500 text-white rounded-lg"><CheckCircleIcon className="w-4 h-4" /></button>
                            <button onClick={() => setIsEditingCategory(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg"><XIcon className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditingCategory(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <TagIcon className="w-3.5 h-3.5" />
                            {capsule.category || t('uncategorized')}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <header className="mb-10">
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter mb-6">{capsule.title}</h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 leading-relaxed font-medium italic">{capsule.summary}</p>
                        </header>

                        <div className="space-y-12">
                            <section>
                                <h2 className="flex items-center gap-3 text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">
                                    <div className="h-px bg-emerald-100 dark:bg-emerald-900/30 flex-grow"></div>
                                    {t('key_concepts')}
                                    <div className="h-px bg-emerald-100 dark:bg-emerald-900/30 flex-grow"></div>
                                </h2>
                                <div className="space-y-10">
                                    {capsule.keyConcepts.map((concept, idx) => (
                                        <div key={idx} className="group">
                                            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-3 group-hover:text-emerald-600 transition-colors flex items-center gap-3">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-sm">{idx + 1}</span>
                                                {concept.concept}
                                            </h3>
                                            <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-base md:text-lg pl-11 mb-2">{concept.explanation}</p>
                                            {concept.deepDive && (
                                                <details className="ml-11 group/details">
                                                    <summary className="text-xs font-bold text-slate-400 hover:text-emerald-500 cursor-pointer list-none uppercase tracking-widest transition-colors flex items-center gap-2">
                                                        {t('expand')} <ChevronDownIcon className="w-3 h-3 group-open/details:rotate-180 transition-transform" />
                                                    </summary>
                                                    <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">{concept.deepDive}</p>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {capsule.examples && capsule.examples.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                        <LayersIcon className="w-5 h-5" /> {t('examples')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {capsule.examples.map((ex, i) => (
                                            <div key={i} className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-slate-700 dark:text-zinc-300 text-sm font-medium">
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    <div id="quiz-section">
                        <Quiz questions={capsule.quiz} onComplete={handleQuizComplete} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[40px] p-6 text-white shadow-2xl border border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-2">{t('learning_modes')}</h3>
                        <div className="space-y-3">
                            <button onClick={onStartActiveLearning} className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-500 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform"><PlayIcon className="w-6 h-6" /></div>
                                    <span className="font-black uppercase text-xs tracking-widest">{t('mode_active')}</span>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                            <button onClick={onStartFlashcards} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/30 rounded-2xl group-hover:rotate-12 transition-transform"><LayersIcon className="w-6 h-6" /></div>
                                    <span className="font-black uppercase text-xs tracking-widest">{t('mode_flashcards')}</span>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                            <button onClick={onStartCoaching} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/30 rounded-2xl group-hover:rotate-12 transition-transform"><SparklesIcon className="w-6 h-6" /></div>
                                    <span className="font-black uppercase text-xs tracking-widest">{t('mode_coach')}</span>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                             <div className="flex items-center gap-2">
                                 <button onClick={handleToggleSpeech} disabled={isBuffering} className="flex-grow flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-emerald-50 transition-colors disabled:opacity-50">
                                    {isBuffering ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : (isSpeaking ? <StopCircleIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />)}
                                    {isSpeaking ? t('stop') : t('listen_all')}
                                 </button>
                                 <button onClick={togglePlaybackSpeed} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors border border-white/10">
                                     <span className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t('vocal_speed')}</span>
                                     <span className="text-xs font-bold">{playbackSpeed}x</span>
                                 </button>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-6 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('memory_aid_sketch')}</h3>
                            {!isPremium && <CrownIcon className="w-4 h-4 text-amber-400" />}
                        </div>
                        
                        <div className="relative aspect-square bg-slate-50 dark:bg-zinc-800 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center group">
                            {memoryAidImage ? (
                                <>
                                    <img src={memoryAidImage} alt="Visual Aid" className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button onClick={() => setIsFullscreenSketch(true)} className="p-3 bg-white text-slate-900 rounded-2xl hover:scale-110 transition-transform shadow-lg"><MaximizeIcon className="w-5 h-5"/></button>
                                        <button onClick={handleGenerateImage} className="p-3 bg-white text-slate-900 rounded-2xl hover:scale-110 transition-transform shadow-lg"><RefreshCwIcon className="w-5 h-5"/></button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline disabled:opacity-50">
                                        {isGeneratingImage ? t('generating') : t('generate_sketch')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
                            <AlertCircleIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <p>{t('sketch_disclaimer')}</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[40px] p-8 border border-amber-100 dark:border-amber-900/30">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 mb-4">{t('mnemonic_label')}</h3>
                        {mnemonic ? (
                            <div className="space-y-4">
                                <p className="text-lg font-black text-amber-900 dark:text-amber-200 leading-snug italic">"{mnemonic}"</p>
                                <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 hover:text-amber-600 transition-colors">Regénérer</button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-200/50 flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors">
                                <ZapIcon className="w-4 h-4" /> {isGeneratingMnemonic ? t('generating') : t('generate_mnemonic')}
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-6 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{t('advanced_export')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => downloadCapsulePdf(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-emerald-50 transition-colors group">
                                <FileTextIcon className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase text-center">{t('export_pdf')}</span>
                            </button>
                            <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-indigo-50 transition-colors group">
                                <LayersIcon className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase text-center">{t('export_cards')}</span>
                            </button>
                            <button onClick={() => downloadQuizPdf(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-sky-50 transition-colors group">
                                <ListChecksIcon className="w-6 h-6 text-sky-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase text-center">{t('download_quiz')}</span>
                            </button>
                            <button onClick={() => exportToPPTX(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-orange-50 transition-colors group">
                                <PresentationIcon className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase text-center">{t('export_ppt')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isFullscreenSketch && memoryAidImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10 animate-fade-in" onClick={() => setIsFullscreenSketch(false)}>
                    <button onClick={() => setIsFullscreenSketch(false)} className="absolute top-6 right-6 p-4 text-white hover:rotate-90 transition-transform z-10"><XIcon className="w-10 h-10"/></button>
                    <img src={memoryAidImage} alt="Visual Aid Detail" className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default CapsuleView;