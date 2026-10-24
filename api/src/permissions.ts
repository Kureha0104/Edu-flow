import type { IPermissionConfig } from "erxes-api-shared/core-types";
import { manifest } from "./config.ts";

// Action names are global across the platform, not local to this plugin.
export const HOMEWORK_READ = "eduflowHomeworkRead";
export const HOMEWORK_MANAGE = "eduflowHomeworkManage";
export const SUBMISSION_READ = "eduflowSubmissionRead";
export const SUBMISSION_CREATE = "eduflowSubmissionCreate";
export const SUBMISSION_REVIEW = "eduflowSubmissionReview";
export const LESSON_PLAN_READ = "eduflowLessonPlanRead";
export const LESSON_PLAN_MANAGE = "eduflowLessonPlanManage";
export const LESSON_PLAN_APPROVE = "eduflowLessonPlanApprove";
export const NOTIFICATION_READ = "eduflowNotificationRead";
export const NOTIFICATION_SEND = "eduflowNotificationSend";
export const QUIZ_READ = "eduflowQuizRead";
export const QUIZ_PLAY = "eduflowQuizPlay";
export const DEMO_RESET = "eduflowDemoReset";

const allScope = {
  name: "all" as const,
  description: "All records in this tenant",
};

export const permissions: IPermissionConfig = {
  plugin: manifest.name,
  modules: [
    {
      name: "eduflowHomework",
      description: `${manifest.title} homework assignments`,
      scopeField: null,
      ownerFields: [],
      scopes: [allScope],
      actions: [
        {
          name: HOMEWORK_READ,
          title: "Read homework",
          description: `View ${manifest.title} homework and submissions`,
        },
        {
          name: HOMEWORK_MANAGE,
          title: "Manage homework",
          description: `Create and edit ${manifest.title} homework`,
        },
      ],
    },
    {
      name: "eduflowSubmissions",
      description: `${manifest.title} student submissions`,
      scopeField: null,
      ownerFields: [],
      scopes: [allScope],
      actions: [
        {
          name: SUBMISSION_READ,
          title: "Read submissions",
          description: `View ${manifest.title} student submissions`,
        },
        {
          name: SUBMISSION_CREATE,
          title: "Submit homework",
          description: `Upload ${manifest.title} homework photos`,
        },
        {
          name: SUBMISSION_REVIEW,
          title: "Review submissions",
          description: `Approve or request changes on ${manifest.title} submissions`,
        },
      ],
    },
    {
      name: "eduflowLessonPlans",
      description: `${manifest.title} lesson plans`,
      scopeField: null,
      ownerFields: [],
      scopes: [allScope],
      actions: [
        {
          name: LESSON_PLAN_READ,
          title: "Read lesson plans",
          description: `View ${manifest.title} lesson plans`,
        },
        {
          name: LESSON_PLAN_MANAGE,
          title: "Manage lesson plans",
          description: `Create and submit ${manifest.title} lesson plans`,
        },
        {
          name: LESSON_PLAN_APPROVE,
          title: "Approve lesson plans",
          description: `Approve ${manifest.title} lesson plans`,
        },
      ],
    },
    {
      name: "eduflowQuiz",
      description: `${manifest.title} adaptive practice quizzes`,
      scopeField: null,
      ownerFields: [],
      scopes: [allScope],
      actions: [
        {
          name: QUIZ_READ,
          title: "Read practice quizzes",
          description: `View ${manifest.title} weak concepts and quiz history`,
        },
        {
          name: QUIZ_PLAY,
          title: "Play practice quizzes",
          description: `Start and answer ${manifest.title} adaptive quizzes`,
        },
      ],
    },
    {
      name: "eduflowNotifications",
      description: `${manifest.title} parent notifications`,
      scopeField: null,
      ownerFields: [],
      scopes: [allScope],
      actions: [
        {
          name: NOTIFICATION_READ,
          title: "Read parent notifications",
          description: `View ${manifest.title} parent notifications`,
        },
        {
          name: NOTIFICATION_SEND,
          title: "Notify parents",
          description: `Send ${manifest.title} parent notifications`,
        },
        {
          name: DEMO_RESET,
          title: "Reset demo data",
          description: `Reset ${manifest.title} demo school data`,
        },
      ],
    },
  ],
};
