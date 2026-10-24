import { Schema, type Document } from "mongoose";
import { schemaWrapper } from "erxes-api-shared/utils";

export type EduflowRole = "teacher" | "student" | "parent";
export type EduflowSubmissionStatus =
  | "submitted"
  | "ai_checked"
  | "approved"
  | "needs_work";
export type EduflowLessonPlanStatus = "draft" | "review" | "approved";

export interface IEduflowMember {
  name: string;
  email: string;
  role: EduflowRole;
  phone?: string;
  grade?: string;
  avatar?: string;
  parentId?: string;
  leaderboardVisible: boolean;
  streak: number;
  longestStreak: number;
  points: number;
  lastCompletedDate?: Date;
  createdAt: Date;
}

export interface IEduflowMemberDocument extends IEduflowMember, Document {}

export const eduflowMemberSchema = schemaWrapper(
  new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["teacher", "student", "parent"],
      required: true,
    },
    phone: String,
    grade: String,
    avatar: String,
    parentId: String,
    leaderboardVisible: { type: Boolean, default: true },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    lastCompletedDate: Date,
    createdAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowClass {
  name: string;
  code: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  createdAt: Date;
}

export interface IEduflowClassDocument extends IEduflowClass, Document {}

export const eduflowClassSchema = schemaWrapper(
  new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: String, required: true },
    studentIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowHomework {
  classId: string;
  teacherId: string;
  title: string;
  description?: string;
  subject: string;
  dueDate: Date;
  points: number;
  status: "assigned" | "closed";
  createdAt: Date;
}

export interface IEduflowHomeworkDocument
  extends IEduflowHomework, Document {}

export const eduflowHomeworkSchema = schemaWrapper(
  new Schema({
    classId: { type: String, required: true },
    teacherId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    subject: { type: String, required: true },
    dueDate: { type: Date, required: true },
    points: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ["assigned", "closed"],
      default: "assigned",
    },
    createdAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowSubmission {
  homeworkId: string;
  studentId: string;
  imageData: string;
  note?: string;
  status: EduflowSubmissionStatus;
  aiFeedback?: string;
  aiScore?: number;
  aiProvider?: string;
  earnedPoints: number;
  gradePercent: number;
  submittedAt: Date;
  completedAt?: Date;
}

export interface IEduflowSubmissionDocument
  extends IEduflowSubmission, Document {}

export const eduflowSubmissionSchema = schemaWrapper(
  new Schema({
    homeworkId: { type: String, required: true },
    studentId: { type: String, required: true },
    imageData: { type: String, default: "" },
    note: String,
    status: {
      type: String,
      enum: ["submitted", "ai_checked", "approved", "needs_work"],
      default: "submitted",
    },
    aiFeedback: String,
    aiScore: Number,
    aiProvider: String,
    earnedPoints: { type: Number, default: 0 },
    gradePercent: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    completedAt: Date,
  }),
);

eduflowSubmissionSchema.index(
  { homeworkId: 1, studentId: 1 },
  { unique: true },
);

export interface IEduflowAttachment {
  name: string;
  mimeType: string;
  size: number;
  data: string;
}

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true },
  },
  { _id: false },
);

export interface IEduflowLessonPlan {
  classId: string;
  teacherId: string;
  title: string;
  subject: string;
  objectives?: string;
  content?: string;
  materials?: string;
  assessment?: string;
  attachments: IEduflowAttachment[];
  status: EduflowLessonPlanStatus;
  reviewNote?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface IEduflowLessonPlanDocument
  extends IEduflowLessonPlan, Document {}

export const eduflowLessonPlanSchema = schemaWrapper(
  new Schema({
    classId: { type: String, required: true },
    teacherId: { type: String, required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    objectives: String,
    content: String,
    materials: String,
    assessment: String,
    attachments: { type: [attachmentSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "review", "approved"],
      default: "draft",
    },
    reviewNote: String,
    approvedAt: Date,
    createdAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowNotification {
  parentId: string;
  studentId: string;
  homeworkId?: string;
  channel: "sms";
  message: string;
  status: "queued" | "sent" | "sent_dummy" | "failed";
  providerId?: string;
  error?: string;
  createdAt: Date;
}

export interface IEduflowNotificationDocument
  extends IEduflowNotification, Document {}

export const eduflowNotificationSchema = schemaWrapper(
  new Schema({
    parentId: { type: String, required: true },
    studentId: { type: String, required: true },
    homeworkId: String,
    channel: { type: String, enum: ["sms"], default: "sms" },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "sent_dummy", "failed"],
      default: "queued",
    },
    providerId: String,
    error: String,
    createdAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowConcept {
  studentId: string;
  subject: string;
  topic: string;
  mastery: number;
  attempts: number;
  correct: number;
  updatedAt: Date;
}

export interface IEduflowConceptDocument
  extends IEduflowConcept, Document {}

export const eduflowConceptSchema = schemaWrapper(
  new Schema({
    studentId: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    mastery: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  }),
);

export interface IEduflowQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: number;
  explanation: string;
}

export interface IEduflowQuizAnswer {
  questionIndex: number;
  selectedIndex: number;
  correct: boolean;
}

const quizQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    difficulty: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

const quizAnswerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false },
);

export interface IEduflowQuiz {
  studentId: string;
  subject: string;
  topic: string;
  status: "active" | "completed";
  questions: IEduflowQuizQuestion[];
  answers: IEduflowQuizAnswer[];
  correctStreak: number;
  bestStreak: number;
  currentDifficulty: number;
  xpEarned: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface IEduflowQuizDocument extends IEduflowQuiz, Document {}

export const eduflowQuizSchema = schemaWrapper(
  new Schema({
    studentId: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    questions: { type: [quizQuestionSchema], default: [] },
    answers: { type: [quizAnswerSchema], default: [] },
    correctStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    currentDifficulty: { type: Number, default: 1 },
    xpEarned: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
  }),
);
