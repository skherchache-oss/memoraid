
// Fix: Added SourceType export
export type SourceType = 'text' | 'pdf' | 'ocr' | 'speech' | 'unknown';

// Fix: Added LearningStyle export
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'textual';

// Fix: Added UserLevel export
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

// Fix: Added CoachingMode export
export type CoachingMode = 'standard' | 'oral' | 'exam' | 'solver';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface KeyConcept {
  concept: string;
  explanation: string;
  deepDive?: string;
}

export interface FlashcardContent {
  front: string;
  back: string;
}

export interface ReviewLog {
  date: number;
  type: 'quiz' | 'flashcard' | 'active-learning' | 'manual';
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  // Fix: Added image property
  image?: string;
}

export interface AiUsage {
  dailyCount: number;
  monthlyCount: number;
  lastReset: string; // ISO Date YYYY-MM-DD
}

export type UserPlan = 'free' | 'premium';
export type UserRole = 'student' | 'teacher';

// Fix: Added Badge interface and BadgeId type
export type BadgeId = 'first_capsule' | 'creator_10' | 'quiz_master' | 'streak_3' | 'streak_7' | 'social_butterfly';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

// Fix: Added GamificationStats interface
export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  lastStudyDate: string;
  badges: Badge[];
}

// Fix: Added MemberProgress interface
export interface MemberProgress {
  userId: string;
  name: string;
  masteryScore: number;
  lastReviewed: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  role: UserRole;
  plan: UserPlan;
  learningStyle?: LearningStyle;
  aiUsage?: AiUsage;
  chatUsage?: { count: number; lastReset: string };
  classes: string[]; // IDs des classes rejointes
  gamification?: GamificationStats;
  // Fix: Added missing properties
  plans?: StudyPlan[];
  activePlanId?: string;
  unlockedPackIds?: string[];
  isPremium?: boolean;
  level?: UserLevel;
}

export interface ClassMember {
  uid: string;
  name: string;
  joinedAt: number;
  status: 'active' | 'revoked';
}

export interface ClassRoom {
  id: string;
  name: string;
  teacherId: string;
  inviteCode: string;
  description?: string;
  members: ClassMember[];
  activePackIds: string[];
  createdAt: number;
}

// Fix: Added GroupMember and Group interfaces
export interface GroupMember {
  userId: string;
  name: string;
  role: 'owner' | 'student';
  joinedAt: number;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: number;
  memberIds?: string[]; // Used for Firestore queries
}

export interface CognitiveCapsule {
  id: string;
  title: string;
  summary: string;
  keyConcepts: KeyConcept[];
  examples: string[];
  quiz: QuizQuestion[];
  flashcards?: FlashcardContent[];
  createdAt: number;
  lastReviewed: number | null;
  reviewStage: number;
  category?: string;
  masteryLevel?: number;
  sourceType: SourceType;
  ownerId: string;
  classId?: string; // Si lié à une classe
  mnemonic?: string;
  memoryAidImage?: string;
  // Fix: Added missing properties
  memoryAidDescription?: string;
  history: ReviewLog[];
  isPremiumContent?: boolean;
  migratedAt?: number;
  groupId?: string;
  groupProgress?: MemberProgress[];
}

export type View = 'create' | 'base' | 'profile' | 'store' | 'agenda' | 'classes';
export type MobileTab = 'create' | 'library' | 'agenda' | 'classes' | 'store' | 'profile';

export interface AppData {
  user: UserProfile;
  capsules: CognitiveCapsule[];
}

// Fix: Added PremiumPack interface
export interface PremiumPack {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  capsuleCount: number;
  coverColor: string;
  capsules: CognitiveCapsule[];
}

// Fix: Added Planning related types
export interface StudyTask {
    capsuleId: string;
    title: string;
    estimatedMinutes: number;
    status: 'pending' | 'completed';
    type: 'learn' | 'review';
}

export interface DailySession {
    date: string;
    tasks: StudyTask[];
    totalMinutes: number;
    isRestDay: boolean;
}

export interface StudyPlan {
    id: string;
    name: string;
    examDate: number;
    dailyMinutesAvailable: number;
    schedule: DailySession[];
    createdAt: number;
    capsuleIds: string[];
}

// Fix: Added Visualization related types
export interface MindMapNode {
    id: string;
    label: string;
    children?: MindMapNode[];
}

export interface VisualizationData {
    type: 'mindmap' | 'timeline';
    data: MindMapNode | any;
}

// Fix: Added School Import related types
export type ExternalPlatform = 'classroom' | 'pronote' | 'moodle';

export interface SchoolMaterial {
    id: string;
    title: string;
    type: 'text' | 'pdf' | 'doc';
    content?: string;
}

export interface SchoolCourse {
    id: string;
    name: string;
    platform: ExternalPlatform;
    materials: SchoolMaterial[];
}
