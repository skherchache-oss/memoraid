
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
import { checkImageQuota, checkTtsAvailability, recordTtsSuccess, triggerTtsSafetyLock } from '../services/quotaManager';
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

const CapsuleView: React.FC<CapsuleViewProps> = ({ capsule, addToast, onBackToList, onSetMemoryAid, onSetMnemonic, onMarkAsReviewed, onSetCategory, onStartFlashcards, onStartCoaching, onNavigateToProfile, userGroups, onShareCapsule, currentUserId, isPremium }) => {
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
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryInput, setCategoryInput] = useState(capsule.category || '');

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
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
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
        let text = `${capsule.title}. ${capsule.summary}. `;
        text += language === 'fr' ? "Concepts clés : " : "Key concepts: ";
        capsule.keyConcepts.forEach(c => { text += `${c.concept}. ${c.explanation}. `; });
        if (capsule.examples && capsule.examples.length > 0) {
            text += language === 'fr' ? "Exemples : " : "Examples: ";
            capsule.examples.forEach(e => { text += `${e}. `; });
        }
        return text;
    }, [capsule, language]);

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        
        // Arrêter tout autre son interne (Coach)
        window.dispatchEvent(new CustomEvent('memoraid-stop-audio', { detail: { origin: 'capsule-reader' } }));
        
        stopRequestRef.current = false;
        
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { 
            const msg = avail.code === 'QUOTA' ? t('error_vocal_quota') : avail.reason!;
            addToast(msg, 'info'); 
            return; 
        }
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // SIGNALER AU SYSTEME (YouTube/Spotify s'arrêtent ici)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: capsule.title,
                artist: 'Memoraid Reader',
                album: 'Cognitive Capsule',
                artwork: [{ src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }]
            });
            navigator.mediaSession.playbackState = 'playing';
            navigator.mediaSession.setActionHandler('stop', stopAudio);
        }
        
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
                if (stopRequestRef.current) return;
                
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
                
                // Enchaîner
                queueChunk(index + 1);
            } catch (e: any) {
                stopAudio();
                const errorStr = e?.message || "";
                if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
                    addToast(t('error_vocal_quota'), "info");
                } else if (errorStr.includes('503') || errorStr.includes('busy')) {
                    addToast(t('error_vocal_busy'), "info");
                } else if (!navigator.onLine) {
                    addToast(t('error_vocal_offline'), "error");
                } else {
                    addToast(t('error_general_service'), "error");
                }
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
        const hasExistingImage = !!memoryAidImage;
        if (hasExistingImage && !isPremium) { addToast(t('sketch_regenerate_premium'), "info"); return; }
        if (!hasExistingImage && !isPremium && !capsule.isPremiumContent) { addToast(t('sketch_premium_only'), "info"); return; }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            setMemoryAidImage(`data:image/png;base64,${res.imageData}`);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast(hasExistingImage ? "Croquis regénéré !" : "Croquis généré !", "success");
        } catch (e: any) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingImage(false); }
    };

    const handleDownloadOnlyImage = () => {
        if (!memoryAidImage) return;
        const base64 = memoryAidImage.split('base64,')[1];
        const bytes = decode(base64);
        const blob = new Blob([bytes], { type: 'image/png' });
        downloadBlob(blob, `Memoraid_Sketch_${capsule.title.replace(/\s+/g, '_')}.png`);
    };

    const canSeeSection = isPremium || capsule.isPremiumContent;
    const hasSketch = !!memoryAidImage;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in pb-20">
            <button onClick={onBackToList} className="md:hidden flex items-center gap-1 p-4 text-sm font-semibold text-emerald-600 w-full border-b border-slate-100 dark:border-zinc-800"><ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}</button>
            <div className="p-6 md:p-10">
                <div className="mb-8">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex-grow">
                            <div className="mb-3 flex items-center gap-2">
                                {isEditingCategory ? (
                                    <div className="flex items-center gap-2 animate-fade-in-fast">
                                        <input type="text" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 border border-emerald-300 rounded-full outline-none focus:ring-1 focus:ring-emerald-500" placeholder={t('category_placeholder')} autoFocus />
                                        <button onClick={handleSaveCategory} className="p-1 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"><ZapIcon className="w-3 h-3" /></button>
                                        <button onClick={() => setIsEditingCategory(false)} className="p-1 bg-slate-200 dark:bg-zinc-700 text-slate-500 rounded-full hover:bg-slate-300 transition-colors"><XIcon className="w-3 h-3" /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditingCategory(true)} className="group flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all shadow-sm">
                                        <TagIcon className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{capsule.category || t('uncategorized')}</span>
                                        <RefreshCwIcon className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{capsule.title}</h2>
                        </div>
                        <button onClick={() => setShowShareMenu(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><Share2Icon className="w-5 h-5"/></button>
                    </div>
                    <p className="text-base md:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed mb-6">{capsule.summary}</p>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isSpeaking ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200'}`}>
                                <Volume2Icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{isSpeaking ? t('reading_in_progress') : isBuffering ? t('voice_preparing') : t('full_reading_branding')}</span>
                        </div>
                        <button onClick={handleToggleSpeech} className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-tighter transition-all shadow-md flex items-center gap-2 ${isSpeaking || isBuffering ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {isBuffering ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : isSpeaking ? <StopCircleIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            {isSpeaking || isBuffering ? t('stop') : t('listen_all')}
                        </button>
                    </div>
                </div>
                <div className="space-y-16">
                    <section><h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><LightbulbIcon className="w-6 h-6 mr-3 text-amber-500" /> {t('key_concepts')}</h3><div className="grid gap-5">{capsule.keyConcepts.map((c, i) => (<div key={i} className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md"><p className="font-bold text-xl text-slate-900 dark:text-white mb-2">{c.concept}</p><p className="text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">{c.explanation}</p>{c.deepDive && (<div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700"><p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><SparklesIcon className="w-3 h-3" /> {t('deep_dive_label')}</p><p className="text-sm text-slate-500 dark:text-zinc-400 italic leading-relaxed">{c.deepDive}</p></div>)}</div>))}</div></section>
                    <section><h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ZapIcon className="w-6 h-6 mr-3 text-orange-500" /> {t('mnemonic_title')}</h3>{mnemonic ? (<div className="bg-orange-50/50 dark:bg-orange-900/10 p-8 rounded-3xl border border-orange-200 dark:border-orange-800 text-center relative shadow-sm"><p className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-zinc-100">"{mnemonic}"</p><button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="mt-4 text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 mx-auto"><RefreshCwIcon className={`w-3 h-3 ${isGeneratingMnemonic ? 'animate-spin' : ''}`} /> {t('regenerate')}</button></div>) : (<button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-10 border-2 border-dashed border-orange-200 rounded-3xl text-orange-600 font-bold hover:bg-orange-50 transition-colors">{isGeneratingMnemonic ? t('generating_mnemonic') : t('generate_mnemonic')}</button>)}</section>
                    <section><h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ImageIcon className="w-6 h-6 mr-3 text-violet-500" /> {t('memory_aid_sketch')}</h3>{canSeeSection ? (<div className="bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800 p-4">{hasSketch ? (<div className="space-y-6 animate-fade-in-fast relative"><div className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-zinc-700 relative group"><img src={memoryAidImage!} alt="Memory aid sketch" className="w-full h-auto"/><button onClick={handleDownloadOnlyImage} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title={t('download_sketch')}><DownloadIcon className="w-5 h-5" /></button></div>{capsule.memoryAidDescription && (<div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border-l-4 border-violet-500 shadow-sm"><h4 className="text-[10px] font-black uppercase tracking-tighter text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-2"><SparklesIcon className="w-3 h-3" />{t('sketch_summary_label')}</h4><p className="text-sm text-slate-600 dark:text-zinc-300 italic leading-relaxed">{capsule.memoryAidDescription}</p></div>)}<div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-start gap-2 border border-slate-200 dark:border-zinc-700"><AlertCircleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /><p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight italic">{t('sketch_warning')}</p></div><div className="flex justify-between items-center gap-4"><div className="flex gap-4"><button onClick={() => setMemoryAidImage(null)} className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase">{t('erase')}</button><button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className={`text-xs font-bold uppercase flex items-center gap-1 transition-colors ${isPremium ? 'text-violet-500 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}><RefreshCwIcon className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`}/> {isPremium ? t('regenerate') : t('sketch_regenerate_premium')}</button></div></div></div>) : (<div className="text-center py-12 px-4"><p className="text-slate-500 dark:text-zinc-400 mb-6">{t('sketch_placeholder_text')}</p><button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md flex items-center gap-2 mx-auto">{isGeneratingImage ? <RefreshCwIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>} {t('generate_sketch')}</button></div>)}</div>) : (<div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-3xl border border-amber-200 dark:border-amber-800/30 text-center"><LockIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" /><p className="text-sm text-amber-700 mb-6">{t('sketch_premium_only')}</p><button onClick={onNavigateToProfile} className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 uppercase transition-colors">{t('activate_in_profile')}</button></div>)}</section>
                    <div className="pt-8 border-t border-slate-100 dark:border-zinc-800"><Quiz questions={capsule.quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 border-t border-slate-100 dark:border-zinc-800">
                        <button onClick={onStartFlashcards} className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><SparklesIcon className="w-4 h-4" /> Flashcards</button>
                        <button onClick={onStartCoaching} className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><MessageSquareIcon className="w-4 h-4" /> Coach IA</button>
                        <button onClick={() => downloadCapsulePdf(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><FileTextIcon className="w-4 h-4" /> Fiche PDF</button>
                        <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><LayersIcon className="w-4 h-4" /> Cards (Print)</button>
                        <button onClick={() => downloadQuizPdf(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><ListChecksIcon className="w-4 h-4" /> Quiz PDF</button>
                        <button onClick={() => exportToPPTX(capsule)} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold text-[10px] uppercase hover:shadow-md transition-all"><DownloadIcon className="w-4 h-4" /> PPTX</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapsuleView;
