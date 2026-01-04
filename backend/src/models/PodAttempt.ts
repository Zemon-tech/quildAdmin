import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPodAttempt extends Document {
  userId: string;
  problemAttempt: Types.ObjectId;
  pod: Types.ObjectId;
  status: 'active' | 'completed';
  startedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PodAttemptSchema = new Schema<IPodAttempt>(
  {
    userId: { type: String, required: true, index: true },
    problemAttempt: { type: Schema.Types.ObjectId, ref: 'ProblemAttempt', required: true, index: true },
    pod: { type: Schema.Types.ObjectId, ref: 'Pod', required: true, index: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
    startedAt: { type: Date, required: true },
    submittedAt: Date,
    completedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PodAttemptSchema.index({ userId: 1, pod: 1, status: 1 });
PodAttemptSchema.index({ userId: 1, pod: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

export const PodAttempt: Model<IPodAttempt> = mongoose.model<IPodAttempt>('PodAttempt', PodAttemptSchema);
