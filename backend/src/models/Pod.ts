import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPodResource {
  type: 'video' | 'pdf' | 'link' | 'mcq';
  title: string;
  url?: string;
  content?: string;
}

export interface IPod extends Document {
  problem: Types.ObjectId;
  title: string;
  phase: 'research' | 'design' | 'implementation' | 'reflection';
  order: number;
  resources?: IPodResource[];
  expectedOutputs?: string[];
  description_md?: string;
  content_file_path?: string;
  mode?: 'single_stage' | 'multi_stage';
  estimatedMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PodResourceSchema = new Schema<IPodResource>({
  type: { type: String, enum: ['video', 'pdf', 'link', 'mcq'], required: true },
  title: { type: String, required: true },
  url: String,
  content: String,
});

const PodSchema = new Schema<IPod>(
  {
    problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    title: { type: String, required: true },
    phase: { type: String, enum: ['research', 'design', 'implementation', 'reflection'], required: true },
    order: { type: Number, required: true },
    resources: [PodResourceSchema],
    expectedOutputs: [String],
    description_md: String,
    content_file_path: String,
    mode: { type: String, enum: ['single_stage', 'multi_stage'], default: 'multi_stage' },
    estimatedMinutes: { type: Number, default: 60 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PodSchema.index({ problem: 1, order: 1 }, { unique: true });

export const Pod: Model<IPod> = mongoose.model<IPod>('Pod', PodSchema);
