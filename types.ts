
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

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: GroupMember[];
  memberIds: string[]; // Nouveau: pour les règles de sécurité Firestore
}

export interface CollaborativeTask {
  id: string;
  capsuleId: string;
  assigneeId: string;
  assigneeName: string;
  description: string;
  isCompleted: boolean;
  createdAt: number;
  createdBy: string;
}

export interface MemberProgress {
  userId: string;
  userName: string;
  lastReviewed: number;
  masteryScore: number;
}

export type BadgeId = 'first_capsule' | 'quiz_master' | 'streak_3' | 'streak_7' | 'streak_30' | 'explorer' | 'creator_10' | 'social_butterfly';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  lastStudyDate: string;
  badges: Badge[];
}

export interface GroupChallenge {
  id: string;
  capsuleId: string;
  capsuleTitle: string;
  challengerName: string;
  targetScore: number;
  endDate: number;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface VisualizationData {
  type: 'mindmap' | 'timeline';
  data: MindMapNode | TimelineEvent[];
}

export type ExternalPlatform = 'classroom' | 'moodle' | 'pronote';

export interface SchoolCourse {
  id: string;
  name: string;
  platform: ExternalPlatform;
  materials: SchoolMaterial[];
}

export interface SchoolMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'text';
  content?: string;
  url?: string;
}

export interface StudyTask {
  capsuleId: string;
  title: string;
  estimatedMinutes: number;
  status: 'pending' | 'completed';
  type: 'review' | 'learn' | 'quiz';
}

export interface DailySession {
  date: string;
  tasks: StudyTask[];
  totalMinutes: number;
  isRestDay?: boolean;
}

export interface StudyPlan {
  id: string;
  examDate: number;
  name: string;
  dailyMinutesAvailable: number;
  schedule: DailySession[];
  createdAt: number;
  capsuleIds: string[];
}

export type PremiumCategory = 'bac' | 'concours' | 'expert' | 'langues';

export interface PremiumPack {
  id: string;
  title: string;
  description: string;
  category: PremiumCategory;
  price: number;
  capsuleCount: number;
  coverColor: string;
  capsules: CognitiveCapsule[];
}

export type SourceType = 'text' | 'pdf' | 'web' | 'image' | 'presentation' | 'ocr' | 'speech' | 'unknown';

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
  memoryAidImage?: string;
  memoryAidDescription?: string;
  visualizations?: VisualizationData[];
  mnemonic?: string;
  history?: ReviewLog[];
  masteryLevel?: number;
  sourceType?: SourceType;
  isShared?: boolean;
  groupId?: string;
  groupName?: string;
  comments?: Comment[];
  sharedLink?: string;
  lastModifiedBy?: string;
  collaborativeTasks?: CollaborativeTask[];
  groupProgress?: MemberProgress[];
  activeChallenge?: GroupChallenge;
  isPremiumContent?: boolean;
  originalPackId?: string;
  migratedAt?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'textual';
export type CoachingMode = 'standard' | 'oral' | 'exam' | 'solver';
export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  name: string;
  email?: string;
  role: UserRole;
  level?: UserLevel;
  learningStyle?: LearningStyle;
  plans?: StudyPlan[];
  activePlanId?: string;
  isPremium?: boolean;
  unlockedPackIds?: string[];
  gamification?: GamificationStats;
}

export interface AppData {
  user: UserProfile;
  capsules: CognitiveCapsule[];
}
