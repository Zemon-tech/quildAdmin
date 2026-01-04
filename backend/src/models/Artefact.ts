import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IArtefact extends Document {
  podAttempt: Types.ObjectId;
  type: 'markdown' | 'url' | 'file' | 'github_repo';
  content?: string;
  url?: string;
  fileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtefactSchema = new Schema<IArtefact>(
  {
    podAttempt: { type: Schema.Types.ObjectId, ref: 'PodAttempt', required: true, index: true },
    type: { type: String, enum: ['markdown', 'url', 'file', 'github_repo'], required: true },
    content: String,
    url: String,
    fileId: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Artefact: Model<IArtefact> = mongoose.model<IArtefact>('Artefact', ArtefactSchema);
