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
    // Added missing icon imports
    Share2,
    Users,
    ClipboardList
} from 'lucide-react';

// Custom SVGs
export const MemoraidLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M 11.4 4 C 11.1 3.8, 11.0 3.5, 10.7 3.5 C 5 3.5, 2 7, 2 12 C 2 17, 5 20.5, 10.7 20.5 C 11.0 20.5, 11.1 20.2, 11.4 20 L 11.4 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 12.6 4 C 12.9 3.8, 13.0 3.5, 13.3 3.5 C 19 3.5, 22 7, 22 12 C 22 17, 19 20.5, 13.3 20.5 C 13.0 20.5, 12.9 20.2, 12.6 20 L 12.6 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 5.6 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);

export const MemoraidStickerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="11" className="fill-emerald-50 dark:fill-emerald-900/20 stroke-emerald-100 dark:stroke-emerald-800" strokeWidth="1" />
        <path d="M 11.4 4 C 11.1 3.8, 11.0 3.5, 10.7 3.5 C 5 3.5, 2 7, 2 12 C 2 17, 5 20.5, 10.7 20.5 C 11.0 20.5, 11.1 20.2, 11.4 20 L 11.4 4 Z" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 12.6 4 C 12.9 3.8, 13.0 3.5, 13.3 3.5 C 19 3.5, 22 7, 22 12 C 22 17, 19 20.5, 13.3 20.5 C 13.0 20.5, 12.9 20.2, 12.6 20 L 12.6 4 Z" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 5.6 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="1.2" fill="none" strokeLinecap="round" />
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
        <g transform="translate(90, 35) scale(5)">
            <path d="M 11.4 4 C 11.1 3.8, 11.0 3.5, 10.7 3.5 C 5 3.5, 2 7, 2 12 C 2 17, 5 20.5, 10.7 20.5 C 11.0 20.5, 11.1 20.2, 11.4 20 L 11.4 4 Z" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="0.5" fill="white" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 12.6 4 C 12.9 3.8, 13.0 3.5, 13.3 3.5 C 19 3.5, 22 7, 22 12 C 22 17, 19 20.5, 13.3 20.5 C 13.0 20.5, 12.9 20.2, 12.6 20 L 12.6 4 Z" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="0.5" fill="white" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 5.6 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0" className="stroke-amber-500 dark:stroke-amber-400 animate-pulse" strokeWidth="0.5" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="120" cy="50" r="2" className="fill-emerald-300 animate-bounce" style={{animationDuration: '3s'}} />
        <circle cx="180" cy="120" r="2" className="fill-blue-300 animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}} />
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
// Added missing icon exports
export const Share2Icon = Share2;
export const UsersIcon = Users;
export const ClipboardListIcon = ClipboardList;