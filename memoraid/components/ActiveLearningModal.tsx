import React, { useState, useMemo, useEffect } from 'react';
import type { CognitiveCapsule, KeyConcept, QuizQuestion } from '../types';
import { XIcon, LightbulbIcon, ListChecksIcon, PlayIcon, RefreshCwIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface ActiveLearningModalProps {
    capsule: CognitiveCapsule;
    onClose: () => void;
}

interface LearningStep {
    type: 'concept' | 'quiz';
    data: KeyConcept | QuizQuestion;
}

const ActiveLearningModal: React.FC<ActiveLearningModalProps> = ({ capsule, onClose }) => {
    const { t } = useLanguage();
    const [sessionState, setSessionState] = useState<'intro' | 'learning' | 'complete'>('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const steps = useMemo((): LearningStep[] => {
        const conceptSteps: LearningStep[] = capsule.keyConcepts.map(kc => ({
            type: 'concept',
            data: kc,
        }));
        const quizSteps: LearningStep[] = capsule.quiz.map(q => ({
            type: 'quiz',
            data: q,
        }));
        return [...conceptSteps, ...quizSteps];
    }, [capsule]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
            const nextButton = document.getElementById('next-step-button');
            if(nextButton && !nextButton.hasAttribute('disabled')) {
                nextButton.click();
            }
          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);

    const handleNext = () => {
        if (currentIndex < steps.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            const container = document.getElementById('learning-scroll-container');
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setSessionState('complete');
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setSessionState('learning');
    };

    const handleCheckAnswer = () => {
        if (selectedAnswer) {
            setShowResult(true);
        }
    };
    
    const getOptionClass = (option: string, correctAnswer: string) => {
        if (!showResult) {
            return selectedAnswer === option
                ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 ring-1 ring-emerald-500 text-emerald-800 dark:text-emerald-200"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700";
        }
        const isCorrect = option === correctAnswer;
        const isSelected = option === selectedAnswer;
        if (isCorrect) return "bg-emerald-100 dark:bg-emerald-900 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500";
        if (isSelected) return "bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200";
        return "bg-slate-50 dark:bg-zinc-700 border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 opacity-70";
    };

    const renderContent = () => {
        if (sessionState === 'intro') {
            return (
                <div className="text-center p-8 flex flex-col items-center pt-12">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                        <PlayIcon className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('active_learning_session')}</h2>
                    <p className="text-slate-600 dark:text-zinc-300 mb-8 leading-relaxed whitespace-pre-line">
                        {t('active_learning_intro')
                            .replace('{title}', capsule.title)
                            .replace('{concepts}', capsule.keyConcepts.length.toString())
                            .replace('{questions}', capsule.quiz.length.toString())}
                    </p>
                    <button
                        onClick={() => setSessionState('learning')}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-lg shadow-lg shadow-emerald-200/50 dark:shadow-none"
                    >
                        {t('active_learning_start')}
                    </button>
                </div>
            );
        }

        if (sessionState === 'complete') {
            return (
                <div className="text-center p-8 flex flex-col items-center pt-12">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('active_learning_complete')}</h2>
                    <p className="text-slate-600 dark:text-zinc-300 mb-6">
                       {t('active_learning_complete_desc').replace('{title}', capsule.title)}
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleRestart}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors font-semibold"
                        >
                            <RefreshCwIcon className="w-5 h-5"/>
                            {t('restart')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                        >
                            {t('active_learning_finish')}
                        </button>
                    </div>
                </div>
            );
        }
        
        if (sessionState === 'learning' && steps.length > 0) {
            const currentStep = steps[currentIndex];
            const isQuiz = currentStep.type === 'quiz';
            const quizData = isQuiz ? (currentStep.data as QuizQuestion) : null;
            const conceptData = !isQuiz ? (currentStep.data as KeyConcept) : null;
            const canProceed = isQuiz ? showResult : true;

            return (
                <div className="p-6 md:p-10 flex-grow flex flex-col pt-4 pb-24">
                    <div className="flex-grow">
                        {isQuiz ? (
                            <div className="animate-fade-in-fast">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
                                        <ListChecksIcon className="w-5 h-5 text-sky-600 dark:text-sky-400"/>
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">{t('quiz_question')}</h3>
                                </div>
                                <p className="text-slate-700 dark:text-zinc-100 mb-8 font-black text-xl md:text-2xl leading-tight">{quizData?.question}</p>
                                <div className="space-y-3 mb-8">
                                    {quizData?.options.map((option) => (
                                        <button 
                                            key={option} 
                                            onClick={() => !showResult && setSelectedAnswer(option)}
                                            disabled={showResult}
                                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 font-bold text-lg ${getOptionClass(option, quizData.correctAnswer)}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                {showResult && (
                                    <div className={`p-6 rounded-2xl mb-12 border-l-8 animate-fade-in-fast ${selectedAnswer === quizData?.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-950 border-l-emerald-500 text-emerald-900 dark:text-emerald-100' : 'bg-red-50 dark:bg-red-950 border-l-red-500 text-red-900 dark:text-red-100'}`}>
                                        <h4 className={`font-black uppercase text-xs tracking-widest mb-2 ${selectedAnswer === quizData?.correctAnswer ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                            {selectedAnswer === quizData?.correctAnswer ? t('correct_answer') : t('wrong_answer')}
                                        </h4>
                                        <p className="text-base font-medium leading-relaxed opacity-90">{quizData?.explanation}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="animate-fade-in-fast">
                                <div className="flex items-center gap-3 mb-8">
                                     <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                        <LightbulbIcon className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{t('key_concept')}</h3>
                                </div>
                                <div className="p-8 md:p-12 bg-slate-50 dark:bg-zinc-900/50 rounded-[40px] border border-slate-200 dark:border-zinc-800 shadow-inner">
                                    <p className="font-black text-slate-900 dark:text-white text-2xl md:text-4xl mb-6 leading-tight tracking-tighter">{conceptData?.concept}</p>
                                    <p className="text-slate-600 dark:text-zinc-300 text-lg md:text-2xl leading-relaxed font-medium">{conceptData?.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-12 flex-shrink-0">
                        {isQuiz && !showResult && (
                            <button
                                onClick={handleCheckAnswer}
                                disabled={!selectedAnswer}
                                className="w-full px-6 py-5 bg-emerald-600 text-white rounded-[24px] hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-emerald-500/20"
                            >
                                {t('check_answer')}
                            </button>
                        )}
                        {canProceed && (
                            <button
                                id="next-step-button"
                                onClick={handleNext}
                                className="w-full px-6 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-[24px] hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors font-black uppercase text-sm tracking-[0.2em] shadow-2xl"
                            >
                               {currentIndex === steps.length - 1 ? t('active_learning_finish') : t('next')}
                            </button>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const progress = steps.length > 0 ? ((currentIndex + (sessionState === 'complete' ? 1 : 0)) / steps.length) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center md:p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-zinc-950 w-full md:rounded-[48px] shadow-2xl md:max-w-3xl h-full md:max-h-[90vh] flex flex-col overflow-hidden border border-white/5">
                <header className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950 z-20">
                    <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/30">
                            <PlayIcon className="w-6 h-6"/>
                         </div>
                         <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('mode_active')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate max-w-[150px] md:max-w-none">{capsule.title}</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Fermer">
                        <XIcon className="w-8 h-8 text-slate-400" />
                    </button>
                </header>

                {sessionState === 'learning' && (
                    <div className="px-8 md:px-12 pt-8 flex-shrink-0 bg-white dark:bg-zinc-950">
                        <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-600">
                           <span>{t('progression')}</span>
                           <span className="text-emerald-500">{currentIndex + 1} / {steps.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
                
                <main id="learning-scroll-container" className="flex-grow overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default ActiveLearningModal;