
import React from 'react';
import { ChevronRightIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface HowItWorksProps {
    onOpenProfile?: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenProfile }) => {
    const { t } = useLanguage();

    const parseContent = (text: string) => {
        // Découpe par gras (**...**) ou lien ([[...]])
        const parts = text.split(/(\*\*.*?\*\*|\[\[.*?\]\])/g);
        
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-slate-700 dark:text-zinc-200">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[[') && part.endsWith(']]')) {
                return (
                    <button 
                        key={index} 
                        onClick={(e) => {
                            e.stopPropagation(); // Empêche le toggle du details/summary si cliqué
                            if (onOpenProfile) onOpenProfile();
                        }}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-block focus:outline-none"
                    >
                        {part.slice(2, -2)}
                    </button>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="w-full">
            <details className="group">
                <summary className="list-none flex items-center justify-between cursor-pointer text-sm font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white transition-colors select-none">
                    <span>{t('how_it_works')}</span>
                    <ChevronRightIcon className="w-4 h-4 text-zinc-500 transform group-open:rotate-90 transition-transform"/>
                </summary>
                <div className="mt-3 text-xs text-slate-500 dark:text-zinc-400 space-y-2 leading-relaxed animate-fade-in-fast text-left">
                    <p>{parseContent(t('how_it_works_desc1'))}</p>
                    <p className="whitespace-pre-line">{parseContent(t('how_it_works_desc2'))}</p>
                </div>
            </details>
        </div>
    );
};

export default HowItWorks;
