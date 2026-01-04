import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfile extends Document {
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

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: String,
    username: String,
    firstName: String,
    lastName: String,
    avatarUrl: String,
    backgroundUrl: String,
    backgroundPositionX: { type: Number, default: 50 },
    backgroundPositionY: { type: Number, default: 50 },
    bio: String,
    studentInstitution: String,
    studentDegree: String,
    professionRole: String,
    professionOrg: String,
    experienceYears: Number,
    studentYear: Number,
    location: String,
    githubUrl: String,
    linkedinUrl: String,
    twitterUrl: String,
    kaggleUrl: String,
    xUrl: String,
    bskyUrl: String,
    websiteUrl: String,
    otherSocials: [String],
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en-US' },
    timezone: { type: String, default: 'UTC' },
    emailNotifications: {
      podUpdates: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    inAppNotifications: {
      podReminders: { type: Boolean, default: true },
      reviewRequests: { type: Boolean, default: true },
      collaborationRequests: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
    },
    profileVisibility: { type: String, enum: ['public', 'private', 'unlisted'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showSocialLinks: { type: Boolean, default: true },
    apiKey: String,
    apiEnabled: { type: Boolean, default: false },
    organizationId: String,
    role: String,
    subscriptionTier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserProfileSchema.statics.upsertForUser = async function (attrs: Partial<IUserProfile>) {
  const profile = await this.findOneAndUpdate(
    { userId: attrs.userId },
    { $set: attrs },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return profile;
};

export const UserProfile: Model<IUserProfile> = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
