# Quild Admin Site - Database Models Documentation

This document provides a comprehensive overview of all database models, their attributes, relationships, and usage patterns for building the admin dashboard.

---

## Database Technology
- **Database**: MongoDB
- **ORM**: Mongoose
- **Location**: `backend/src/models/`

---

## Model Overview

| Model Name | Purpose | Key Relationships |
|------------|---------|-------------------|
| `UserProfile` | User profile data and preferences | None (standalone) |
| `Problem` | Learning problems/challenges | Has many `Pod` |
| `Pod` | Learning phases within problems | Belongs to `Problem`, has many `PodStage` |
| `PodStage` | Individual stages within multi-stage pods | Belongs to `Pod`, has many `UserStageProgress` |
| `ProblemAttempt` | User's attempt at a problem | Belongs to `Problem`, has many `PodAttempt` |
| `PodAttempt` | User's attempt at a pod | Belongs to `ProblemAttempt` and `Pod`, has many `Artefact` |
| `UserStageProgress` | User's progress through pod stages | Belongs to `PodAttempt` and `PodStage` |
| `Artefact` | User-submitted work/artifacts | Belongs to `PodAttempt` |

---

## Detailed Model Specifications

### 1. UserProfile

**File**: `backend/src/models/UserProfile.ts`

**Purpose**: Stores user profile information, preferences, social links, and subscription details.

**Attributes**:

```typescript
{
  // Identity
  userId: string                    // Unique user identifier (indexed, unique)
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  backgroundUrl?: string
  backgroundPositionX?: number      // Default: 50
  backgroundPositionY?: number      // Default: 50

  // Professional Information
  bio?: string
  studentInstitution?: string
  studentDegree?: string
  professionRole?: string
  professionOrg?: string
  experienceYears?: number
  studentYear?: number
  location?: string

  // Social Links
  githubUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  kaggleUrl?: string
  xUrl?: string
  bskyUrl?: string
  websiteUrl?: string
  otherSocials?: string[]

  // Preferences
  theme?: 'light' | 'dark' | 'system'  // Default: 'system'
  language?: string                   // Default: 'en-US'
  timezone?: string                   // Default: 'UTC'

  // Notification Preferences
  emailNotifications?: {
    podUpdates?: boolean              // Default: true
    reviews?: boolean                 // Default: true
    announcements?: boolean           // Default: true
    weeklyDigest?: boolean            // Default: false
  }
  inAppNotifications?: {
    podReminders?: boolean            // Default: true
    reviewRequests?: boolean          // Default: true
    collaborationRequests?: boolean   // Default: true
    systemUpdates?: boolean           // Default: true
  }

  // Privacy Settings
  profileVisibility?: 'public' | 'private' | 'unlisted'  // Default: 'public'
  showEmail?: boolean                // Default: false
  showSocialLinks?: boolean          // Default: true

  // API Settings
  apiKey?: string
  apiEnabled?: boolean               // Default: false

  // Enterprise Settings
  organizationId?: string
  role?: string
  subscriptionTier?: 'free' | 'pro' | 'enterprise'  // Default: 'free'

  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}
```

**Indexes**:
- `userId` (unique, indexed)

**Static Methods**:
- `upsertForUser(attrs)`: Create or update user profile

**API Endpoints**:
- `GET /api/profile` - Get current user's profile
- `PUT /api/profile` - Update current user's profile
- `GET /api/profile/public/:username` - Get public profile by username
- `GET /api/profile/search?q=query` - Search profiles

**Admin Use Cases**:
- View all user profiles
- Filter by subscription tier (free/pro/enterprise)
- Track user registration dates
- Monitor user engagement (last updated)
- Export user data for analytics
- Manage user subscription tiers

---

### 2. Problem

**File**: `backend/src/models/Problem.ts`

**Purpose**: Represents learning problems/challenges that users can attempt.

**Attributes**:

