export interface UserProfile {
  _id?: string;
  userId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  bio?: string;
  studentInstitution?: string;
  studentDegree?: string;
  professionRole?: string;
  professionOrg?: string;
  experienceYears?: number;
  studentYear?: number;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  kaggleUrl?: string;
  xUrl?: string;
  bskyUrl?: string;
  websiteUrl?: string;
  otherSocials?: string[];
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  emailNotifications?: {
    podUpdates?: boolean;
    reviews?: boolean;
    announcements?: boolean;
    weeklyDigest?: boolean;
  };
  inAppNotifications?: {
    podReminders?: boolean;
    reviewRequests?: boolean;
    collaborationRequests?: boolean;
    systemUpdates?: boolean;
  };
  profileVisibility?: 'public' | 'private' | 'unlisted';
  showEmail?: boolean;
  showSocialLinks?: boolean;
  apiKey?: string;
  apiEnabled?: boolean;
  organizationId?: string;
  role?: string;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProblemSkillWeight {
  skillId: string;
  weight: number;
}

export interface ProblemPodRef {
  pod: string;
  order: number;
  weight: number;
}

export interface Problem {
  _id?: string;
  slug: string;
  title: string;
  description?: string;
  description_md?: string;
  tagline?: string;
  context_md?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  skills: ProblemSkillWeight[];
  version: number;
  isPublic: boolean;
  pods: ProblemPodRef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PodResource {
  type: 'video' | 'pdf' | 'link' | 'mcq';
  title: string;
  url?: string;
  content?: string;
}

export interface Pod {
  _id?: string;
  problem: string;
  title: string;
  phase: 'research' | 'design' | 'implementation' | 'reflection';
  order: number;
  resources?: PodResource[];
  expectedOutputs?: string[];
  description_md?: string;
  content_file_path?: string;
  mode?: 'single_stage' | 'multi_stage';
  estimatedMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface MCQQuestion {
  id: string;
  type: 'direct' | 'scenario';
  question: string;
  scenario?: string;
  options: MCQOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content: string;
  questions?: string[];
}

export interface PracticeProblem {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  hints?: string[];
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StageResource {
  type: 'video' | 'pdf' | 'link';
  title: string;
  url?: string;
  content?: string;
  description?: string;
}

export interface UnlockCondition {
  type: 'previous_stage_completion' | 'time_spent' | 'practice_problem_completion' | 'resource_view';
  value: any;
  description: string;
}

export interface StageContent {
  introduction?: string;
  learningObjectives?: string[];
  caseStudies?: CaseStudy[];
  resources?: StageResource[];
  practiceProblems?: PracticeProblem[];
  assessmentQuestions?: MCQQuestion[];
  content_md?: string;
  mcqs?: MCQQuestion[];
}

export interface PodStage {
  _id?: string;
  pod: string;
  title: string;
  description: string;
  order: number;
  type: 'introduction' | 'case_studies' | 'resources' | 'practice' | 'assessment' | 'documentation';
  content: StageContent;
  unlockConditions?: UnlockCondition[];
  estimatedMinutes: number;
  isRequired: boolean;
  stageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProblemAttempt {
  _id?: string;
  userId: string;
  problem: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PodAttempt {
  _id?: string;
  userId: string;
  problemAttempt: string;
  pod: string;
  status: 'active' | 'completed';
  startedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeProblemAttempt {
  problemId: string;
  userAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  completedAt: Date;
}

export interface MCQAttempt {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
  completedAt: Date;
}

export interface UserStageProgress {
  _id?: string;
  userId: string;
  stageId: string;
  podAttemptId: string;
  status: 'locked' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number;
  lastAccessedAt?: Date;
  practiceProblemAttempts: PracticeProblemAttempt[];
  mcqAttempts: MCQAttempt[];
  assessmentScore?: number;
  maxAssessmentScore?: number;
  resourcesViewed: string[];
  caseStudiesViewed: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artefact {
  _id?: string;
  podAttempt: string;
  type: 'markdown' | 'url' | 'file' | 'github_repo';
  content?: string;
  url?: string;
  fileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  publicProblems: number;
  totalPods: number;
  totalStages: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface CompletionRateData {
  problem: string;
  completionRate: number;
  totalAttempts: number;
  completedAttempts: number;
}

export interface DifficultyDistribution {
  difficulty: string;
  count: number;
  percentage: number;
}

export interface PhaseDistribution {
  phase: string;
  count: number;
  percentage: number;
}

export interface StageTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface PaginatedUsersResponse {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedProblemsResponse {
  problems: Problem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedPodsResponse {
  pods: Pod[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedStagesResponse {
  stages: PodStage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type PodPhase = 'research' | 'design' | 'implementation' | 'reflection';
export type StageType = 'introduction' | 'case_studies' | 'resources' | 'practice' | 'assessment' | 'documentation';
export type AttemptStatus = 'active' | 'completed' | 'abandoned';
export type StageStatus = 'locked' | 'in_progress' | 'completed';
