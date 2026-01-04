import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProblemSkillWeight {
  skillId: string;
  weight: number;
}

export interface IProblemPodRef {
  pod: Types.ObjectId;
  order: number;
  weight: number;
}

export interface IProblem extends Document {
  slug: string;
  title: string;
  description?: string;
  description_md?: string;
  tagline?: string;
  context_md?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  skills: IProblemSkillWeight[];
  version: number;
  isPublic: boolean;
  pods: IProblemPodRef[];
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSkillWeightSchema = new Schema<IProblemSkillWeight>({
  skillId: { type: String, required: true },
  weight: { type: Number, min: 0, required: true },
});

const ProblemPodRefSchema = new Schema<IProblemPodRef>({
  pod: { type: Schema.Types.ObjectId, ref: 'Pod', required: true },
  order: { type: Number, required: true },
  weight: { type: Number, min: 0, required: true },
});

const ProblemSchema = new Schema<IProblem>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: String,
    description_md: String,
    tagline: String,
    context_md: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true, index: true },
    estimatedHours: { type: Number, required: true },
    skills: [ProblemSkillWeightSchema],
    version: { type: Number, default: 1 },
    isPublic: { type: Boolean, default: false, index: true },
    pods: [ProblemPodRefSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProblemSchema.index({ isPublic: 1, difficulty: 1 });

export const Problem: Model<IProblem> = mongoose.model<IProblem>('Problem', ProblemSchema);
