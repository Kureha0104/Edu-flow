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
    submittedAt: { type: Date, default: Date.now },
    completedAt: Date,
  }),
);

eduflowSubmissionSchema.index(
  { homeworkId: 1, studentId: 1 },
  { unique: true },
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
  status: "queued" | "sent_dummy";
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
      enum: ["queued", "sent_dummy"],
      default: "queued",
    },
    createdAt: { type: Date, default: Date.now },
  }),
);
