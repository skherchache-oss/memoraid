import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group } from '../types';
import Quiz from './Quiz';
import { 
    DownloadIcon, Volume2Icon, StopCircleIcon, RefreshCwIcon, ImageIcon, 
    SparklesIcon, ChevronLeftIcon, FileTextIcon, ZapIcon, PlayIcon, 
    ListChecksIcon, LayersIcon, TagIcon, XIcon, PresentationIcon, 
    CheckCircleIcon, ChevronRightIcon, CrownIcon, MaximizeIcon, 
    ArrowRightIcon, ChevronDownIcon, AlertCircleIcon
} from '../constants';
import { generateMemoryAidDrawing, generateMnemonic } from '../services/geminiService';
import { downloadCapsulePdf, downloadFlashcardsPdf, downloadQuizPdf } from '../services/pdfService';
import { exportToPPTX } from '../services/exportService';
import { ToastType } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import { checkTtsAvailability, recordTtsSuccess, checkImageQuota } from '../services/quotaManager';
import { segmentText } from '../services/voiceUtils';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const length = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(length);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let i = 0; i < length; i++) dataInt16[i] = view.getInt16(i * 2, true);
  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
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
    capsule, allCapsules, addToast, onBackToList, onSetMemoryAid, onSetMnemonic, 
    onMarkAsReviewed, onSetCategory, onStartFlashcards, onStartCoaching, 
    onNavigateToProfile, onSelectCapsule, isPremium, onStartActiveLearning
}) => {
    const { language, t } = useLanguage();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreenSketch, setIsFullscreenSketch] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const stopRequestRef = useRef<boolean>(false);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    const [memoryAidImage, setMemoryAidImage] = useState<string | null>(capsule.memoryAidImage ? `data:image/png;base64,${capsule.memoryAidImage}` : null);
    const [mnemonic, setMnemonic] = useState<string | null>(capsule.mnemonic || null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

    const stopAudio = useCallback(() => {
        stopRequestRef.current = true;
        activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} s.disconnect(); });
        activeSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsSpeaking(false);
        setIsBuffering(false);
        if (silentAudioRef.current) silentAudioRef.current.pause();
    }, []);

    useEffect(() => { stopAudio(); }, [capsule.id, stopAudio]);

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        stopRequestRef.current = false;
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { addToast(avail.reason!, 'info'); return; }
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        if (!silentAudioRef.current) {
            silentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==');
            silentAudioRef.current.loop = true;
        }
        try { await silentAudioRef.current.play(); } catch (e) {}

        const conceptsText = capsule.keyConcepts.map(c => `${c.concept}: ${c.explanation}`).join('. ');
        const examplesText = capsule.examples?.length ? `${t('examples')}: ${capsule.examples.join('. ')}` : "";
        const textToRead = `${capsule.title}. ${capsule.summary}. ${t('key_concepts')}: ${conceptsText}. ${examplesText}`;
        
        const chunks = segmentText(textToRead, isPremium ? 50 : 25);
        setIsBuffering(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;

        const processQueue = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) {
                if (index >= chunks.length && activeSourcesRef.current.size === 0) { setIsSpeaking(false); if (silentAudioRef.current) silentAudioRef.current.pause(); }
                return;
            }
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: chunks[index] }] }],
                    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: language === 'fr' ? 'Kore' : 'Zephyr' } } } },
                });
                const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (!base64 || stopRequestRef.current) return;
                const buffer = await decodeAudioData(decode(base64), audioContextRef.current!, 24000, 1);
                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer; 
                source.playbackRate.value = playbackSpeed;
                source.connect(audioContextRef.current!.destination);
                const startTime = Math.max(audioContextRef.current!.currentTime + 0.05, nextStartTimeRef.current);
                source.start(startTime);
                activeSourcesRef.current.add(source);
                nextStartTimeRef.current = startTime + (buffer.duration / playbackSpeed);
                source.onended = () => { activeSourcesRef.current.delete(source); if (activeSourcesRef.current.size === 0 && index === chunks.length - 1) { setIsSpeaking(false); if (silentAudioRef.current) silentAudioRef.current.pause(); } };
                setIsBuffering(false); setIsSpeaking(true); recordTtsSuccess();
                processQueue(index + 1);
            } catch (e) { stopAudio(); }
        };
        processQueue(0);
    };

    const handleGenerateImage = async () => {
        const quota = checkImageQuota(capsule.id, !!isPremium);
        if (!quota.allowed) { addToast(t('sketch_premium_only'), 'info'); return; }
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

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in relative">
            <div className="flex items-center justify-between gap-4">
                <button onClick={onBackToList} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors uppercase text-xs tracking-widest">
                    <ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}
                </button>
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full text-xs font-bold flex items-center gap-2">
                    <TagIcon className="w-3.5 h-3.5" /> {capsule.category || t('uncategorized')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <header className="mb-10">
                            {/* TITRE AFFINÉ : BOLD PLUTÔT QUE BLACK, TRACKING SERRÉ */}
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-6">{capsule.title}</h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 leading-relaxed font-medium italic mb-8">{capsule.summary}</p>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-[32px] border border-emerald-100">
                                <button onClick={handleToggleSpeech} disabled={isBuffering} className="w-full sm:w-auto flex-grow flex items-center justify-center gap-3 py-3 px-8 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isBuffering ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : (isSpeaking ? <StopCircleIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />)}
                                    {isSpeaking ? t('stop') : t('listen_all')}
                                </button>
                                <button onClick={() => setPlaybackSpeed(s => s === 2 ? 1 : s + 0.5)} className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 text-emerald-600 font-bold text-xs shadow-sm border border-emerald-100">{playbackSpeed}x</button>
                            </div>
                        </header>

                        <div className="space-y-12">
                            <section>
                                <h2 className="flex items-center gap-3 text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">
                                    <div className="h-px bg-emerald-100 flex-grow"></div> {t('key_concepts')} <div className="h-px bg-emerald-100 flex-grow"></div>
                                </h2>
                                <div className="space-y-10">
                                    {capsule.keyConcepts.map((concept, idx) => (
                                        <div key={idx} className="group">
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-emerald-600 transition-colors flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">{idx + 1}</span>
                                                {concept.concept}
                                            </h3>
                                            <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-base md:text-lg pl-11">{concept.explanation}</p>
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
                                            <div key={i} className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 rounded-2xl text-slate-700 dark:text-zinc-300 text-sm font-medium">
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                    <Quiz questions={capsule.quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} />
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[40px] p-6 text-white shadow-2xl border border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-2">{t('learning_modes')}</h3>
                        <div className="space-y-3">
                            <button onClick={onStartActiveLearning} className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-500 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4"><div className="p-3 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform"><PlayIcon className="w-6 h-6" /></div><span className="font-bold uppercase text-xs tracking-widest">{t('mode_active')}</span></div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                            <button onClick={onStartFlashcards} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4"><div className="p-3 bg-indigo-500/30 rounded-2xl group-hover:rotate-12 transition-transform"><LayersIcon className="w-6 h-6" /></div><span className="font-bold uppercase text-xs tracking-widest">{t('mode_flashcards')}</span></div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                            <button onClick={onStartCoaching} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-3xl transition-all group">
                                <div className="flex items-center gap-4"><div className="p-3 bg-blue-500/30 rounded-2xl group-hover:rotate-12 transition-transform"><SparklesIcon className="w-6 h-6" /></div><span className="font-bold uppercase text-xs tracking-widest">{t('mode_coach')}</span></div>
                                <ChevronRightIcon className="w-5 h-5 opacity-50" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-6 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{t('memory_aid_sketch')}</h3>
                        <div className="relative aspect-square bg-slate-50 dark:bg-zinc-800 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group">
                            {memoryAidImage ? <><img src={memoryAidImage} className="w-full h-full object-contain p-2" /><button onClick={() => setIsFullscreenSketch(true)} className="absolute top-2 right-2 p-2 bg-white/80 rounded-lg shadow-sm"><MaximizeIcon className="w-4 h-4" /></button></> : <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{isGeneratingImage ? t('generating') : t('generate_sketch')}</button>}
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[40px] p-8 border border-amber-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 mb-4">{t('mnemonic_label')}</h3>
                        {mnemonic ? <p className="text-lg font-bold text-amber-900 dark:text-amber-200 leading-snug italic">"{mnemonic}"</p> : <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">{isGeneratingMnemonic ? t('generating') : t('generate_mnemonic')}</button>}
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-6 shadow-xl border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{t('advanced_export')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => downloadCapsulePdf(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-emerald-50 transition-colors">
                                <FileTextIcon className="w-6 h-6 text-emerald-500" /><span className="text-[9px] font-black uppercase text-center">{t('export_pdf')}</span>
                            </button>
                            <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-indigo-50 transition-colors">
                                <LayersIcon className="w-6 h-6 text-indigo-500" /><span className="text-[9px] font-black uppercase text-center">{t('export_cards')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isFullscreenSketch && memoryAidImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsFullscreenSketch(false)}>
                    <button onClick={() => setIsFullscreenSketch(false)} className="absolute top-6 right-6 p-4 text-white"><XIcon className="w-10 h-10"/></button>
                    <img src={memoryAidImage} className="max-w-full max-h-[80vh] object-contain rounded-xl" />
                </div>
            )}
        </div>
    );
};

export default CapsuleView;