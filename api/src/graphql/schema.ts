import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import type { Context, IModels } from "../connectionResolvers.ts";
import type {
  IEduflowClassDocument,
  IEduflowHomeworkDocument,
  IEduflowLessonPlanDocument,
  IEduflowMemberDocument,
  IEduflowNotificationDocument,
  IEduflowSubmissionDocument,
} from "../modules/eduflow/db/definitions/eduflow.ts";
import { ensureDemoData } from "../modules/eduflow/seed.ts";
import {
  HOMEWORK_MANAGE,
  HOMEWORK_READ,
  LESSON_PLAN_APPROVE,
  LESSON_PLAN_MANAGE,
  NOTIFICATION_SEND,
  SUBMISSION_CREATE,
  SUBMISSION_READ,
  SUBMISSION_REVIEW,
} from "../permissions.ts";

// Every type and operation is prefixed with the plugin name: the gateway
// composes all plugins into one supergraph, so names must be unique across it.
export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.9", import: ["@key"])

  type EduflowMember {
    _id: String!
    name: String!
    email: String!
    role: String!
    phone: String
    grade: String
    avatar: String
    parentId: String
    streak: Int!
    longestStreak: Int!
    points: Int!
    lastCompletedDate: String
  }

  type EduflowClass {
    _id: String!
    name: String!
    code: String!
    subject: String!
    teacher: EduflowMember
    students: [EduflowMember!]!
  }

  type EduflowHomework {
    _id: String!
    classId: String!
    teacherId: String!
    title: String!
    description: String
    subject: String!
    dueDate: String!
    points: Int!
    status: String!
    teacher: EduflowMember
    submissions: [EduflowSubmission!]!
    submissionCount: Int!
    approvedCount: Int!
  }

  type EduflowSubmission {
    _id: String!
    homeworkId: String!
    studentId: String!
    imageData: String!
    note: String
    status: String!
    aiFeedback: String
    aiScore: Int
    submittedAt: String
    completedAt: String
    homework: EduflowHomework
    student: EduflowMember
  }

  type EduflowLessonPlan {
    _id: String!
    classId: String!
    teacherId: String!
    title: String!
    subject: String!
    objectives: String
    content: String
    materials: String
    assessment: String
    status: String!
    reviewNote: String
    approvedAt: String
    createdAt: String
    teacher: EduflowMember
  }

  type EduflowNotification {
    _id: String!
    parentId: String!
    studentId: String!
    homeworkId: String
    channel: String!
    message: String!
    status: String!
    createdAt: String
    parent: EduflowMember
    student: EduflowMember
  }

  type EduflowStats {
    totalStudents: Int!
    totalHomework: Int!
    pendingReviews: Int!
    approvedToday: Int!
    averageStreak: Int!
  }

  type EduflowDemo {
    role: String!
    member: EduflowMember
    teacher: EduflowMember
    parent: EduflowMember
    students: [EduflowMember!]!
    classes: [EduflowClass!]!
    homeworks: [EduflowHomework!]!
    submissions: [EduflowSubmission!]!
    lessonPlans: [EduflowLessonPlan!]!
    notifications: [EduflowNotification!]!
    stats: EduflowStats!
  }

  type Query {
    eduflowDemo(role: String!, memberId: String): EduflowDemo!
    eduflowMembers(role: String): [EduflowMember!]!
    eduflowHomeworks(classId: String): [EduflowHomework!]!
    eduflowSubmissions(homeworkId: String, studentId: String): [EduflowSubmission!]!
  }

  type Mutation {
    eduflowSeedDemo: Boolean!
    eduflowCreateHomework(
      title: String!
      description: String
      subject: String!
      dueDate: String!
      points: Int
      classId: String
    ): EduflowHomework!
    eduflowSubmitHomework(
      homeworkId: String!
      studentId: String
      imageData: String!
      note: String
    ): EduflowSubmission!
    eduflowReviewSubmission(
      submissionId: String!
      decision: String!
      feedback: String
    ): EduflowSubmission!
    eduflowNotifyParent(submissionId: String!): EduflowNotification!
    eduflowCreateLessonPlan(
      title: String!
      subject: String!
      objectives: String
      content: String
      materials: String
      assessment: String
      classId: String
    ): EduflowLessonPlan!
    eduflowUpdateLessonPlanStatus(
      planId: String!
      status: String!
    ): EduflowLessonPlan!
  }
