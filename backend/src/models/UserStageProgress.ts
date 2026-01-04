import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPracticeProblemAttempt {
  problemId: string;
  userAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  completedAt: Date;
}

export interface IMCQAttempt {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
  completedAt: Date;
}

export interface IUserStageProgress extends Document {
  userId: string;
  stageId: Types.ObjectId;
  podAttemptId: Types.ObjectId;
  status: 'locked' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number;
  lastAccessedAt?: Date;
  practiceProblemAttempts: IPracticeProblemAttempt[];
  mcqAttempts: IMCQAttempt[];
  assessmentScore?: number;
  maxAssessmentScore?: number;
  resourcesViewed: string[];
  caseStudiesViewed: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PracticeProblemAttemptSchema = new Schema<IPracticeProblemAttempt>({
  problemId: { type: String, required: true },
  userAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  attempts: { type: Number, default: 1 },
  timeSpent: { type: Number, required: true },
  completedAt: { type: Date, required: true },
});

const MCQAttemptSchema = new Schema<IMCQAttempt>({
  questionId: { type: String, required: true },
  selectedOptionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, required: true },
  completedAt: { type: Date, required: true },
});

const UserStageProgressSchema = new Schema<IUserStageProgress>(
  {
    userId: { type: String, required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'PodStage', required: true, index: true },
    podAttemptId: { type: Schema.Types.ObjectId, ref: 'PodAttempt', required: true, index: true },
    status: { type: String, enum: ['locked', 'in_progress', 'completed'], default: 'locked' },
    startedAt: Date,
    completedAt: Date,
    timeSpent: { type: Number, default: 0 },
    lastAccessedAt: Date,
    practiceProblemAttempts: [PracticeProblemAttemptSchema],
    mcqAttempts: [MCQAttemptSchema],
    assessmentScore: { type: Number, min: 0 },
    maxAssessmentScore: { type: Number, default: 100, max: 100 },
    resourcesViewed: [String],
    caseStudiesViewed: [String],
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserStageProgressSchema.index({ podAttemptId: 1, stageId: 1 }, { unique: true });

export const UserStageProgress: Model<IUserStageProgress> = mongoose.model<IUserStageProgress>('UserStageProgress', UserStageProgressSchema);