```typescript
{
  slug: string                       // Unique URL-friendly identifier (indexed, unique)
  title: string
  description?: string              // Legacy field
  description_md?: string           // Markdown description
  tagline?: string
  context_md?: string               // Markdown context

  difficulty: 'beginner' | 'intermediate' | 'advanced'  // (indexed)
  estimatedHours: number

  skills: ProblemSkillWeight[]      // Array of { skillId, weight }

  version: number                   // Default: 1
  isPublic: boolean                 // Default: false (indexed)

  pods: ProblemPodRef[]             // Array of { pod: ObjectId, order, weight }

  createdAt: Date
  updatedAt: Date
}
```

**Nested Schemas**:
```typescript
ProblemSkillWeight {
  skillId: string
  weight: number                    // Min: 0
}

ProblemPodRef {
  pod: ObjectId                     // Ref: 'Pod'
  order: number
  weight: number                    // Min: 0
}
```

**Indexes**:
- `slug` (unique, indexed)
- `difficulty` (indexed)
- `isPublic` (indexed)
- Compound: `{ isPublic: 1, difficulty: 1 }`
- Compound: `{ problem: 1, order: 1 }` (unique on Pod)

**API Endpoints**:
- `GET /api/problems` - List all public problems
- `GET /api/problems/:slug` - Get problem by slug
- `POST /api/problems/:slug/start` - Start problem attempt

**Admin Use Cases**:
- Create/Update/Delete problems
- Manage problem visibility (isPublic)
- Track problem popularity
- View problem completion rates
- Analyze difficulty distribution
- Manage problem versions

---

### 3. Pod

**File**: `backend/src/models/Pod.ts`

**Purpose**: Represents a phase or stage within a problem (research, design, implementation, reflection).

**Attributes**:

```typescript
{
  problem: ObjectId                 // Ref: 'Problem' (indexed)
  title: string
  phase: 'research' | 'design' | 'implementation' | 'reflection'
  order: number

  // Deprecated fields (use stages instead)
  resources?: PodResource[]
  expectedOutputs?: string[]

  description_md?: string           // Markdown description
  content_file_path?: string        // Path to markdown content file

  mode?: 'single_stage' | 'multi_stage'  // Default: 'multi_stage'
  estimatedMinutes?: number         // Default: 60

  createdAt: Date
  updatedAt: Date
}
```

**Nested Schemas**:
```typescript
PodResource {
  type: 'video' | 'pdf' | 'link' | 'mcq'
  title: string
  url?: string
  content?: string
}
```

**Indexes**:
- `problem` (indexed)
- Compound: `{ problem: 1, order: 1 }` (unique)

**API Endpoints**:
- `POST /api/pods/:podId/start` - Start pod attempt
- `POST /api/pods/:podId/submit` - Submit pod artifacts
- `GET /api/pods/progress/:problemId` - Get pod progress for problem

**Admin Use Cases**:
- Create/Update/Delete pods
- Manage pod ordering within problems
- Track pod completion rates
- Monitor time spent per pod
- Analyze phase distribution (research/design/implementation/reflection)

---

### 4. PodStage

**File**: `backend/src/models/PodStage.ts`

**Purpose**: Represents individual stages within multi-stage pods (introduction, case_studies, resources, practice, assessment, documentation).

**Attributes**:

```typescript
{
  pod: ObjectId                     // Ref: 'Pod' (indexed)
  title: string
  description: string
  order: number

  type: 'introduction' | 'case_studies' | 'resources' | 'practice' | 'assessment' | 'documentation'

  content: StageContent            // Complex nested object
  unlockConditions: UnlockCondition[]

  estimatedMinutes: number          // Default: 30
  isRequired: boolean              // Default: true

  stageId?: string                 // Matches markdown filename (e.g., 'stage-1-docs')

  createdAt: Date
  updatedAt: Date
}
```

**Nested Schemas**:
```typescript
StageContent {
  introduction?: string
  learningObjectives?: string[]
  caseStudies?: CaseStudy[]
  resources?: StageResource[]
  practiceProblems?: PracticeProblem[]
  assessmentQuestions?: MCQQuestion[]  // Legacy
  content_md?: string
  mcqs?: MCQQuestion[]                  // New format
}

CaseStudy {
  id: string
  title: string
  description: string
  content: string
  questions?: string[]
}

PracticeProblem {
  id: string
  title: string
  description: string
  problemStatement: string
  hints?: string[]
  solution?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

MCQQuestion {
  id: string
  type: 'direct' | 'scenario'
  question: string
  scenario?: string
  options: MCQOption[]
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

MCQOption {
  id: string
  text: string
  isCorrect: boolean
  explanation?: string
}

StageResource {
  type: 'video' | 'pdf' | 'link'
  title: string
  url?: string
  content?: string
  description?: string
}

UnlockCondition {
  type: 'previous_stage_completion' | 'time_spent' | 'practice_problem_completion' | 'resource_view'
  value: any
  description: string
}
```