`;

const fail = (message: string, code = "BAD_USER_INPUT"): never => {
  throw new GraphQLError(message, { extensions: { code } });
};

const required = <T>(
  value: T | null | undefined,
  message: string,
): NonNullable<T> => {
  if (value === null || value === undefined) {
    throw new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });
  }
  return value as NonNullable<T>;
};

const requireUser = (user: Context["user"]) => {
  if (!user?._id) {
    fail("Login required", "UNAUTHENTICATED");
  }
};

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const daysBetween = (later: Date, earlier: Date) =>
  Math.round((startOfDay(later) - startOfDay(earlier)) / 86_400_000);

const parseDueDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    fail("Enter a valid due date.");
  }
  return date;
};

type AiResult = { score: number; approved: boolean; feedback: string };

// The dummy AI: deterministic, instant, and clearly marked as a mock in the UI.
// Swap this for a vision model without changing the submission workflow.
const runMockAi = (imageData: string): AiResult => {
  if (!imageData || imageData.length < 100) {
    fail("Upload a photo of the completed work first.");
  }

  const score = 74 + (imageData.length % 22);
  const approved = score >= 80;

  return {
    score,
    approved,
    feedback: approved
      ? "I can see the completed working. Every question is answered and the steps are readable. Nice work — keep the streak going!"
      : "I can see most of the work, but one question looks unfinished. Check the last step, correct it, and submit a new photo.",
  };
};

const notifyParent = async (
  models: IModels,
  student: IEduflowMemberDocument,
  homework: IEduflowHomeworkDocument,
  score: number,
  streak: number,
) => {
  if (!student.parentId) {
    return null;
  }

  return models.EduflowNotifications.create({
    parentId: student.parentId,
    studentId: String(student._id),
    homeworkId: String(homework._id),
    channel: "sms",
    message: `Edu Flow: ${student.name} completed "${homework.title}" with ${score}% and is on a ${streak}-day streak. 🔥`,
    status: "sent_dummy",
    createdAt: new Date(),
  });
};

const applyApproval = async (
  models: IModels,
  submission: IEduflowSubmissionDocument,
) => {
  const homework = required<IEduflowHomeworkDocument>(
    await models.EduflowHomework.findById(submission.homeworkId),
    "Homework no longer exists.",
  );
  const student = required<IEduflowMemberDocument>(
    await models.EduflowMembers.findById(submission.studentId),
    "Student no longer exists.",
  );

  const now = new Date();
  const previous = student.lastCompletedDate;
  const gap = previous ? daysBetween(now, previous) : null;

  let streak = 1;
  if (gap === 0) {
    streak = Math.max(student.streak, 1);
  } else if (gap === 1) {
    streak = student.streak + 1;
  }

  const longestStreak = Math.max(student.longestStreak, streak);

  await models.EduflowMembers.findByIdAndUpdate(student._id, {
    $set: {
      streak,
      longestStreak,
      lastCompletedDate: now,
    },
    $inc: { points: homework.points + 10 },
  });

  await models.EduflowSubmissions.findByIdAndUpdate(submission._id, {
    $set: { completedAt: now },
  });

  await notifyParent(
    models,
    student,
    homework,
    submission.aiScore ?? 100,
    streak,
  );

  return models.EduflowSubmissions.findById(submission._id);
};

const findClass = async (models: IModels, classId?: string) => {
  const classroom = classId
    ? await models.EduflowClasses.findById(classId)
    : await models.EduflowClasses.findOne();

  return required<IEduflowClassDocument>(classroom, "No class is available yet.");
};

const validRole = (role: string) =>
  role === "student" || role === "parent" ? role : "teacher";

export const resolvers = {
  Query: {
    eduflowDemo: async (
      _parent: unknown,
      { role, memberId }: { role: string; memberId?: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_READ);
      await ensureDemoData(models);

      const [
        members,
        classes,
        homeworks,
        submissions,
        lessonPlans,
        notifications,
      ] = await Promise.all([
        models.EduflowMembers.find().sort({ createdAt: 1 }),
        models.EduflowClasses.find().sort({ createdAt: 1 }),
        models.EduflowHomework.find().sort({ dueDate: 1 }),
        models.EduflowSubmissions.find().sort({ submittedAt: -1 }),
        models.EduflowLessonPlans.find().sort({ createdAt: -1 }),
        models.EduflowNotifications.find().sort({ createdAt: -1 }),
      ]);

      const teachers = members.filter((member) => member.role === "teacher");
      const parents = members.filter((member) => member.role === "parent");
      const students = members.filter((member) => member.role === "student");
      const normalizedRole = validRole(role);

      const teacher = teachers[0] ?? null;

      let member: IEduflowMemberDocument | null = null;
      let visibleStudents: IEduflowMemberDocument[] = students;
      let visibleHomeworks: IEduflowHomeworkDocument[] = homeworks;
      let visibleSubmissions: IEduflowSubmissionDocument[] = submissions;
      let visibleNotifications: IEduflowNotificationDocument[] = notifications;
      let parent: IEduflowMemberDocument | null = parents[0] ?? null;

      if (normalizedRole === "student") {
        member =
          students.find((student) => String(student._id) === memberId) ??
          students[0] ??
          null;

        if (member) {
          const currentMember = member;
          const classIds = classes
            .filter((classroom) =>
              classroom.studentIds.includes(String(currentMember._id)),
            )
            .map((classroom) => String(classroom._id));

          visibleStudents = [currentMember];
          visibleHomeworks = homeworks.filter((homework) =>
            classIds.includes(homework.classId),
          );
          visibleSubmissions = submissions.filter(
            (submission) =>
              submission.studentId === String(currentMember._id),
          );
          visibleNotifications = notifications.filter(
            (notification) =>
              notification.studentId === String(currentMember._id),
          );
          parent =
            parents.find(
              (candidate) =>
                String(candidate._id) === currentMember.parentId,
            ) ?? null;
        }
      }

      if (normalizedRole === "parent") {
        member =
          parents.find((candidate) => String(candidate._id) === memberId) ??
          parents[0] ??
          null;

        if (member) {
          const currentMember = member;
          visibleStudents = students.filter(
            (student) => student.parentId === String(currentMember._id),
          );
          const childIds = visibleStudents.map((student) =>
            String(student._id),
          );
          const classIds = classes
            .filter((classroom) =>
              classroom.studentIds.some((studentId) =>
                childIds.includes(studentId),
              ),
            )
            .map((classroom) => String(classroom._id));

          visibleHomeworks = homeworks.filter((homework) =>
            classIds.includes(homework.classId),
          );
          visibleSubmissions = submissions.filter((submission) =>
            childIds.includes(submission.studentId),
          );
          visibleNotifications = notifications.filter(
            (notification) =>
              notification.parentId === String(currentMember._id),
          );
          parent = currentMember;
        }
      }

      const averageStreak =
        visibleStudents.length > 0
          ? Math.round(
              visibleStudents.reduce(
                (total, student) => total + student.streak,
                0,
              ) / visibleStudents.length,
            )
          : 0;

      return {
        role: normalizedRole,
        member,
        teacher,
        parent,
        students: visibleStudents,
        classes,
        homeworks: visibleHomeworks,
        submissions: visibleSubmissions,
        lessonPlans,
        notifications: visibleNotifications,
        stats: {
          totalStudents: visibleStudents.length,
          totalHomework: visibleHomeworks.length,
          pendingReviews: visibleSubmissions.filter((submission) =>
            ["submitted", "ai_checked", "needs_work"].includes(
              submission.status,
            ),
          ).length,
          approvedToday: visibleSubmissions.filter(
            (submission) =>
              submission.status === "approved" &&
              submission.completedAt &&
              startOfDay(submission.completedAt) === startOfDay(new Date()),
          ).length,
          averageStreak,
        },
      };
    },

    eduflowMembers: async (
      _parent: unknown,
      { role }: { role?: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_READ);
      await ensureDemoData(models);
      return models.EduflowMembers.find(role ? { role } : {}).sort({
        createdAt: 1,
      });
    },

    eduflowHomeworks: async (
      _parent: unknown,
      { classId }: { classId?: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_READ);
      await ensureDemoData(models);
      return models.EduflowHomework.find(classId ? { classId } : {}).sort({
        dueDate: 1,
      });
    },

    eduflowSubmissions: async (
      _parent: unknown,
      { homeworkId, studentId }: { homeworkId?: string; studentId?: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(SUBMISSION_READ);
      await ensureDemoData(models);

      const filter: Record<string, string> = {};
      if (homeworkId) filter.homeworkId = homeworkId;
      if (studentId) filter.studentId = studentId;

      return models.EduflowSubmissions.find(filter).sort({ submittedAt: -1 });
    },
  },

  Mutation: {
    eduflowSeedDemo: async (
      _parent: unknown,
      _args: unknown,
      { models, user }: Context,
    ) => {
      requireUser(user);
      return ensureDemoData(models);
    },

    eduflowCreateHomework: async (
      _parent: unknown,
      {
        title,
        description,
        subject,
        dueDate,
        points,
        classId,
      }: {
        title: string;
        description?: string;
        subject: string;
        dueDate: string;
        points?: number;
        classId?: string;
      },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_MANAGE);
      await ensureDemoData(models);
      const classroom = await findClass(models, classId);

      return models.EduflowHomework.create({
        classId: String(classroom._id),
        teacherId: classroom.teacherId,
        title: title.trim(),
        description,
        subject: subject.trim(),
        dueDate: parseDueDate(dueDate),
        points: Math.min(100, Math.max(1, points ?? 10)),
        status: "assigned",
        createdAt: new Date(),
      });
    },

    eduflowSubmitHomework: async (
      _parent: unknown,
      {
        homeworkId,
        studentId,
        imageData,
        note,
      }: {
        homeworkId: string;
        studentId?: string;
        imageData: string;
        note?: string;
      },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(SUBMISSION_CREATE);
      await ensureDemoData(models);

      required<IEduflowHomeworkDocument>(
        await models.EduflowHomework.findById(homeworkId),
        "Homework not found.",
      );

      const student = required<IEduflowMemberDocument>(
        studentId
          ? await models.EduflowMembers.findById(studentId)
          : await models.EduflowMembers.findOne({ role: "student" }),
        "Student not found.",
      );

      if (student.role !== "student") {
        fail("Student not found.", "NOT_FOUND");
      }

      const ai = runMockAi(imageData);
      const existing = await models.EduflowSubmissions.findOne({
        homeworkId,
        studentId: String(student._id),
      });

      const submission = await models.EduflowSubmissions.findOneAndUpdate(
        { homeworkId, studentId: String(student._id) },
        {
          $set: {
            imageData,
            note,
            status: ai.approved ? "approved" : "needs_work",
            aiScore: ai.score,
            aiFeedback: ai.feedback,
            submittedAt: new Date(),
            completedAt: ai.approved ? new Date() : null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (!submission) {
        fail("Could not save the submission.", "INTERNAL_SERVER_ERROR");
      }

      if (ai.approved && existing?.status !== "approved") {
        return applyApproval(models, submission);
      }

      return models.EduflowSubmissions.findById(submission._id);
    },

    eduflowReviewSubmission: async (
      _parent: unknown,
      {
        submissionId,
        decision,
        feedback,
      }: { submissionId: string; decision: string; feedback?: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(SUBMISSION_REVIEW);

      const submission = required<IEduflowSubmissionDocument>(
        await models.EduflowSubmissions.findById(submissionId),
        "Submission not found.",
      );

      const status = decision === "approved" ? "approved" : "needs_work";
      const wasApproved = submission.status === "approved";

      const updated = required<IEduflowSubmissionDocument>(
        await models.EduflowSubmissions.findByIdAndUpdate(
          submissionId,
          {
            $set: {
              status,
              aiFeedback: feedback ?? submission.aiFeedback,
              completedAt: status === "approved" ? new Date() : null,
            },
          },
          { new: true },
        ),
        "Submission not found.",
      );

      if (status === "approved" && !wasApproved) {
        return applyApproval(models, updated);
      }

      return updated;
    },

    eduflowNotifyParent: async (
      _parent: unknown,
      { submissionId }: { submissionId: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(NOTIFICATION_SEND);

      const submission = required<IEduflowSubmissionDocument>(
        await models.EduflowSubmissions.findById(submissionId),
        "Submission not found.",
      );
      const homework = required<IEduflowHomeworkDocument>(
        await models.EduflowHomework.findById(submission.homeworkId),
        "Homework not found.",
      );
      const student = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(submission.studentId),
        "Student not found.",
      );
      const parentId = required<string>(
        student.parentId,
        "This student has no parent contact on file.",
      );

      return models.EduflowNotifications.create({
        parentId,
        studentId: String(student._id),
        homeworkId: String(homework._id),
        channel: "sms",
        message: `Edu Flow (dummy SMS): ${student.name} submitted "${homework.title}". Latest check: ${submission.aiScore ?? "—"}%.`,
        status: "sent_dummy",
        createdAt: new Date(),
      });
    },

    eduflowCreateLessonPlan: async (
      _parent: unknown,
      {
        title,
        subject,
        objectives,
        content,
        materials,
        assessment,
        classId,
      }: {
        title: string;
        subject: string;
        objectives?: string;
        content?: string;
        materials?: string;
        assessment?: string;
        classId?: string;
      },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(LESSON_PLAN_MANAGE);
      await ensureDemoData(models);
      const classroom = await findClass(models, classId);

      return models.EduflowLessonPlans.create({
        classId: String(classroom._id),
        teacherId: classroom.teacherId,
        title: title.trim(),
        subject: subject.trim(),
        objectives,
        content,
        materials,
        assessment,
        status: "draft",
        createdAt: new Date(),
      });
    },

    eduflowUpdateLessonPlanStatus: async (
      _parent: unknown,
      { planId, status }: { planId: string; status: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);

      if (!["draft", "review", "approved"].includes(status)) {
        fail("Unknown lesson plan status.");
      }

      await checkPermission(
        status === "approved" ? LESSON_PLAN_APPROVE : LESSON_PLAN_MANAGE,
      );

      return required<IEduflowLessonPlanDocument>(
        await models.EduflowLessonPlans.findByIdAndUpdate(
          planId,
          {
            $set: {
              status,
              approvedAt: status === "approved" ? new Date() : null,
            },
          },
          { new: true },
        ),
        "Lesson plan not found.",
      );
    },
  },

  EduflowClass: {
    teacher: async (
      parent: IEduflowClassDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.teacherId),
    students: async (
      parent: IEduflowClassDocument,
      _args: unknown,
      { models }: Context,
    ) =>
      models.EduflowMembers.find({ _id: { $in: parent.studentIds } }).sort({
        name: 1,
      }),
  },

  EduflowHomework: {
    teacher: async (
      parent: IEduflowHomeworkDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.teacherId),
    submissions: async (
      parent: IEduflowHomeworkDocument,
      _args: unknown,
      { models }: Context,
    ) =>
      models.EduflowSubmissions.find({ homeworkId: String(parent._id) }).sort({
        submittedAt: -1,
      }),
    submissionCount: async (
      parent: IEduflowHomeworkDocument,
      _args: unknown,
      { models }: Context,
    ) =>
      models.EduflowSubmissions.countDocuments({
        homeworkId: String(parent._id),
      }),
    approvedCount: async (
      parent: IEduflowHomeworkDocument,
      _args: unknown,
      { models }: Context,
    ) =>
      models.EduflowSubmissions.countDocuments({
        homeworkId: String(parent._id),
        status: "approved",
      }),
    dueDate: (parent: IEduflowHomeworkDocument) =>
      parent.dueDate.toISOString(),
  },

  EduflowSubmission: {
    homework: async (
      parent: IEduflowSubmissionDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowHomework.findById(parent.homeworkId),
    student: async (
      parent: IEduflowSubmissionDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.studentId),
    submittedAt: (parent: IEduflowSubmissionDocument) =>
      parent.submittedAt?.toISOString() ?? null,
    completedAt: (parent: IEduflowSubmissionDocument) =>
      parent.completedAt?.toISOString() ?? null,
  },

  EduflowLessonPlan: {
    teacher: async (
      parent: IEduflowLessonPlanDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.teacherId),
    approvedAt: (parent: IEduflowLessonPlanDocument) =>
      parent.approvedAt?.toISOString() ?? null,
    createdAt: (parent: IEduflowLessonPlanDocument) =>
      parent.createdAt?.toISOString() ?? null,
  },

  EduflowNotification: {
    parent: async (
      parent: IEduflowNotificationDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.parentId),
    student: async (
      parent: IEduflowNotificationDocument,
      _args: unknown,
      { models }: Context,
    ) => models.EduflowMembers.findById(parent.studentId),
    createdAt: (parent: IEduflowNotificationDocument) =>
      parent.createdAt?.toISOString() ?? null,
  },

  EduflowMember: {
    lastCompletedDate: (parent: IEduflowMemberDocument) =>
      parent.lastCompletedDate?.toISOString() ?? null,
  },
};
