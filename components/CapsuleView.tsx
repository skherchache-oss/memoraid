
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group, Comment, CollaborativeTask } from '../types';
import Quiz from './Quiz';
import { LightbulbIcon, ListChecksIcon, MessageSquareIcon, DownloadIcon, TagIcon, Volume2Icon, StopCircleIcon, RefreshCwIcon, ImageIcon, SparklesIcon, ChevronLeftIcon, PlayIcon, Share2Icon, FileTextIcon, UserIcon, SendIcon, MonitorIcon, CrownIcon, CheckSquareIcon, PresentationIcon, BookIcon, PrinterIcon, ZapIcon, LockIcon, ClockIcon, LayersIcon, XIcon, AlertCircleIcon } from '../constants';
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
    for (let i = 0; i < frameCount; i++) dataInt16[i] = dataInt16[i * numChannels + channel] / 32768.0;
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

const CapsuleView: React.FC<CapsuleViewProps> = ({ capsule, onUpdateQuiz, addToast, onBackToList, onSetMemoryAid, onSetMnemonic, allCategories, onSetCategory, onMarkAsReviewed, onStartActiveLearning, onStartFlashcards, onStartCoaching, onNavigateToProfile, userGroups, onShareCapsule, currentUserId, currentUserName, isPremium }) => {
    const { language, t } = useLanguage();
    const isDue = isCapsuleDue(capsule);
    
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
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [mnemonic, setMnemonic] = useState<string | null>(capsule.mnemonic || null);
    const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
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
            addToast(t('mnemonic_generated_by'), "success");
        } catch (e) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingMnemonic(false); }
    };

    const handleGenerateDrawing = async () => {
        const quota = checkImageQuota(capsule.id, !!isPremium);
        if (!quota.allowed) { addToast(quota.reason!, "info"); return; }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            const src = `data:image/png;base64,${res.imageData}`;
            setMemoryAidImage(src);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis aide-mémoire généré !", "success");
        } catch (e: any) { addToast(e.message, "error"); } finally { setIsGeneratingImage(false); }
    };

    const downloadSketch = () => {
        if (!memoryAidImage) return;
        const link = document.createElement('a');
        link.href = memoryAidImage;
        
        // Raccourcissement du nom : format "Memoraid-croquis-[mot]" ou "Memoraid-sketchnote-[mot]"
        const oneWord = capsule.title.split(/\s+/)[0].replace(/[^a-z0-9]/gi, '') || 'Sujet';
        const prefix = language === 'fr' ? 'Memoraid-croquis' : 'Memoraid-sketchnote';
        
        link.download = `${prefix}-${oneWord.toLowerCase()}.png`;
        link.click();
    };

    const Toolbox = () => (
        <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 animate-fade-in shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">
                {t('advanced_export')} & APPRENTISSAGE
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button onClick={onStartFlashcards} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-emerald-100 dark:border-emerald-900/50"><LayersIcon className="w-5 h-5" /> Flashcards</button>
                <button onClick={onStartCoaching} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-blue-100 dark:border-blue-900/50"><MessageSquareIcon className="w-5 h-5" /> Coach IA</button>
                <button onClick={() => downloadCapsulePdf(capsule)} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-slate-200 dark:border-zinc-700"><FileTextIcon className="w-5 h-5" /> Fiche PDF</button>
                <button onClick={() => downloadFlashcardsPdf(capsule)} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-slate-200 dark:border-zinc-700"><PrinterIcon className="w-5 h-5" /> {t('export_cards')}</button>
                <button onClick={() => exportToPPTX(capsule)} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-slate-200 dark:border-zinc-700"><PresentationIcon className="w-5 h-5" /> PowerPoint</button>
                <button onClick={() => downloadQuizPdf(capsule)} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-[10px] hover:shadow-md transition-all border border-slate-200 dark:border-zinc-700"><CheckSquareIcon className="w-5 h-5" /> Quiz PDF</button>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in pb-20">
            <button onClick={onBackToList} className="md:hidden flex items-center gap-1 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 w-full border-b border-slate-100 dark:border-zinc-800"><ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}</button>
            
            <div className="p-6 md:p-10">
                <div className="mb-10">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{capsule.title}</h2>
                        <div className="flex gap-2">
                             <button onClick={() => setShowShareMenu(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" title="Partager"><Share2Icon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="relative">
                        <p className="text-base md:text-lg text-slate-600 dark:text-zinc-300 pr-12 leading-relaxed">{capsule.summary}</p>
                        <button onClick={() => handleToggleSpeech('summary', capsule.summary)} className="absolute top-0 right-0 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full" title="Lire le résumé">
                            {isBuffering === 'summary' ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : speakingId === 'summary' ? <StopCircleIcon className="w-5 h-5 text-emerald-500" /> : <Volume2Icon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-16">
                    {/* 1. CONCEPTS CLÉS */}
                    <div>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><LightbulbIcon className="w-6 h-6 mr-3 text-amber-500" /> {t('key_concepts')}</h3>
                        <div className="grid gap-5">
                            {capsule.keyConcepts.map((c, i) => (
                                <div key={i} className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:shadow-sm transition-shadow">
                                    <p className="font-bold text-xl text-slate-900 dark:text-white mb-2">{c.concept}</p>
                                    <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">{c.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. EXEMPLES PRATIQUES */}
                    {capsule.examples && capsule.examples.length > 0 && (
                        <div>
                            <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ListChecksIcon className="w-6 h-6 mr-3 text-blue-500" /> {t('examples')}</h3>
                            <div className="grid gap-3">
                                {capsule.examples.map((ex, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        <p className="text-slate-700 dark:text-zinc-300">{ex}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. SECRET DE MÉMORISATION - MNÉMOTECHNIQUE */}
                    <div className="animate-fade-in scroll-mt-20">
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ZapIcon className="w-6 h-6 mr-3 text-orange-500" /> {t('mnemonic_title')}</h3>
                        {mnemonic ? (
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-8 rounded-3xl border border-orange-200 dark:border-orange-800 relative group text-center shadow-inner">
                                <blockquote className="text-xl md:text-3xl font-serif italic text-slate-800 dark:text-zinc-100 leading-relaxed">"{mnemonic}"</blockquote>
                                <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
                                        <RefreshCwIcon className={`w-3 h-3 ${isGeneratingMnemonic ? 'animate-spin' : ''}`} /> {t('regenerate')}
                                    </button>
                                </div>
                                <div className="absolute -top-4 -left-4 bg-white dark:bg-zinc-800 p-2.5 rounded-full border border-orange-200 dark:border-orange-800 shadow-sm">
                                    <SparklesIcon className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>
                        ) : (
                            <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-10 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-3xl text-orange-600 dark:text-orange-400 font-bold flex flex-col items-center justify-center gap-3 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors group">
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
                                    {isGeneratingMnemonic ? <RefreshCwIcon className="w-8 h-8 animate-spin"/> : <ZapIcon className="w-8 h-8"/>}
                                </div>
                                <div className="text-center">
                                    <p className="text-lg">{isGeneratingMnemonic ? t('generating_mnemonic') : t('generate_mnemonic')}</p>
                                    <p className="text-sm font-medium opacity-60">{t('mnemonic_subtitle')}</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* 4. CROQUIS AIDE-MÉMOIRE */}
                    <div>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ImageIcon className="w-6 h-6 mr-3 text-violet-500" /> {t('memory_aid_sketch')}</h3>
                        {isPremium ? (
                            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800 p-4 shadow-inner">
                                {memoryAidImage ? (
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-2xl border border-slate-200 shadow-md overflow-hidden relative group">
                                            <img src={memoryAidImage} alt="Sketch aide-mémoire" className="w-full h-auto rounded-xl hover:scale-[1.01] transition-transform cursor-zoom-in"/>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={downloadSketch} className="p-2 bg-white/90 dark:bg-zinc-800/90 rounded-full shadow-lg text-emerald-600 hover:text-emerald-700 transition-colors" title="Télécharger l'image">
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <button onClick={() => setMemoryAidImage(null)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider">{t('erase')}</button>
                                            <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="text-xs font-bold text-violet-500 hover:underline flex items-center gap-1 uppercase tracking-widest">
                                                <RefreshCwIcon className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`}/> {t('regenerate')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 dark:text-zinc-400 mb-2 max-w-xs mx-auto text-base">{t('sketch_placeholder_text')}</p>
                                        
                                        {/* AVERTISSEMENT DISCRET */}
                                        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 italic mb-6">
                                            <AlertCircleIcon className="w-3 h-3 flex-shrink-0" />
                                            {t('sketch_warning')}
                                        </p>

                                        <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 mx-auto transform active:scale-95">
                                            {isGeneratingImage ? <RefreshCwIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                                            {isGeneratingImage ? t('sketching') : t('generate_sketch')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-3xl border border-amber-200 dark:border-amber-800/30 text-center">
                                <LockIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h4 className="font-bold text-amber-800 dark:text-amber-400 text-lg">{t('premium_features')}</h4>
                                <p className="text-sm text-amber-700 mb-6 max-w-sm mx-auto">{t('sketch_premium_only')}</p>
                                <button 
                                    onClick={onNavigateToProfile}
                                    className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition-colors uppercase tracking-wide"
                                >
                                    {t('activate_in_profile')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 5. QUIZ FINAL */}
                    <div className="pt-8 border-t border-slate-100 dark:border-zinc-800">
                        <Quiz questions={capsule.quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} />
                    </div>

                    {/* 6. BOÎTE À OUTILS - EXPORT & APPRENTISSAGE (SOUS LE QUIZ) */}
                    <Toolbox />
                </div>
            </div>

            {showShareMenu && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowShareMenu(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between font-bold">
                            <h3 className="text-slate-800 dark:text-white">{t('share_group')}</h3>
                            <button onClick={() => setShowShareMenu(false)}><XIcon className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {userGroups.length > 0 ? userGroups.map(g => (
                                <button key={g.id} onClick={() => { onShareCapsule(g, capsule); setShowShareMenu(false); addToast("Partagé !", "success"); }} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 mb-1">
                                    {g.name}
                                </button>
                            )) : <p className="p-8 text-sm text-slate-400 italic text-center">Aucun groupe créé.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapsuleView;
