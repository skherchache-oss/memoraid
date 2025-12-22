
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SparklesIcon, XIcon, UploadIcon, AlertTriangleIcon, RefreshCwIcon, ImageIcon, BookOpenIcon, MicrophoneIcon, LearningIllustration, StopIcon } from '../constants';
import ImportModal from './ImportModal';
import type { SourceType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import { useToast } from '../hooks/useToast';
import HowItWorks from './HowItWorks';
import { cleanDictationResult } from '../services/voiceUtils';

interface InputAreaProps {
    onGenerate: (text: string, sourceType?: SourceType) => void;
    onGenerateFromFile: (file: File, sourceType?: SourceType) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
    onClearError: () => void;
    onOpenProfile?: () => void;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (() => any) | null;
    onend: (() => any) | null;
    onresult: ((ev: any) => any) | null;
    onerror: ((ev: any) => any) | null;
}

const MAX_DOC_SIZE_MB = 5;

// Clés des étapes de chargement pour la traduction
const LOADING_STEP_KEYS = [
    'loading_step_1',
    'loading_step_2',
    'loading_step_3',
    'loading_step_4',
    'loading_step_5',
    'loading_step_6',
    'loading_step_7'
] as const;

const InputArea: React.FC<InputAreaProps> = ({ onGenerate, onGenerateFromFile, onCancel, isLoading, error, onClearError, onOpenProfile }) => {
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedSourceType, setSelectedSourceType] = useState<SourceType | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [isRecording, setIsRecording] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Effet pour faire défiler les messages de chargement
    useEffect(() => {
        let interval: number;
        if (isLoading) {
            setLoadingStepIndex(0);
            interval = window.setInterval(() => {
                setLoadingStepIndex(prev => (prev + 1) % LOADING_STEP_KEYS.length);
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
        if (currentTranscript) {
            const cleaned = cleanDictationResult(currentTranscript, language);
            if (cleaned) {
                setInputText(prev => {
                    const prefix = prev.trim();
                    if (!prefix) return cleaned;
                    const separator = !/[.!?]$/.test(prefix) ? ". " : " ";
                    return prefix + separator + cleaned;
                });
            }
            setCurrentTranscript('');
        }
    }, [currentTranscript, language]);

    const startRecording = () => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            addToast(t('micro_not_supported'), "error");
            return;
        }
        if (recognitionRef.current) recognitionRef.current.abort();
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true; 
        recognition.interimResults = true; 
        recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
        if (textareaRef.current) textareaRef.current.blur();
        setCurrentTranscript('');
        setIsRecording(true);
        recognition.onstart = () => { setSelectedSourceType('speech'); onClearError(); };
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) interimTranscript += event.results[i][0].transcript;
            setCurrentTranscript(interimTranscript);
        };
        recognition.onerror = (event: any) => { if (event.error !== 'no-speech') { addToast(t('micro_denied'), "error"); stopRecording(); } };
        recognition.onend = () => { if (isRecording) setIsRecording(false); };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { setIsRecording(false); }
    };

    const toggleRecording = () => isRecording ? stopRecording() : startRecording();

    const clearFile = () => {
        setSelectedFile(null);
        setSelectedSourceType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        onClearError();
        setParseError(null);
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
        if (!isImage && file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
            setParseError(t('error_file_size'));
            return;
        }
        setSelectedFile(file);
        setSelectedSourceType(isImage ? 'ocr' : 'pdf');
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isRecording) stopRecording();
        setTimeout(() => {
            const finalContent = inputText.trim();
            if (selectedFile) {
                onGenerateFromFile(selectedFile, selectedSourceType || undefined);
            } else if (finalContent) {
                onGenerate(finalContent, selectedSourceType === 'speech' ? 'speech' : undefined);
                setInputText('');
            }
        }, 300);
    };

    const displayValue = isRecording ? (inputText + (inputText.trim() && currentTranscript ? ' ' : '') + currentTranscript) : inputText;

    return (
        <div className="w-full pb-8">
            <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl shadow-xl border border-transparent dark:border-zinc-800 relative z-10 transition-all duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-emerald-900 dark:text-white mb-2 text-center tracking-tight">{t('create_capsule')}</h2>
                <p className="text-base md:text-lg text-slate-500 dark:text-zinc-400 mt-1 mb-6 text-center font-medium leading-relaxed">{t('input_instruction')}</p>
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800/50 animate-fade-in shadow-inner">
                        <div className="relative mb-10 scale-125">
                            <div className="w-24 h-24 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mb-3 text-center transition-all duration-500">
                            {t(LOADING_STEP_KEYS[loadingStepIndex] as any)}
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter">{t('analyzing')}</span>
                        </div>
                        <p className="text-slate-500 dark:text-zinc-400 text-center mb-10 max-w-sm">{t('loading_subtext')}</p>
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="flex items-center gap-3 px-10 py-3.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl hover:shadow-red-200/50 active:scale-95"
                        >
                            <StopIcon className="w-5 h-5" />
                            <span>{t('stop_generation')}</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                         <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={displayValue}
                                onChange={(e) => setInputText(e.target.value)}
                                readOnly={isRecording}
                                placeholder={isRecording ? t('input_placeholder_voice') : t('input_placeholder')}
                                className={`w-full h-48 md:h-64 p-6 text-lg rounded-2xl border transition-colors ${isRecording ? 'bg-red-50/50 border-red-200 focus:ring-red-500' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-emerald-500'} dark:text-white focus:outline-none focus:ring-2`}
                            />
                            {isRecording && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{t('recording')}</span>
                                </div>
                            )}
                         </div>
                        
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-3 border border-emerald-100 dark:border-zinc-700 rounded-xl text-emerald-700 dark:text-zinc-300 bg-emerald-50/50 hover:bg-emerald-100 transition-colors shadow-sm"><UploadIcon className="w-5 h-5"/><span>{t('file_button')}</span></button>
                            <button type="button" onClick={toggleRecording} className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-xl transition-colors shadow-sm ${isRecording ? 'border-red-500 bg-red-100 text-red-700' : 'border-emerald-100 dark:border-zinc-700 text-emerald-700 dark:text-zinc-300 bg-emerald-50/50 hover:bg-emerald-100'}`}><MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'text-red-600 animate-pulse' : ''}`}/><span>{isRecording ? t('stop_button') : t('dictate_button')}</span></button>
                            <button type="button" onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 border border-emerald-100 dark:border-zinc-700 rounded-xl text-emerald-700 dark:text-zinc-300 bg-emerald-50/50 hover:bg-emerald-100 shadow-sm"><BookOpenIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <input type="file" autoFocus={false} ref={fileInputRef} onChange={handleFileChange} className="sr-only" accept=".pdf,.txt,image/*" />

                        {selectedFile && (
                            <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                                <span className="text-sm font-medium truncate flex items-center gap-2"><ImageIcon className="w-4 h-4"/>{selectedFile.name}</span>
                                <button type="button" onClick={clearFile} className="text-green-600 hover:text-green-800"><XIcon className="w-5 h-5" /></button>
                            </div>
                        )}

                        <button type="submit" disabled={!displayValue.trim() && !selectedFile} className="w-full mt-8 flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"><SparklesIcon className="w-6 h-6"/>{t('generate_button')}</button>
                    </form>
                )}
                {(parseError || error) && <p className="text-red-500 mt-4 text-center text-sm font-bold bg-red-50 p-2 rounded">{parseError || error}</p>}
            </div>
            <div className="mt-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800 w-full relative z-10"><HowItWorks onOpenProfile={onOpenProfile} /></div>
            <div className="flex flex-col items-center justify-center mt-12 opacity-70 pointer-events-none"><LearningIllustration className="w-full max-w-[200px] h-auto" /><h1 className="mt-4 text-3xl font-extrabold text-emerald-800 dark:text-emerald-500">Memoraid</h1></div>
            {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={(c, t) => { setInputText(`TITRE: ${t}\n\n${c}`); handleSubmit(); }} />}
        </div>
    );
};

export default InputArea;
