
import React, { useState } from 'react';
import type { QuizQuestion } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ListChecksIcon } from '../constants';

interface QuizProps {
    questions: QuizQuestion[];
    onComplete?: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
    const { t } = useLanguage();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    // SÉCURITÉ : Si aucune question n'est fournie, on affiche un message au lieu de crasher
    if (!questions || questions.length === 0) {
        return (
            <div className="p-10 bg-slate-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-700 text-center">
                <ListChecksIcon className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-zinc-600" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium">
                    Ce module ne contient pas encore de quiz d'évaluation.
                </p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    // SÉCURITÉ : Vérification de l'existence de la question courante
    if (!currentQuestion) return null;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const handleSelectAnswer = (answer: string) => {
        if (showResult) return;
        setSelectedAnswer(answer);
    };

    const handleCheckAnswer = () => {
        if (selectedAnswer) {
            if (selectedAnswer === currentQuestion.correctAnswer) {
                setScore(s => s + 1);
            }
            setShowResult(true);
        }
    };
    
    const handleNextQuestion = () => {
        setShowResult(false);
        setSelectedAnswer(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            finishQuiz(score);
        }
    };
    
    const finishQuiz = (currentScore: number) => {
         setQuizFinished(true);
         if (onComplete) {
             const percentage = Math.round((currentScore / questions.length) * 100);
             onComplete(percentage);
         }
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setQuizFinished(false);
    }
    
    if (quizFinished) {
        return (
             <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xl text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ListChecksIcon className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('quiz_finished')}</h3>
                <p className="text-lg text-slate-500 dark:text-zinc-400 mb-8">
                    {t('your_score')} <span className="font-black text-emerald-600">{score} / {questions.length}</span>
                </p>
                <button 
                    onClick={handleRestartQuiz}
                    className="w-full sm:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-200/50"
                >
                    {t('restart')}
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm animate-fade-in">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                        <ListChecksIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('quiz_title')}</h3>
                </div>
                <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Question {currentQuestionIndex + 1} / {questions.length}
                </span>
            </header>

            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                {currentQuestion.question}
            </p>
            
            <div className="grid grid-cols-1 gap-3 mb-10">
                {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    let buttonClass = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 font-bold text-lg ";
                    
                    if (showResult) {
                        if (option === currentQuestion.correctAnswer) {
                            buttonClass += "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300";
                        } else if (isSelected) {
                            buttonClass += "bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300";
                        } else {
                            buttonClass += "bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 opacity-40";
                        }
                    } else {
                         buttonClass += isSelected 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]" 
                            : "bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 hover:border-emerald-300 text-slate-700 dark:text-zinc-300";
                    }

                    return (
                        <button key={index} onClick={() => handleSelectAnswer(option)} className={buttonClass} disabled={showResult}>
                            <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${isSelected ? 'bg-white text-emerald-600 border-white' : 'bg-slate-100 text-slate-400 border-slate-100'}`}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                {option}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {showResult && (
                <div className={`p-6 rounded-2xl mb-10 border-l-8 animate-fade-in-fast ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-emerald-500 text-emerald-900 dark:text-emerald-100' : 'bg-red-50 dark:bg-red-900/10 border-l-red-500 text-red-900 dark:text-red-100'}`}>
                    <h4 className="font-black uppercase text-xs tracking-widest mb-2">
                        {isCorrect ? t('correct_answer') : t('wrong_answer')}
                    </h4>
                    <p className="text-sm font-medium leading-relaxed opacity-80">{currentQuestion.explanation}</p>
                </div>
            )}

            <div className="flex justify-end">
                {!showResult ? (
                    <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedAnswer}
                        className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200/50"
                    >
                        {t('check_answer')}
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl hover:bg-slate-800 transition-all font-black uppercase text-xs tracking-widest shadow-xl"
                    >
                        {currentQuestionIndex < questions.length - 1 ? t('next_question') : t('see_results')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;
