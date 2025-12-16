
import React from 'react';
import { HomeIcon, LayoutGridIcon, CalendarIcon, ShoppingBagIcon, UserIcon, SchoolIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../types';

type MobileTab = 'create' | 'library' | 'agenda' | 'classes' | 'store' | 'profile';

interface MobileNavBarProps {
    activeTab: MobileTab | string;
    onTabChange: (tab: any) => void;
    hasActivePlan: boolean;
    userRole: UserRole;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange, hasActivePlan, userRole }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'create', label: t('nav_create'), icon: HomeIcon },
        { id: 'library', label: t('nav_library'), icon: LayoutGridIcon },
        // Conditionnel : Agenda (Élève) vs Classes (Prof)
        userRole === 'teacher' 
            ? { id: 'classes', label: t('my_classes'), icon: SchoolIcon }
            : { id: 'agenda', label: t('nav_agenda'), icon: CalendarIcon },
        { id: 'store', label: t('nav_store'), icon: ShoppingBagIcon },
        { id: 'profile', label: t('nav_profile'), icon: UserIcon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-zinc-800 pb-safe z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                                isActive 
                                    ? 'text-emerald-600 dark:text-emerald-400' 
                                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                            }`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'scale-100'} transition-transform`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {item.id === 'agenda' && hasActivePlan && (
                                <span className="absolute top-3 right-[42%] w-2 h-2 bg-amber-500 rounded-full"></span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNavBar;
