import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface IMCQQuestion {
  id: string;
  type: 'direct' | 'scenario';
  question: string;
  scenario?: string;
  options: IMCQOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IPracticeProblem {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  hints?: string[];
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IStageResource {
  type: 'video' | 'pdf' | 'link';
  title: string;
  url?: string;
  content?: string;
  description?: string;
}

export interface ICaseStudy {
  id: string;
  title: string;
  description: string;
  content: string;
  questions?: string[];
}

export interface IStageContent {
  introduction?: string;
  learningObjectives?: string[];
  caseStudies?: ICaseStudy[];
  resources?: IStageResource[];
  practiceProblems?: IPracticeProblem[];
  assessmentQuestions?: IMCQQuestion[];
  content_md?: string;
  mcqs?: IMCQQuestion[];
}

export interface IUnlockCondition {
  type: 'previous_stage_completion' | 'time_spent' | 'practice_problem_completion' | 'resource_view';
  value: any;
  description: string;
}

export interface IPodStage extends Document {
  pod: Types.ObjectId;
  title: string;
  description: string;
  order: number;
  type: 'introduction' | 'case_studies' | 'resources' | 'practice' | 'assessment' | 'documentation';
  content: IStageContent;
  unlockConditions: IUnlockCondition[];
  estimatedMinutes: number;
  isRequired: boolean;
  stageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MCQOptionSchema = new Schema<IMCQOption>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: String,
});

const MCQQuestionSchema = new Schema<IMCQQuestion>({
  id: { type: String, required: true },
  type: { type: String, enum: ['direct', 'scenario'], required: true },
  question: { type: String, required: true },
  scenario: String,
  options: [MCQOptionSchema],
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
});

const PracticeProblemSchema = new Schema<IPracticeProblem>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  problemStatement: { type: String, required: true },
  hints: [String],
  solution: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
});

const StageResourceSchema = new Schema<IStageResource>({
  type: { type: String, enum: ['video', 'pdf', 'link'], required: true },
  title: { type: String, required: true },
  url: String,
  content: String,
  description: String,
});

const CaseStudySchema = new Schema<ICaseStudy>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  questions: [String],
});

const StageContentSchema = new Schema<IStageContent>({
  introduction: String,
  learningObjectives: [String],
  caseStudies: [CaseStudySchema],
  resources: [StageResourceSchema],
  practiceProblems: [PracticeProblemSchema],
  assessmentQuestions: [MCQQuestionSchema],
  content_md: String,
  mcqs: [MCQQuestionSchema],
});

const UnlockConditionSchema = new Schema<IUnlockCondition>({
  type: { type: String, enum: ['previous_stage_completion', 'time_spent', 'practice_problem_completion', 'resource_view'], required: true },
  value: Schema.Types.Mixed,
  description: { type: String, required: true },
});

const PodStageSchema = new Schema<IPodStage>(
  {
    pod: { type: Schema.Types.ObjectId, ref: 'Pod', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    type: { type: String, enum: ['introduction', 'case_studies', 'resources', 'practice', 'assessment', 'documentation'], required: true },
    content: { type: StageContentSchema, required: true },
    unlockConditions: [UnlockConditionSchema],
    estimatedMinutes: { type: Number, default: 30 },
    isRequired: { type: Boolean, default: true },
    stageId: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PodStageSchema.index({ pod: 1, order: 1 }, { unique: true });

export const PodStage: Model<IPodStage> = mongoose.model<IPodStage>('PodStage', PodStageSchema);
