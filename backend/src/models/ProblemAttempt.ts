import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProblemAttempt extends Document {
  userId: string;
  problem: Types.ObjectId;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProblemAttemptSchema = new Schema<IProblemAttempt>(
  {
    userId: { type: String, required: true, index: true },
    problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
    startedAt: { type: Date, required: true },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProblemAttemptSchema.index({ userId: 1, problem: 1, status: 1 });

ProblemAttemptSchema.statics.findOrCreate = async function (filter: any, attrs: Partial<IProblemAttempt>) {
  let attempt = await this.findOne(filter);
  if (!attempt) {
    attempt = await this.create(attrs);
  }
  return attempt;
};

export const ProblemAttempt: Model<IProblemAttempt> = mongoose.model<IProblemAttempt>('ProblemAttempt', ProblemAttemptSchema);
