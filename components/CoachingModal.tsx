
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CognitiveCapsule, ChatMessage, CoachingMode, UserProfile } from '../types';
import { createCoachingSession, getAiClient } from '../services/geminiService';
import { XIcon, SendIcon, SparklesIcon, MicrophoneIcon, ImageIcon, Volume2Icon } from '../constants';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { GoogleGenAI, Modality } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';

// Interfaces for Web Speech API
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
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

// Helper functions for audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
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

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const stopRequestRef = useRef<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasLastInputFromSpeech = useRef<boolean>(false);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            } catch (e) {
                console.error("Web Audio API is not supported.", e);
            }
        }
    }, []);

    const initializeChat = useCallback(async () => {
        setIsLoading(true);
        setMessages([]);
        try {
            const session = createCoachingSession(capsule, selectedMode, userProfile, language);
            setChatSession(session);
            
            let introMsg = "";
            if (selectedMode === 'solver') introMsg = language === 'fr' ? "Bonjour. Quel exercice ou problème souhaitez-vous résoudre aujourd'hui ? Vous pouvez envoyer une photo." : "Hello. What exercise or problem would you like to solve today? You can upload a photo.";
            else introMsg = "";

            const initialResponse: GenerateContentResponse = await session.sendMessage({ message: introMsg });
            const text = initialResponse.text || (language === 'fr' ? "Bonjour, je suis prêt." : "Hello, I am ready.");
            setMessages([{ role: 'model', content: text }]);
            
            if (selectedMode === 'oral') {
                playTTS(text);
            }
        } catch (error) {
            console.error("Failed to initialize coaching session:", error);
            const errMsg = language === 'fr' ? "Erreur de connexion au coach." : "Connection error with coach.";
            setMessages([{ role: 'model', content: errMsg }]);
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
    }, [initializeChat]);

    const stopAudio = useCallback(() => {
        stopRequestRef.current = true;
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch(e) {}
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
    }, []);

    const playTTS = async (text: string) => {
        if (!audioContextRef.current) return;
        
        // 1. ARRÊT TOTAL de toute lecture précédente (évite les doublons)
        stopAudio();
        stopRequestRef.current = false;

        // 2. ACTIVATION AUDIO FOCUS (MEDIA SESSION API)
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: "Coach Memoraid",
                artist: capsule.title,
                album: t('mode_coach'),
                artwork: [{ src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }]
            });
            navigator.mediaSession.setActionHandler('pause', () => stopAudio());
            navigator.mediaSession.setActionHandler('stop', () => stopAudio());
        }

        const chunks = text.split(/(?<=[.!?])\s+/).filter(c => c.trim().length > 0);
        if (chunks.length === 0) return;

        const ai = getAiClient();

        const playChunkSequence = async (index: number) => {
            if (index >= chunks.length || stopRequestRef.current) {
                if ("mediaSession" in navigator) navigator.mediaSession.playbackState = 'none';
                return;
            }

            try {
                if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: chunks[index] }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                        },
                    },
                });

                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                
                // Double vérification si stopAudio a été appelé pendant le fetch
                if (!base64Audio || stopRequestRef.current) return;

                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current!, 24000, 1);
                
                // On vérifie encore une fois avant de lancer le son
                if (stopRequestRef.current) return;

                const source = audioContextRef.current!.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current!.destination);
                
                source.onended = () => {
                    if (!stopRequestRef.current) playChunkSequence(index + 1);
                };

                // Indiquer au système que Memoraid prend le contrôle
                if ("mediaSession" in navigator) navigator.mediaSession.playbackState = 'playing';
                
                source.start();
                audioSourceRef.current = source;

            } catch (e) {
                console.error("TTS Error", e);
                stopAudio();
            }
        };

        playChunkSequence(0);
    };

    const cleanTranscription = (text: string): string => {
        return text
            .replace(/\b(euh+|hum+|ben|bah|genre|bref|enfin|um+|uh+|like|you know)\b/gi, '')
            .replace(/\s+/g, ' ')
            .replace(/\s+([.,!?])/g, '$1')
            .trim()
            .replace(/^\w/, c => c.toUpperCase());
    };

    const startRecording = useCallback(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            addToast("Microphone non supporté.", "error");
            return;
        }
        if (recognitionRef.current) recognitionRef.current.abort();
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
        if (textareaRef.current) textareaRef.current.blur();
        setTempSpeech('');
        wasLastInputFromSpeech.current = true; 
        setRecognitionState('recording');
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            setTempSpeech(cleanTranscription(transcript));
        };
        recognition.onerror = () => {
            stopRecording();
            setRecognitionState('error');
        };
        recognition.onend = () => { if (recognitionState === 'recording') stopRecording(); };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { setRecognitionState('error'); }
    }, [language, addToast, recognitionState]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setRecognitionState('idle');
        if (tempSpeech) {
            setUserInput(prev => {
                const prefix = prev.trim();
                const suffix = tempSpeech.trim();
                return prefix ? prefix + " " + suffix : suffix;
            });
            setTempSpeech('');
        }
    }, [tempSpeech]);

    const handleToggleRecording = () => recognitionState === 'recording' ? stopRecording() : startRecording();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recognitionState === 'recording') stopRecording();
        const finalInput = (userInput + (userInput && tempSpeech ? ' ' : '') + tempSpeech).trim();
        if ((!finalInput && !selectedImage) || !chatSession || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', content: finalInput, image: selectedImage || undefined };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setTempSpeech('');
        setSelectedImage(null);
        setIsLoading(true);
        try {
            let messageParts: any[] = [];
            if (userMessage.image) {
                messageParts.push({ inlineData: { mimeType: "image/jpeg", data: userMessage.image.split(',')[1] } });
            }
            if (userMessage.content) messageParts.push({ text: userMessage.content });
            const response = await chatSession.sendMessage({ 
                message: messageParts.length === 1 && messageParts[0].text ? messageParts[0].text : { parts: messageParts }
            } as any);
            const responseText = response.text;
            setMessages(prev => [...prev, { role: 'model', content: responseText }]);
            if (selectedMode === 'oral') playTTS(responseText);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Erreur de traitement." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const isRecording = recognitionState === 'recording';
    const displayValue = isRecording ? (userInput + (userInput && tempSpeech ? ' ' : '') + tempSpeech) : userInput;
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
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                            <XIcon className="w-6 h-6 text-slate-500 dark:text-zinc-400" />
                        </button>
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
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 inline-block">...</div>}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        {selectedMode === 'solver' && (
                            <>
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl"><ImageIcon className="w-5 h-5" /></button>
                            </>
                        )}
                        <div className="flex-grow relative">
                             <textarea
                                ref={textareaRef}
                                value={displayValue}
                                onChange={(e) => !isRecording && setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage(e))}
                                placeholder={isRecording ? "Écoute..." : "Message..."}
                                className="w-full pl-4 pr-10 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl resize-none"
                                rows={1}
                            />
                             <button type="button" onClick={handleToggleRecording} className={`absolute right-2 bottom-2 p-1.5 ${isRecording ? 'text-red-600' : 'text-slate-400'}`}><MicrophoneIcon className="w-5 h-5" /></button>
                        </div>
                        <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 text-white rounded-xl"><SendIcon className="w-5 h-5" /></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default CoachingModal;
