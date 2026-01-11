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

// Style typographique commun pour la marque
export const BRAND_FONT = "font-black tracking-tighter uppercase font-sans";

/**
 * LOGO MEMORAID (Bouclier + Circuits)
 */
export const MemoraidLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M 11.4 4 C 11.1 3.8, 11.0 3.5, 10.7 3.5 C 5 3.5, 2 7, 2 12 C 2 17, 5 20.5, 10.7 20.5 C 11.0 20.5, 11.1 20.2, 11.4 20 L 11.4 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 12.6 4 C 12.9 3.8, 13.0 3.5, 13.3 3.5 C 19 3.5, 22 7, 22 12 C 22 17, 19 20.5, 13.3 20.5 C 13.0 20.5, 12.9 20.2, 12.6 20 L 12.6 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 5.6 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 5.6 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 8 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 12 q 0.5 0.5 1 0 q 0.5 -0.5 1 0 M 16.4 16 q 0.5 0.5 1 0 q 0.5 -0.5 1 0" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);

/**
 * ILLUSTRATION AMPOULE LUMINEUSE SUBTILE AVEC NEIGE PHOTONIQUE ET FAISCEAUX
 */
export const LearningIllustration = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center py-12 w-full animate-fade-in ${className}`}>
        <div className="relative group scale-110">
            {/* Halo de fond calme */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 blur-[70px] rounded-full animate-pulse-slow"></div>
            
            {/* Conteneur principal avec micro-vibration */}
            <div className="animate-hum">
                <svg width="150" height="200" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 overflow-visible">
                    
                    {/* --- FAISCEAUX LUMINEUX EXTÉRIEURS --- */}
                    <g className="animate-twinkle opacity-40">
                        <line x1="60" y1="5" x2="60" y2="0" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        <line x1="95" y1="20" x2="100" y2="15" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        <line x1="115" y1="55" x2="122" y2="55" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        <line x1="108" y1="90" x2="114" y2="96" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        
                        <line x1="25" y1="20" x2="20" y2="15" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        <line x1="5" y1="55" x2="-2" y2="55" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                        <line x1="12" y1="90" x2="6" y2="96" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* --- CONTOUR DE L'AMPOULE --- */}
                    <path d="M60 15C35 15 15 35 15 60C15 80 25 95 35 105V115H85V105C95 95 105 80 105 60C105 35 85 15 60 15Z" 
                          className="fill-emerald-500/[0.01] stroke-slate-300 dark:stroke-zinc-600 transition-colors" strokeWidth="2.5" />
                    
                    {/* --- NEIGE DE PHOTONS --- */}
                    <g className="pointer-events-none">
                        <circle cx="40" cy="25" r="1" fill="#facc15" className="animate-snow-fall" />
                        <circle cx="70" cy="35" r="0.8" fill="#fbbf24" className="animate-snow-fall" style={{animationDelay: '1s', animationDuration: '8s'}} />
                        <circle cx="55" cy="15" r="0.9" fill="#fde047" className="animate-snow-fall" style={{animationDelay: '2.5s', animationDuration: '6s'}} />
                        <circle cx="85" cy="45" r="0.7" fill="#fbbf24" className="animate-snow-fall" style={{animationDelay: '0.4s', animationDuration: '9s'}} />
                        <circle cx="35" cy="50" r="1.1" fill="#facc15" className="animate-snow-fall" style={{animationDelay: '3.2s', animationDuration: '7.5s'}} />
                        <circle cx="62" cy="30" r="0.6" fill="#fbbf24" className="animate-snow-fall" style={{animationDelay: '5s', animationDuration: '10s'}} />
                        <circle cx="48" cy="40" r="0.8" fill="#fde047" className="animate-snow-fall" style={{animationDelay: '1.8s', animationDuration: '7s'}} />
                        <circle cx="78" cy="20" r="0.9" fill="#facc15" className="animate-snow-fall" style={{animationDelay: '4.1s', animationDuration: '8.5s'}} />
                    </g>
                    
                    {/* Reflets de verre statiques */}
                    <path d="M35 40 Q 25 60 35 80" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.08" />

                    {/* --- SCINTILLEMENT DU FILAMENT --- */}
                    <g className="animate-electric-flicker-soft">
                        <g transform="translate(60, 60)">
                            <circle r="1" fill="#10b981" className="animate-energy-orbit-slow" />
                        </g>

                        {/* Le Logo Memoraid Filament */}
                        <g transform="translate(36, 38) scale(2.0)">
                            <path d="M 11.4 4 C 11.1 3.8, 11.0 3.5, 10.7 3.5 C 5 3.5, 2 7, 2 12 C 2 17, 5 20.5, 10.7 20.5 C 11.0 20.5, 11.1 20.2, 11.4 20 L 11.4 4 Z" stroke="#10b981" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 12.6 4 C 12.9 3.8, 13.0 3.5, 13.3 3.5 C 19 3.5, 22 7, 22 12 C 22 17, 19 20.5, 13.3 20.5 C 13.0 20.5, 12.9 20.2, 12.6 20 L 12.6 4 Z" stroke="#10b981" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 5.6 8 q 0.5 0.5 1 0 M 5.6 12 q 0.5 0.5 1 0 M 5.6 16 q 0.5 0.5 1 0 M 16.4 8 q 0.5 0.5 1 0 M 16.4 12 q 0.5 0.5 1 0 M 16.4 16 q 0.5 0.5 1 0" stroke="#fbbf24" strokeWidth="1.2" fill="none" strokeLinecap="round" className="animate-twinkle" />
                        </g>
                    </g>

                    {/* Culot stable */}
                    <g transform="translate(40, 115)">
                        <rect x="0" y="0" width="40" height="5" rx="1" fill="#E2E8F0" className="dark:fill-slate-400" />
                        <rect x="0" y="7" width="40" height="5" rx="1" fill="#CBD5E1" className="dark:fill-slate-500" />
                        <path d="M10 20 L30 20 L25 28 L15 28 Z" fill="#64748B" className="dark:fill-slate-700" />
                    </g>
                </svg>
            </div>
        </div>
        
        <div className="text-center mt-6">
            <h1 className={`text-3xl md:text-4xl text-emerald-900 dark:text-emerald-500 leading-none mb-2 ${BRAND_FONT}`}>
                MEMORAID
            </h1>
            <div className="h-0.5 w-10 bg-emerald-500/30 mx-auto rounded-full mb-3"></div>
            <p className="text-slate-400 dark:text-zinc-500 text-[7px] font-black uppercase tracking-[0.6em] ml-[0.6em]">
                Architecture Cognitive
            </p>
        </div>
    </div>
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