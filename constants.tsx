import React from 'react';
import { 
    Plus, 
    BookOpen, 
    ChevronLeft, 
    ChevronRight, 
    ChevronDown, 
    Search, 
    Play, 
    ShoppingBag, 
    Brain, 
    Tag, 
    X, 
    CheckCircle, 
    Clock, 
    Crown, 
    Trash2, 
    LayoutGrid, 
    Home, 
    User, 
    Flame, 
    Globe, 
    Sun, 
    Moon, 
    Calendar, 
    Lightbulb, 
    Download, 
    Volume2, 
    StopCircle, 
    RefreshCw, 
    Image as LucideImage, 
    Sparkles, 
    FileText, 
    Zap, 
    ListChecks, 
    Layers, 
    Presentation, 
    Maximize, 
    Minimize, 
    ArrowRight, 
    Mail, 
    Trophy, 
    School, 
    LogOut, 
    GraduationCap, 
    Send, 
    Mic, 
    StopCircle as Stop, 
    Upload, 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    ShieldCheck,
    PauseCircle,
    PlayCircle,
    Monitor,
    Coffee,
    Share2,
    Users,
    ClipboardList
} from 'lucide-react';

// Custom SVG: Brain-Lightbulb Design
export const MemoraidLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        {/* Base de l'ampoule */}
        <path d="M9 19h6M9.5 21h5M11 23h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Corps de l'ampoule (Cerveau) */}
        <path d="M12 18c-3.5 0-7-2.5-7-7s2.5-7.5 7-7.5s7 3 7 7.5s-3.5 7-7 7Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Sillon central du cerveau */}
        <path d="M12 5v11" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
        {/* Éclats lumineux */}
        <path d="M12 1v1.5M19 4l-1 1M5 4l1 1M22 11h-1.5M3.5 11H2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

export const MemoraidStickerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="11" className="fill-emerald-50 dark:fill-emerald-900/20 stroke-emerald-100 dark:stroke-emerald-800" strokeWidth="1" />
        <g className="text-emerald-600 dark:text-emerald-400">
            <path d="M9 18h6M10 20h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12 17c-3 0-6-2-6-6s2-6.5 6-6.5s6 2.5 6 6.5s-3 6-6 6Z" stroke="currentColor" strokeWidth="1.2" fill="white" />
            <path d="M12 6v9" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
            <path d="M8 9h1M15 9h1M8 12h1M15 12h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </g>
    </svg>
);

export const LearningIllustration = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="150" cy="90" r="75" className="fill-emerald-100/40 dark:fill-emerald-900/10 animate-pulse" />
        <rect x="135" y="155" width="30" height="8" rx="1" className="fill-slate-400 dark:fill-slate-600" />
        <rect x="138" y="165" width="24" height="6" rx="1" className="fill-slate-300 dark:fill-slate-500" />
        <rect x="138" y="173" width="24" height="6" rx="1" className="fill-slate-300 dark:fill-slate-500" />
        <path d="M142 180 L150 188 L158 180" className="fill-slate-400 dark:fill-slate-600" />
        <g className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="2.5" strokeLinecap="round">
            <line x1="150" y1="5" x2="150" y2="-5" />
            <line x1="90" y1="30" x2="80" y2="20" />
            <line x1="210" y1="30" x2="220" y2="20" />
            <line x1="70" y1="90" x2="60" y2="90" />
            <line x1="230" y1="90" x2="240" y2="90" />
        </g>
        <g transform="translate(138, 75) scale(1.1)">
            <path d="M9 19h6M9.5 21h5M11 23h2" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 18c-3.5 0-7-2.5-7-7s2.5-7.5 7-7.5s7 3 7 7.5s-3.5 7-7 7Z" stroke="#10b981" strokeWidth="1.5" fill="white"/>
        </g>
    </svg>
);

// Lucide Exports
export const PlusIcon = Plus;
export const BookOpenIcon = BookOpen;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const ChevronDownIcon = ChevronDown;
export const SearchIcon = Search;
export const PlayIcon = Play;
export const ShoppingBagIcon = ShoppingBag;
export const BrainIcon = Brain;
export const TagIcon = Tag;
export const XIcon = X;
export const CheckCircleIcon = CheckCircle;
export const ClockIcon = Clock;
export const CrownIcon = Crown;
export const Trash2Icon = Trash2;
export const LayoutGridIcon = LayoutGrid;
export const HomeIcon = Home;
export const UserIcon = User;
export const FlameIcon = Flame;
export const GlobeIcon = Globe;
export const SunIcon = Sun;
export const MoonIcon = Moon;
export const CalendarIcon = Calendar;
export const LightbulbIcon = Lightbulb;
export const DownloadIcon = Download;
export const Volume2Icon = Volume2;
export const StopCircleIcon = StopCircle;
export const RefreshCwIcon = RefreshCw;
export const ImageIcon = LucideImage;
export const SparklesIcon = Sparkles;
export const FileTextIcon = FileText;
export const ZapIcon = Zap;
export const ListChecksIcon = ListChecks;
export const LayersIcon = Layers;
export const PresentationIcon = Presentation;
export const MaximizeIcon = Maximize;
export const MinimizeIcon = Minimize;
export const ArrowRightIcon = ArrowRight;
export const MailIcon = Mail;
export const TrophyIcon = Trophy;
export const SchoolIcon = School;
export const LogOutIcon = LogOut;
export const GraduationCapIcon = GraduationCap;
export const SendIcon = Send;
export const MicrophoneIcon = Mic;
export const StopIcon = Stop;
export const UploadIcon = Upload;
export const AlertTriangleIcon = AlertTriangle;
export const AlertCircleIcon = AlertCircle;
export const InfoIcon = Info;
export const ShieldCheckIcon = ShieldCheck;
export const PauseCircleIcon = PauseCircle;
export const PlayCircleIcon = PlayCircle;
export const MonitorIcon = Monitor;
export const CoffeeIcon = Coffee;
export const Share2Icon = Share2;
export const UsersIcon = Users;
export const ClipboardListIcon = ClipboardList;