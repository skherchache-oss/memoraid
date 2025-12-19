
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, Group } from '../types';
import Quiz from './Quiz';
import { LightbulbIcon, MessageSquareIcon, DownloadIcon, Volume2Icon, StopCircleIcon, RefreshCwIcon, ImageIcon, SparklesIcon, ChevronLeftIcon, Share2Icon, FileTextIcon, ZapIcon, LockIcon, PlayIcon, ListChecksIcon, LayersIcon } from '../constants';
import { generateMemoryAidDrawing, generateMnemonic } from '../services/geminiService';
import { downloadCapsulePdf, downloadFlashcardsPdf, downloadQuizPdf } from '../services/pdfService';
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

const CapsuleView: React.FC<CapsuleViewProps> = ({ capsule, addToast, onBackToList, onSetMemoryAid, onSetMnemonic, onMarkAsReviewed, onStartFlashcards, onStartCoaching, onNavigateToProfile, userGroups, onShareCapsule, currentUserId, isPremium }) => {
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

    // fullTextToRead : On EXCLUT le deepDive pour la lecture orale afin de rester synthétique
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

    const handleToggleSpeech = async () => {
        if (isSpeaking || isBuffering) { stopAudio(); return; }
        stopAudio();
        stopRequestRef.current = false;
        
        const avail = checkTtsAvailability(!!isPremium);
        if (!avail.available) { addToast(avail.reason!, 'info'); return; }
        
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        
        nextStartTimeRef.current = audioContextRef.current.currentTime;
        
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
                
                // Programmation ultra-précise pour supprimer les blancs (0.01s buffer)
                const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current!.currentTime + 0.01);
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
                
                // Préchargement récursif
                queueChunk(index + 1);
                
            } catch (e) {
                stopAudio();
                addToast("Vocal MEMORAID indisponible.", "error");
            }
        };
        
        queueChunk(0);
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
        const quota = checkImageQuota(capsule.id, !!isPremium);
        if (!quota.allowed) { addToast(quota.reason!, "info"); return; }
        setIsGeneratingImage(true);
        try {
            const res = await generateMemoryAidDrawing(capsule, language);
            setMemoryAidImage(`data:image/png;base64,${res.imageData}`);
            onSetMemoryAid(capsule.id, res.imageData, res.description);
            addToast("Croquis généré !", "success");
        } catch (e: any) { addToast(t('error_generation'), "error"); } finally { setIsGeneratingImage(false); }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800 overflow-hidden animate-fade-in pb-20">
            <button onClick={onBackToList} className="md:hidden flex items-center gap-1 p-4 text-sm font-semibold text-emerald-600 w-full border-b border-slate-100 dark:border-zinc-800"><ChevronLeftIcon className="w-5 h-5" /> {t('back_list')}</button>
            
            <div className="p-6 md:p-10">
                <div className="mb-8">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{capsule.title}</h2>
                        <button onClick={() => setShowShareMenu(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><Share2Icon className="w-5 h-5"/></button>
                    </div>
                    <p className="text-base md:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed mb-6">{capsule.summary}</p>
                    
                    {/* BANDEAU AUDIO - BRANDING MEMORAID EXCLUSIF */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isSpeaking ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200'}`}>
                                <Volume2Icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                                {isSpeaking ? t('reading_in_progress') : isBuffering ? t('voice_preparing') : t('full_reading_branding')}
                            </span>
                        </div>
                        <button onClick={handleToggleSpeech} className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-tighter transition-all shadow-md flex items-center gap-2 ${isSpeaking || isBuffering ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {isBuffering ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : isSpeaking ? <StopCircleIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            {isSpeaking || isBuffering ? t('stop') : t('listen_all')}
                        </button>
                    </div>
                </div>

                <div className="space-y-16">
                    <section>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><LightbulbIcon className="w-6 h-6 mr-3 text-amber-500" /> {t('key_concepts')}</h3>
                        <div className="grid gap-5">
                            {capsule.keyConcepts.map((c, i) => (
                                <div key={i} className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                                    <p className="font-bold text-xl text-slate-900 dark:text-white mb-2">{c.concept}</p>
                                    <p className="text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">{c.explanation}</p>
                                    
                                    {/* BLOC APPROFONDIR - CONTENU RICHE NON LU PAR LE TTS */}
                                    {c.deepDive && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <SparklesIcon className="w-3 h-3" /> {t('deep_dive_label')}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-zinc-400 italic leading-relaxed">
                                                {c.deepDive}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {capsule.examples && capsule.examples.length > 0 && (
                        <section>
                            <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ListChecksIcon className="w-6 h-6 mr-3 text-emerald-500" /> {t('examples')}</h3>
                            <div className="grid gap-4">
                                {capsule.examples.map((ex, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">{ex}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ZapIcon className="w-6 h-6 mr-3 text-orange-500" /> {t('mnemonic_title')}</h3>
                        {mnemonic ? (
                            <div className="bg-orange-50/50 dark:bg-orange-900/10 p-8 rounded-3xl border border-orange-200 dark:border-orange-800 text-center relative shadow-sm">
                                <p className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-zinc-100">"{mnemonic}"</p>
                                <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="mt-4 text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 mx-auto"><RefreshCwIcon className={`w-3 h-3 ${isGeneratingMnemonic ? 'animate-spin' : ''}`} /> {t('regenerate')}</button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateMnemonic} disabled={isGeneratingMnemonic} className="w-full py-10 border-2 border-dashed border-orange-200 rounded-3xl text-orange-600 font-bold hover:bg-orange-50 transition-colors">
                                {isGeneratingMnemonic ? t('generating_mnemonic') : t('generate_mnemonic')}
                            </button>
                        )}
                    </section>

                    <section>
                        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-zinc-100 mb-6"><ImageIcon className="w-6 h-6 mr-3 text-violet-500" /> {t('memory_aid_sketch')}</h3>
                        {isPremium ? (
                            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800 p-4">
                                {memoryAidImage ? (
                                    <div className="space-y-4">
                                        <img src={memoryAidImage} alt="Sketch" className="w-full h-auto rounded-xl shadow-md"/>
                                        <div className="flex gap-4">
                                            <button onClick={() => setMemoryAidImage(null)} className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase">{t('erase')}</button>
                                            <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="text-xs font-bold text-violet-500 hover:underline uppercase flex items-center gap-1"><RefreshCwIcon className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`}/> {t('regenerate')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4">
                                        <p className="text-slate-500 dark:text-zinc-400 mb-6">{t('sketch_placeholder_text')}</p>
                                        <button onClick={handleGenerateDrawing} disabled={isGeneratingImage} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md flex items-center gap-2 mx-auto">{isGeneratingImage ? <RefreshCwIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>} {t('generate_sketch')}</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-3xl border border-amber-200 dark:border-amber-800/30 text-center">
                                <LockIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" /><p className="text-sm text-amber-700 mb-6">{t('sketch_premium_only')}</p><button onClick={onNavigateToProfile} className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 uppercase transition-colors">{t('activate_in_profile')}</button>
                            </div>
                        )}
                    </section>

                    <div className="pt-8 border-t border-slate-100 dark:border-zinc-800">
                        <Quiz questions={capsule.quiz} onComplete={(s) => onMarkAsReviewed(capsule.id, s, 'quiz')} />
                    </div>

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