**Indexes**:
- `pod` (indexed)
- Compound: `{ pod: 1, order: 1 }` (unique)

**API Endpoints**:
- `GET /api/pods/:podId/stages` - Get all stages for a pod
- `GET /api/pods/:podId/stages/:stageId` - Get stage details
- `POST /api/pods/:podId/stages/:stageId/start` - Start a stage
- `POST /api/pods/:podId/stages/:stageId/complete` - Complete a stage
- `POST /api/pods/:podId/stages/:stageId/practice/submit` - Submit practice problem
- `POST /api/pods/:podId/stages/:stageId/assessment/submit` - Submit MCQ answer
- `PATCH /api/pods/:podId/stages/:stageId/progress` - Update stage progress

**Admin Use Cases**:
- Create/Update/Delete stages
- Manage stage ordering and unlock conditions
- Track stage completion rates
- Monitor assessment scores
- Analyze time spent per stage
- Manage MCQ questions and practice problems

---

### 5. ProblemAttempt

**File**: `backend/src/models/ProblemAttempt.ts`

**Purpose**: Tracks a user's attempt at solving a problem.

**Attributes**:

```typescript
{
  userId: string                    // (indexed)
  problem: ObjectId                 // Ref: 'Problem' (indexed)
  status: 'active' | 'completed' | 'abandoned'  // Default: 'active' (indexed)
  startedAt: Date
  completedAt?: Date

  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `userId` (indexed)
- `problem` (indexed)
- `status` (indexed)
- Compound: `{ userId: 1, problem: 1, status: 1 }`

**Static Methods**:
- `findOrCreate(filter, attrs)`: Find existing attempt or create new one

**Admin Use Cases**:
- Track problem attempt statistics
- Monitor active vs completed attempts
- Calculate completion rates
- Identify abandoned attempts
- Track time to completion

---

### 6. PodAttempt

**File**: `backend/src/models/PodAttempt.ts`

**Purpose**: Tracks a user's attempt at completing a pod.

**Attributes**:

```typescript
{
  userId: string                    // (indexed)
  problemAttempt: ObjectId          // Ref: 'ProblemAttempt' (indexed)
  pod: ObjectId                     // Ref: 'Pod' (indexed)
  status: 'active' | 'completed'    // Default: 'active' (indexed)
  startedAt: Date
  submittedAt?: Date
  completedAt?: Date                // New field for completion tracking

  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `userId` (indexed)
- `problemAttempt` (indexed)
- `pod` (indexed)
- `status` (indexed)
- Compound: `{ userId: 1, pod: 1, status: 1 }`
- Compound: `{ userId: 1, pod: 1 }` (unique for status='active')

**Admin Use Cases**:
- Track pod attempt statistics
- Monitor sequential pod completion
- Calculate pod completion rates
- Track time spent per pod
- Identify stuck users (long active attempts)

---

### 7. UserStageProgress

**File**: `backend/src/models/UserStageProgress.ts`

**Purpose**: Tracks a user's progress through individual stages within a pod.

**Attributes**:

```typescript
{
  userId: string                    // (indexed)
  stageId: ObjectId                 // Ref: 'PodStage' (indexed)
  podAttemptId: ObjectId            // Ref: 'PodAttempt' (indexed)
  status: 'locked' | 'in_progress' | 'completed'  // Default: 'locked'
  startedAt?: Date
  completedAt?: Date
  timeSpent: number                 // Default: 0
  lastAccessedAt?: Date

  practiceProblemAttempts: PracticeProblemAttempt[]
  mcqAttempts: MCQAttempt[]
  assessmentScore?: number          // Min: 0, Max: 100
  maxAssessmentScore?: number       // Default: 100
  resourcesViewed: string[]
  caseStudiesViewed: string[]
  notes?: string

  createdAt: Date
  updatedAt: Date
}
```

**Nested Schemas**:
```typescript
PracticeProblemAttempt {
  problemId: string
  userAnswer: string
  isCorrect: boolean
  attempts: number                  // Default: 1
  timeSpent: number
  completedAt: Date
}

MCQAttempt {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  timeSpent: number
  completedAt: Date
}
```

**Indexes**:
- `userId` (indexed)
- `stageId` (indexed)
- `podAttemptId` (indexed)
- Compound: `{ podAttemptId: 1, stageId: 1 }` (unique)

**Admin Use Cases**:
- Track stage-level progress
- Monitor assessment scores
- Analyze learning patterns
- Identify difficult stages (low completion rates)
- Track time spent per stage
- Review user notes and attempts

---

### 8. Artefact

**File**: `backend/src/models/Artefact.ts`

**Purpose**: Stores user-submitted artifacts/work for pod completion.

**Attributes**:

```typescript
{
  podAttempt: ObjectId              // Ref: 'PodAttempt' (indexed)
  type: 'markdown' | 'url' | 'file' | 'github_repo'
  content?: string
  url?: string
  fileId?: string

  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `podAttempt` (indexed)

**Admin Use Cases**:
- Review user submissions
- Track submission types
- Monitor submission quality
- Export submissions for review
- Identify plagiarism (if needed)

---

## Model Relationships Diagram

```
UserProfile (standalone)
    ↓
ProblemAttempt
    ↓ (problem)
Problem
    ↓ (pods)
Pod
    ↓ (stages)
PodStage
    ↓ (progress)
UserStageProgress
    ↑ (podAttemptId)
PodAttempt
    ↓ (problemAttempt)
ProblemAttempt
    ↑ (userId)
UserProfile

PodAttempt
    ↓ (artifacts)
Artefact
```

---

## Key Analytics Metrics for Admin Dashboard

### User Analytics
- Total registered users
- Active users (last 7/30 days)
- User growth rate
- Subscription tier distribution
- User engagement (last login, profile completion)

### Problem Analytics
- Total problems
- Public vs private problems
- Difficulty distribution
- Problem completion rates
- Average time to completion
- Most/least popular problems

### Pod Analytics
- Total pods
- Pods per problem
- Phase distribution (research/design/implementation/reflection)
- Pod completion rates
- Average time spent per pod
- Sequential completion rate

### Stage Analytics
- Total stages
- Stage type distribution
- Stage completion rates
- Assessment score averages
- Time spent per stage
- Most difficult stages (lowest completion)

### Progress Analytics
- Active attempts
- Completed attempts
- Abandoned attempts
- Average completion time
- Learning path completion rate

### Content Analytics
- Total MCQ questions
- Total practice problems
- Total case studies
- Total resources
- Content engagement metrics

---

## API Endpoint Summary

### Problems
- `GET /api/problems` - List problems
- `GET /api/problems/:slug` - Get problem details
- `POST /api/problems/:slug/start` - Start problem attempt

### Pods
- `POST /api/pods/:podId/start` - Start pod attempt
- `POST /api/pods/:podId/submit` - Submit pod artifacts
- `GET /api/pods/progress/:problemId` - Get pod progress

### Stages
- `GET /api/pods/:podId/stages` - Get pod stages
- `GET /api/pods/:podId/stages/:stageId` - Get stage details
- `POST /api/pods/:podId/stages/:stageId/start` - Start stage
- `POST /api/pods/:podId/stages/:stageId/complete` - Complete stage
- `POST /api/pods/:podId/stages/:stageId/practice/submit` - Submit practice problem
- `POST /api/pods/:podId/stages/:stageId/assessment/submit` - Submit MCQ
- `PATCH /api/pods/:podId/stages/:stageId/progress` - Update progress

### Profile
- `GET /api/profile` - Get current profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/public/:username` - Get public profile
- `GET /api/profile/search?q=query` - Search profiles

### Content
- `GET /api/content/pods/:podId/content` - Get pod markdown content
- `GET /api/content/pods/:podId/stages/:stageId/content` - Get stage markdown content

### AI
- `POST /api/ai/text` - Ask AI assistant

---

## Admin Dashboard Recommendations

### 1. Overview Dashboard
- Key metrics cards (users, problems, completion rates)
- User growth chart
- Activity heatmap
- Recent activity feed

### 2. User Management
- User list with filters (tier, registration date, activity)
- User profile detail view
- User progress tracking
- Subscription management

### 3. Content Management
- Problem CRUD operations
- Pod management interface
- Stage editor with preview
- MCQ and practice problem builders
- Content versioning

### 4. Analytics Dashboard
- Completion rate charts
- Time-based analytics
- Difficulty distribution
- Learning path visualization
- Export capabilities

### 5. Monitoring
- Active attempts monitoring
- Error tracking
- Performance metrics
- System health checks

---

## Database Schema Notes

### Important Considerations
1. **Sequential Pod Unlocking**: Pods must be completed in order within a problem
2. **Stage Unlocking**: Stages unlock sequentially within multi-stage pods
3. **Attempt Limits**: Maximum 5 concurrent active attempts per user (24-hour window)
4. **Idempotent Operations**: Many operations are designed to be idempotent (startPodAttempt, startStage)
5. **Review Mode**: Completed pods can be accessed in read-only review mode

### Deprecated Fields
- `Pod.resources` and `Pod.expectedOutputs` - Use stages instead
- `StageContent.assessmentQuestions` - Use `StageContent.mcqs` instead

### Content Storage
- Markdown content stored in `content_md` fields
- External content files referenced via `content_file_path`
- File artifacts stored separately (referenced by `fileId`)

---

## Frontend Data Structures

The frontend uses TypeScript interfaces that mirror the backend models:

**Key Types** (`frontend/src/lib/types.ts`):
- `Problem`
- `Pod`
- `PodPhase`
- `PodMode`
- `ProblemPodRef`
- `ProblemAttemptStatus`
- `ApiProblemListResponse`
- `ApiProblemDetailResponse`
- `ApiStartProblemResponse`
- `ApiPodProgressResponse`

**Stage Types** (`frontend/src/types/pod-types.ts`):
- `Stage`
- `MCQQuestion`
- `MCQOption`
- `PodWorkLocationState`
- `UsePodDataReturn`
- `UseStageNavigationReturn`

---

## Authentication & Authorization

- **Authentication**: JWT-based via Supabase
- **Authorization**: Role-based (admin role required for admin operations)
- **Middleware**: `authenticate` and `requireRole('admin')` in routes

---

## Recommended Admin API Endpoints to Add

### Content Management
- `POST /api/admin/problems` - Create problem
- `PUT /api/admin/problems/:id` - Update problem
- `DELETE /api/admin/problems/:id` - Delete problem
- `POST /api/admin/pods` - Create pod
- `PUT /api/admin/pods/:id` - Update pod
- `DELETE /api/admin/pods/:id` - Delete pod
- `POST /api/admin/stages` - Create stage
- `PUT /api/admin/stages/:id` - Update stage
- `DELETE /api/admin/stages/:id` - Delete stage

### Analytics
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/analytics/problems` - Problem analytics
- `GET /api/admin/analytics/pods` - Pod analytics
- `GET /api/admin/analytics/stages` - Stage analytics
- `GET /api/admin/analytics/progress` - Progress analytics

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/subscription` - Update subscription tier
- `DELETE /api/admin/users/:id` - Delete user

### Monitoring
- `GET /api/admin/monitoring/attempts` - Active attempts
- `GET /api/admin/monitoring/errors` - Error logs
- `GET /api/admin/monitoring/performance` - Performance metrics

---

## Conclusion

This documentation provides a complete overview of the Quild database schema for building an admin dashboard. The models are designed to support a multi-stage learning platform with sequential progression, detailed progress tracking, and comprehensive analytics capabilities.

For implementation, focus on:
1. Building CRUD interfaces for content management
2. Creating analytics dashboards with visualizations
3. Implementing user management features
4. Adding monitoring and alerting capabilities
5. Ensuring proper authorization and security

All models use MongoDB with Mongoose, providing flexibility for schema evolution while maintaining data integrity through proper indexing and relationships.
