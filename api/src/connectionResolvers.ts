import type { IMainContext } from "erxes-api-shared/core-types";
import { createGenerateModels } from "erxes-api-shared/utils";
import type { Connection, Model } from "mongoose";
import {
  type IEduflowClassDocument,
  type IEduflowConceptDocument,
  type IEduflowHomeworkDocument,
  type IEduflowLessonPlanDocument,
  type IEduflowMemberDocument,
  type IEduflowNotificationDocument,
  type IEduflowQuizDocument,
  type IEduflowSubmissionDocument,
  eduflowClassSchema,
  eduflowConceptSchema,
  eduflowHomeworkSchema,
  eduflowLessonPlanSchema,
  eduflowMemberSchema,
  eduflowNotificationSchema,
  eduflowQuizSchema,
  eduflowSubmissionSchema,
} from "./modules/eduflow/db/definitions/eduflow.ts";

export interface IModels {
  EduflowMembers: Model<IEduflowMemberDocument>;
  EduflowClasses: Model<IEduflowClassDocument>;
  EduflowHomework: Model<IEduflowHomeworkDocument>;
  EduflowSubmissions: Model<IEduflowSubmissionDocument>;
  EduflowLessonPlans: Model<IEduflowLessonPlanDocument>;
  EduflowNotifications: Model<IEduflowNotificationDocument>;
  EduflowConcepts: Model<IEduflowConceptDocument>;
  EduflowQuizzes: Model<IEduflowQuizDocument>;
}

/**
 * GraphQL resolver context: what `apolloServerContext` in main.ts returns.
 * `subdomain` is the tenant, `models` are bound to that tenant's database.
 */
// IMainContext declares `models?: any`, which would absorb the typed IModels
// in a plain intersection — Omit it first so resolvers get real types.
export type Context = Omit<IMainContext, "models"> & {
  subdomain: string;
  models: IModels;
};

// Every model must come from this factory: createGenerateModels binds the
// connection for the request's tenant (Mongo `useDb` per organization on
// SaaS), so resolvers never touch another tenant's collections.
const loadClasses = (db: Connection) => {
  const models = {} as IModels;

  models.EduflowMembers = db.model<IEduflowMemberDocument>(
    "eduflow_members",
    eduflowMemberSchema,
  );
  models.EduflowClasses = db.model<IEduflowClassDocument>(
    "eduflow_classes",
    eduflowClassSchema,
  );
  models.EduflowHomework = db.model<IEduflowHomeworkDocument>(
    "eduflow_homework",
    eduflowHomeworkSchema,
  );
  models.EduflowSubmissions = db.model<IEduflowSubmissionDocument>(
    "eduflow_submissions",
    eduflowSubmissionSchema,
  );
  models.EduflowLessonPlans = db.model<IEduflowLessonPlanDocument>(
    "eduflow_lesson_plans",
    eduflowLessonPlanSchema,
  );
  models.EduflowNotifications = db.model<IEduflowNotificationDocument>(
    "eduflow_notifications",
    eduflowNotificationSchema,
  );
  models.EduflowConcepts = db.model<IEduflowConceptDocument>(
    "eduflow_concepts",
    eduflowConceptSchema,
  );
  models.EduflowQuizzes = db.model<IEduflowQuizDocument>(
    "eduflow_quizzes",
    eduflowQuizSchema,
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
