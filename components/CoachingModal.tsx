import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CognitiveCapsule, ChatMessage, CoachingMode, UserProfile } from '../types';
import { createCoachingSession } from '../services/geminiService';
import { XIcon, SendIcon, SparklesIcon, MicrophoneIcon, ImageIcon, Volume2Icon } from '../constants';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { GoogleGenAI, Modality } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import { checkTtsAvailability, recordTtsSuccess, triggerTtsSafetyLock } from '../services/quotaManager';
import { cleanDictationResult } from '../services/voiceUtils';

interface SpeechRecognitionAPI extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => any) | null;
    onresult: ((ev: any) => any) | null;
    onerror: ((ev: any) => any) | null;
    onend: (() => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface CoachingModalProps {
    capsule: CognitiveCapsule;
    onClose: () => void;
    userProfile: UserProfile;
}

type RecognitionState = 'idle' | 'recording' | 'error';

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
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const CoachingModal: React.FC<CoachingModalProps> = ({ capsule, onClose, userProfile }) => {
    const { language, t } = useLanguage();
    const { addToast } = useToast();
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [tempSpeech, setTempSpeech] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
    const [selectedMode, setSelectedMode] = useState<CoachingMode>('standard');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const recognitionRef = useRef<SpeechRecognitionAPI | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const stopRequestRef = useRef<boolean>(false);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);
    const currentSpeedRef = useRef<number>(1);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const stopAudio = useCallback(() => {
        stopRequestRef.current = true;
        activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
            source.disconnect();
        });
        activeSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        if (silentAudioRef.current) {
            silentAudioRef.current.pause();
            silentAudioRef.current.currentTime = 0;
        }
    }, []);

    useEffect(() => {
        const handleStopAll = (e: any) => {
            if (e.detail?.origin === 'coach-ai') return;
            stopAudio();
        };
        window.addEventListener('memoraid-stop-audio', handleStopAll);
        return () => {
            window.removeEventListener('memoraid-stop-audio', handleStopAll);
            stopAudio();
        };
    }, [stopAudio]);

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

    useEffect(() => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
    }, []);

    const playTTS = async (text: string) => {
        if (!audioContextRef.current) return;
        window.dispatchEvent(new CustomEvent('memoraid-stop-audio', { detail: { origin: 'coach-ai' } }));
        
        const availability = checkTtsAvailability(!!userProfile.isPremium);
        if (!availability.available) {
            const msg = availability.code === 'QUOTA' ? t('error_vocal_quota') : availability.reason!;
            addToast(msg, "info");
            return;
        }

        stopRequestRef.current = false;
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        if (!silentAudioRef.current) {
            silentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==');
            silentAudioRef.current.loop = true;
        }
        try { await silentAudioRef.current.play(); } catch (e) {}

        const allChunks = text.split(/[.!?]+\s+/).filter(c => c.trim().length > 0);
        const limit = availability.maxChunks || 8;
        const chunks = allChunks.slice(0, limit);
        if (chunks.length === 0) return;

        nextStartTimeRef.current = audioContextRef.current.currentTime + 0.05;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const playChunkSequence = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) return;
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: chunks[index] }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    },
                });

                const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (!base64Audio || stopRequestRef.current) return;

                const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current!, 24000, 1);
                if (stopRequestRef.current) return;

                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = currentSpeedRef.current;
                source.connect(audioContextRef.current!.destination);

                const now = audioContextRef.current!.currentTime;
                const startTime = Math.max(now + 0.02, nextStartTimeRef.current);
                
                source.start(startTime);
                activeSourcesRef.current.add(source);
                nextStartTimeRef.current = startTime + (buffer.duration / currentSpeedRef.current);

                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0 && index === chunks.length - 1) {
                         if (silentAudioRef.current) silentAudioRef.current.pause();
                    }
                };

                recordTtsSuccess();
                // Pré-chargement récursif
                playChunkSequence(index + 1);

            } catch (e: any) {
                console.error("Coach TTS Error", e);
                const errorStr = e?.message || "";
                if (errorStr.includes('429')) triggerTtsSafetyLock();
            }
        };
        playChunkSequence(0);
    };

    const initializeChat = useCallback(async () => {
        setIsLoading(true);
        setMessages([]);
        try {
            const session = createCoachingSession(capsule, selectedMode, userProfile, language);
            setChatSession(session);
            
            let introMsg = "";
            if (selectedMode === 'solver') introMsg = language === 'fr' ? "Bonjour. Quel exercice ou problème souhaitez-vous résoudre aujourd'hui ?" : "Hello. What exercise or problem would you like to solve today?";
            else introMsg = "";

            const initialResponse: GenerateContentResponse = await session.sendMessage({ message: introMsg });
            const text = initialResponse.text || (language === 'fr' ? "Bonjour, je suis prêt." : "Hello, I am ready.");
            setMessages([{ role: 'model', content: text }]);
            
            if (selectedMode === 'oral' && checkTtsAvailability(!!userProfile.isPremium).available) {
                playTTS(text);
            }
        } catch (error) {
            setMessages([{ role: 'model', content: language === 'fr' ? "L'IA est indisponible." : "AI unavailable." }]);
        } finally {
            setIsLoading(false);
        }
    }, [capsule, selectedMode, userProfile, language]);

    useEffect(() => {
        initializeChat();
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            stopAudio();
        };
    }, [initializeChat, stopAudio]);
    
    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { addToast(t('micro_not_supported'), "error"); return; }
        if (recognitionRef.current) recognitionRef.current.abort();
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
        setTempSpeech('');
        setRecognitionState('recording');
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) interimTranscript += event.results[i][0].transcript;
            setTempSpeech(interimTranscript);
        };
        recognition.onerror = () => { setRecognitionState('error'); stopRecording(); };
        recognition.onend = () => setRecognitionState('idle');
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { setRecognitionState('idle'); }
    };

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setRecognitionState('idle');
        if (tempSpeech) {
            const cleaned = cleanDictationResult(tempSpeech, language);
            if (cleaned) {
                setUserInput(prev => {
                    const prefix = prev.trim();
                    if (!prefix) return cleaned;
                    return prefix + (!/[.!?]$/.test(prefix) ? ". " : " ") + cleaned;
                });
            }
            setTempSpeech('');
        }
    }, [tempSpeech, language]);

    const toggleRecording = () => recognitionState === 'recording' ? stopRecording() : startRecording();

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recognitionState === 'recording') stopRecording();
        const finalInput = (userInput + (userInput.trim() && tempSpeech ? ' ' : '') + tempSpeech).trim();
        if ((!finalInput && !selectedImage) || !chatSession || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', content: finalInput, image: selectedImage || undefined };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setTempSpeech('');
        setSelectedImage(null);
        setIsLoading(true);
        try {
            let messageParts: any[] = [];
            if (userMessage.image) messageParts.push({ inlineData: { mimeType: "image/jpeg", data: userMessage.image.split(',')[1] } });
            if (userMessage.content) messageParts.push({ text: userMessage.content });
            const response = await chatSession.sendMessage({ 
                message: messageParts.length === 1 && messageParts[0].text ? messageParts[0].text : { parts: messageParts }
            } as any);
            const responseText = response.text;
            setMessages(prev => [...prev, { role: 'model', content: responseText }]);
            if (selectedMode === 'oral') playTTS(responseText);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Erreur IA. Réessayez." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const isRecording = recognitionState === 'recording';
    const displayValue = isRecording ? (userInput + (userInput.trim() && tempSpeech ? ' ' : '') + tempSpeech) : userInput;
    const modes: { id: CoachingMode, label: string, icon: any }[] = [
        { id: 'standard', label: 'Coach', icon: SparklesIcon },
        { id: 'oral', label: 'Oral', icon: MicrophoneIcon },
        { id: 'exam', label: 'Examen', icon: SendIcon },
        { id: 'solver', label: 'Résolveur', icon: ImageIcon },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">
                <header className="flex flex-col border-b border-slate-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900 z-10">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Coach IA</h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 truncate max-w-xs">{capsule.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={togglePlaybackSpeed} className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 transition-colors hover:bg-slate-200">
                                {playbackSpeed}x
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                <XIcon className="w-6 h-6 text-slate-500 dark:text-zinc-400" />
                            </button>
                        </div>
                    </div>
                    <div className="flex px-4 pb-3 gap-2 overflow-x-auto no-scrollbar">
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                    selectedMode === mode.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800'
                                }`}
                            >
                                <mode.icon className="w-3 h-3" />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </header>
                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-zinc-950/30">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-4 h-4 text-white"/></div>}
                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800'
                            }`}>
                                {msg.image && <img src={msg.image} alt="Upload" className="max-w-full h-auto rounded-lg mb-2" />}
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                {msg.role === 'model' && (
                                    <button 
                                        onClick={() => playTTS(msg.content)} 
                                        className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600"
                                    >
                                        <Volume2Icon className="w-3 h-3" /> {t('listen_all')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 inline-block animate-pulse">...</div>}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <div className="flex-grow relative">
                             <button
                                type="button"
                                onClick={toggleRecording}
                                className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors z-10 ${recognitionState === 'recording' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                             >
                                <MicrophoneIcon className="w-5 h-5" />
                             </button>
                             <textarea
                                value={displayValue}
                                onChange={(e) => !isRecording && setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage(e))}
                                placeholder={isRecording ? "Écoute..." : "Message..."}
                                className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                rows={1}
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 text-white rounded-xl active:scale-95 transition-transform"><SendIcon className="w-5 h-5" /></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default CoachingModal;