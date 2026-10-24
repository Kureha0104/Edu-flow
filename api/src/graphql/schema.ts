import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import type { Context, IModels } from "../connectionResolvers.ts";
import type {
  IEduflowClassDocument,
  IEduflowConceptDocument,
  IEduflowHomeworkDocument,
  IEduflowLessonPlanDocument,
  IEduflowMemberDocument,
  IEduflowNotificationDocument,
  IEduflowQuizDocument,
  IEduflowQuizQuestion,
  IEduflowSubmissionDocument,
} from "../modules/eduflow/db/definitions/eduflow.ts";
import {
  aiInfo,
  assessLessonPlan,
  checkHomeworkImage,
  generateLessonPlan,
  type LessonPlanDraft,
} from "../modules/eduflow/ai.ts";
import { buildQuizQuestions, pickQuestion } from "../modules/eduflow/quizBank.ts";
import { ensureDemoData } from "../modules/eduflow/seed.ts";
import { sendParentSms } from "../modules/eduflow/sms.ts";
import {
  DEMO_RESET,
  HOMEWORK_MANAGE,
  HOMEWORK_READ,
  LESSON_PLAN_APPROVE,
  LESSON_PLAN_MANAGE,
  NOTIFICATION_SEND,
  QUIZ_PLAY,
  QUIZ_READ,
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
    parentPhone: String
    leaderboardVisible: Boolean!
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
    aiProvider: String
    earnedPoints: Int!
    gradePercent: Int!
    submittedAt: String
    completedAt: String
    homework: EduflowHomework
    student: EduflowMember
  }

  type EduflowAttachment {
    name: String!
    mimeType: String!
    size: Int!
    data: String!
  }

  input EduflowAttachmentInput {
    name: String!
    mimeType: String!
    size: Int!
    data: String!
  }

  type EduflowActivityStage {
    name: String!
    minutes: Int!
    description: String!
    childrenRole: String!
  }

  input EduflowActivityStageInput {
    name: String!
    minutes: Int!
    description: String!
    childrenRole: String!
  }

  type EduflowGeneratedPlan {
    title: String!
    ageGroup: String!
    duration: Int!
    learningArea: String!
    goals: String!
    learningObjectives: [String!]!
    materials: String!
    activities: [EduflowActivityStage!]!
    childrenParticipation: String!
    differentiation: String!
    assessment: String!
    qualityScore: Int!
    qualityIssues: [String!]!
  }

  input EduflowPlanRequest {
    group: String!
    learningArea: String!
    topic: String!
    duration: Int!
    instructions: String
    currentPlan: String
  }

  type EduflowLessonPlan {
    _id: String!
    classId: String!
    teacherId: String!
    title: String!
    subject: String!
    objectives: String
    goals: String
    learningObjectives: [String!]!
    content: String
    materials: String
    activities: [EduflowActivityStage!]!
    childrenParticipation: String
    differentiation: String
    assessment: String
    ageGroup: String
    duration: Int
    learningArea: String
    qualityScore: Int
    qualityIssues: [String!]!
    source: String
    attachments: [EduflowAttachment!]!
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
    providerId: String
    error: String
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
    homeworkGrade: Int!
  }

  type EduflowLeaderboardEntry {
    rank: Int!
    member: EduflowMember!
    grade: Int!
    streak: Int!
    approved: Int!
    total: Int!
  }

  type EduflowAiInfo {
    configured: Boolean!
    provider: String!
    model: String!
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

  type EduflowConcept {
    _id: String!
    studentId: String!
    subject: String!
    topic: String!
    mastery: Int!
    attempts: Int!
    correct: Int!
    updatedAt: String
  }

  type EduflowQuizQuestion {
    prompt: String!
    options: [String!]!
    difficulty: Int!
  }

  type EduflowQuiz {
    _id: String!
    studentId: String!
    subject: String!
    topic: String!
    status: String!
    questions: [EduflowQuizQuestion!]!
    currentQuestionIndex: Int!
    correctStreak: Int!
    bestStreak: Int!
    currentDifficulty: Int!
    xpEarned: Int!
    totalQuestions: Int!
    answeredCount: Int!
    correctCount: Int!
    createdAt: String
    completedAt: String
  }

  type EduflowAnswerResult {
    correct: Boolean!
    correctIndex: Int!
    explanation: String!
    quiz: EduflowQuiz!
  }

  type EduflowPractice {
    member: EduflowMember!
    concepts: [EduflowConcept!]!
    activeQuiz: EduflowQuiz
    completedQuizzes: [EduflowQuiz!]!
  }

  type EduflowSession {
    member: EduflowMember!
  }

  type Query {
    eduflowDemo(role: String!, memberId: String): EduflowDemo!
    eduflowPractice(studentId: String!): EduflowPractice!
    eduflowLeaderboard: [EduflowLeaderboardEntry!]!
    eduflowAiInfo: EduflowAiInfo!
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
      gradePercent: Int
    ): EduflowSubmission!
    eduflowNotifyParent(
      submissionId: String!
      message: String
    ): EduflowNotification!
    eduflowCreateLessonPlan(
      title: String!
      subject: String!
      objectives: String
      goals: String
      learningObjectives: [String!]
      content: String
      materials: String
      activities: [EduflowActivityStageInput!]
      childrenParticipation: String
      differentiation: String
      assessment: String
      ageGroup: String
      duration: Int
      learningArea: String
      qualityScore: Int
      qualityIssues: [String!]
      source: String
      classId: String
      attachments: [EduflowAttachmentInput!]
    ): EduflowLessonPlan!
    eduflowGenerateLessonPlan(request: EduflowPlanRequest!): EduflowGeneratedPlan!
    eduflowAssessPlan(planId: String!): EduflowLessonPlan!
    eduflowSetLeaderboardVisibility(
      studentId: String!
      visible: Boolean!
    ): EduflowMember!
    eduflowSetParentPhone(
      studentId: String!
      phone: String!
    ): EduflowMember!
    eduflowUpdateLessonPlanStatus(
      planId: String!
      status: String!
    ): EduflowLessonPlan!
    eduflowLogin(email: String!, password: String!): EduflowSession!
    eduflowStartQuiz(studentId: String!): EduflowQuiz!
    eduflowAnswerQuiz(
      quizId: String!
      questionIndex: Int!
      selectedIndex: Int!
    ): EduflowAnswerResult!
    eduflowResetDemo: Boolean!
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

const gradeForStudent = (
  studentId: string,
  homeworks: IEduflowHomeworkDocument[],
  submissions: IEduflowSubmissionDocument[],
) => {
  const total = homeworks.reduce((sum, homework) => sum + homework.points, 0);
  const earned = submissions
    .filter(
      (submission) =>
        submission.studentId === studentId && submission.status === "approved",
    )
    .reduce((sum, submission) => sum + (submission.earnedPoints ?? 0), 0);

  return total > 0 ? Math.round((earned / total) * 100) : 0;
};

const gradeForGroup = (
  studentIds: string[],
  homeworks: IEduflowHomeworkDocument[],
  submissions: IEduflowSubmissionDocument[],
) => {
  if (studentIds.length === 0) {
    return 0;
  }

  const total = studentIds.reduce(
    (sum, studentId) => sum + gradeForStudent(studentId, homeworks, submissions),
    0,
  );

  return Math.round(total / studentIds.length);
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

  const parent = await models.EduflowMembers.findById(student.parentId);
  if (!parent?.phone) {
    return null;
  }

  const message = `Edu Flow: ${student.name} "${homework.title}" даалгаврыг ${score}% гүйцэтгэж, ${streak} өдрийн цуврал үргэлжлүүллээ. 🔥`;
  const result = await sendParentSms(parent.phone, message);

  return models.EduflowNotifications.create({
    parentId: String(parent._id),
    studentId: String(student._id),
    homeworkId: String(homework._id),
    channel: "sms",
    message,
    status: result.status,
    providerId: result.providerId,
    error: result.error,
    createdAt: new Date(),
  });
};

const bumpStreak = async (
  models: IModels,
  student: IEduflowMemberDocument,
  points: number,
) => {
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
    $set: { streak, longestStreak, lastCompletedDate: now },
    $inc: { points },
  });

  return { streak, longestStreak };
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

  const { streak } = await bumpStreak(
    models,
    student,
    homework.points + 10,
  );

  await models.EduflowSubmissions.findByIdAndUpdate(submission._id, {
    $set: { completedAt: new Date() },
  });

  await notifyParent(
    models,
    student,
    homework,
    submission.gradePercent ?? submission.aiScore ?? 100,
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

      const homeworkGrade = gradeForGroup(
        visibleStudents.map((student) => String(student._id)),
        visibleHomeworks,
        visibleSubmissions,
      );

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
          homeworkGrade,
        },
      };
    },

    eduflowPractice: async (
      _parent: unknown,
      { studentId }: { studentId: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(QUIZ_READ);
      await ensureDemoData(models);

      const member = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(studentId),
        "Сурагч олдсонгүй.",
      );

      if (member.role !== "student") {
        fail("Энэ хэсэг зөвхөн сурагчдад зориулагдсан.", "FORBIDDEN");
      }

      const [concepts, activeQuiz, completedQuizzes] = await Promise.all([
        models.EduflowConcepts.find({ studentId }).sort({ mastery: 1 }),
        models.EduflowQuizzes.findOne({ studentId, status: "active" }).sort({
          createdAt: -1,
        }),
        models.EduflowQuizzes.find({ studentId, status: "completed" })
          .sort({ completedAt: -1 })
          .limit(3),
      ]);

      return { member, concepts, activeQuiz, completedQuizzes };
    },

    eduflowLeaderboard: async (
      _parent: unknown,
      _args: unknown,
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_READ);
      await ensureDemoData(models);

      const [members, homeworks, submissions] = await Promise.all([
        models.EduflowMembers.find({ role: "student" }).sort({ name: 1 }),
        models.EduflowHomework.find(),
        models.EduflowSubmissions.find({ status: "approved" }),
      ]);

      const entries = members
        .filter((member) => member.leaderboardVisible)
        .map((member) => {
          const studentId = String(member._id);
          return {
            member,
            grade: gradeForStudent(studentId, homeworks, submissions),
            streak: member.streak,
            approved: submissions.filter(
              (submission) => submission.studentId === studentId,
            ).length,
            total: homeworks.length,
          };
        })
        .sort(
          (a, b) =>
            b.grade - a.grade ||
            b.streak - a.streak ||
            a.member.name.localeCompare(b.member.name),
        )
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return entries;
    },

    eduflowAiInfo: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context,
    ) => {
      requireUser(user);
      return aiInfo();
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

      const homework = required<IEduflowHomeworkDocument>(
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

      const ai = await checkHomeworkImage({
        title: homework.title,
        subject: homework.subject,
        description: homework.description,
        imageData,
      });
      const approved = ai.score >= 80;
      const gradePercent = approved ? ai.score : 0;
      const earnedPoints = approved
        ? Math.round((homework.points * ai.score) / 100)
        : 0;
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
            status: approved ? "approved" : "needs_work",
            aiScore: ai.score,
            aiProvider: ai.provider,
            aiFeedback: ai.feedback,
            earnedPoints,
            gradePercent,
            submittedAt: new Date(),
            completedAt: approved ? new Date() : null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (!submission) {
        fail("Could not save the submission.", "INTERNAL_SERVER_ERROR");
      }

      if (approved && existing?.status !== "approved") {
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
        gradePercent,
      }: {
        submissionId: string;
        decision: string;
        feedback?: string;
        gradePercent?: number;
      },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(SUBMISSION_REVIEW);

      const submission = required<IEduflowSubmissionDocument>(
        await models.EduflowSubmissions.findById(submissionId),
        "Submission not found.",
      );
      const homework = required<IEduflowHomeworkDocument>(
        await models.EduflowHomework.findById(submission.homeworkId),
        "Homework not found.",
      );

      const status = decision === "approved" ? "approved" : "needs_work";
      const wasApproved = submission.status === "approved";
      const grade = Math.max(
        0,
        Math.min(100, Math.round(gradePercent ?? submission.aiScore ?? 100)),
      );
      const earnedPoints =
        status === "approved" ? Math.round((homework.points * grade) / 100) : 0;

      const updated = required<IEduflowSubmissionDocument>(
        await models.EduflowSubmissions.findByIdAndUpdate(
          submissionId,
          {
            $set: {
              status,
              aiFeedback: feedback ?? submission.aiFeedback,
              gradePercent: status === "approved" ? grade : 0,
              earnedPoints,
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
      {
        submissionId,
        message,
      }: { submissionId: string; message?: string },
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
      const parent = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(parentId),
        "Parent not found.",
      );
      const phone = required<string>(
        parent.phone,
        "This parent has no phone number on file.",
      );
      const body =
        message?.trim().slice(0, 1000) ||
        `Edu Flow: ${student.name} "${homework.title}" даалгавраа илгээлээ. Сүүлийн дүн: ${submission.gradePercent ?? submission.aiScore ?? "—"}%.`;
      const result = await sendParentSms(phone, body);

      return models.EduflowNotifications.create({
        parentId,
        studentId: String(student._id),
        homeworkId: String(homework._id),
        channel: "sms",
        message: body,
        status: result.status,
        providerId: result.providerId,
        error: result.error,
        createdAt: new Date(),
      });
    },

    eduflowCreateLessonPlan: async (
      _parent: unknown,
      {
        title,
        subject,
        objectives,
        goals,
        learningObjectives,
        content,
        materials,
        activities,
        childrenParticipation,
        differentiation,
        assessment,
        ageGroup,
        duration,
        learningArea,
        qualityScore,
        qualityIssues,
        source,
        classId,
        attachments,
      }: {
        title: string;
        subject: string;
        objectives?: string;
        goals?: string;
        learningObjectives?: string[];
        content?: string;
        materials?: string;
        activities?: {
          name: string;
          minutes: number;
          description: string;
          childrenRole: string;
        }[];
        childrenParticipation?: string;
        differentiation?: string;
        assessment?: string;
        ageGroup?: string;
        duration?: number;
        learningArea?: string;
        qualityScore?: number;
        qualityIssues?: string[];
        source?: string;
        classId?: string;
        attachments?: {
          name: string;
          mimeType: string;
          size: number;
          data: string;
        }[];
      },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(LESSON_PLAN_MANAGE);
      await ensureDemoData(models);
      const classroom = await findClass(models, classId);
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const safeAttachments = (attachments ?? []).map((attachment) => {
        if (!allowed.includes(attachment.mimeType)) {
          fail("Зөвхөн PDF, DOC, DOCX файл хавсаргана уу.");
        }
        if (attachment.size > 3 * 1024 * 1024) {
          fail("Файл бүр 3MB-аас бага байх ёстой.");
        }
        if (!attachment.data.startsWith("data:")) {
          fail("Файлын өгөгдөл буруу байна.");
        }
        return {
          name: attachment.name.slice(0, 160),
          mimeType: attachment.mimeType,
          size: attachment.size,
          data: attachment.data,
        };
      });

      return models.EduflowLessonPlans.create({
        classId: String(classroom._id),
        teacherId: classroom.teacherId,
        title: title.trim(),
        subject: subject.trim(),
        objectives,
        goals,
        learningObjectives: learningObjectives ?? [],
        content,
        materials,
        activities: activities ?? [],
        childrenParticipation,
        differentiation,
        assessment,
        ageGroup,
        duration,
        learningArea,
        qualityScore,
        qualityIssues: qualityIssues ?? [],
        source: source ?? "manual",
        attachments: safeAttachments,
        status: "draft",
        createdAt: new Date(),
      });
    },

    eduflowGenerateLessonPlan: async (
      _parent: unknown,
      {
        request,
      }: {
        request: {
          group: string;
          learningArea: string;
          topic: string;
          duration: number;
          instructions?: string;
          currentPlan?: string;
        };
      },
      { user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(LESSON_PLAN_MANAGE);
      return generateLessonPlan(request);
    },

    eduflowAssessPlan: async (
      _parent: unknown,
      { planId }: { planId: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(LESSON_PLAN_MANAGE);
      const plan = required<IEduflowLessonPlanDocument>(
        await models.EduflowLessonPlans.findById(planId),
        "Төлөвлөгөө олдсонгүй.",
      );
      const draft: LessonPlanDraft = {
        title: plan.title,
        ageGroup: plan.ageGroup ?? "5А",
        duration: plan.duration ?? 30,
        learningArea: plan.learningArea ?? plan.subject,
        goals: plan.goals ?? plan.objectives ?? "",
        learningObjectives: plan.learningObjectives ?? [],
        materials: plan.materials ?? "",
        activities: plan.activities.map((activity) => ({
          name: activity.name,
          minutes: activity.minutes,
          description: activity.description,
          childrenRole: activity.childrenRole,
        })),
        childrenParticipation: plan.childrenParticipation ?? "",
        differentiation: plan.differentiation ?? "",
        assessment: plan.assessment ?? "",
        qualityScore: plan.qualityScore ?? 0,
        qualityIssues: plan.qualityIssues ?? [],
      };
      const result = await assessLessonPlan(draft);
      return required<IEduflowLessonPlanDocument>(
        await models.EduflowLessonPlans.findByIdAndUpdate(
          planId,
          {
            $set: {
              qualityScore: result.score,
              qualityIssues: result.issues,
            },
          },
          { new: true },
        ),
        "Төлөвлөгөө олдсонгүй.",
      );
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

    eduflowLogin: async (
      _parent: unknown,
      { email, password }: { email: string; password: string },
      { models, user }: Context,
    ) => {
      requireUser(user);
      await ensureDemoData(models);

      const member = await models.EduflowMembers.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!member || password !== "123456") {
        fail("И-мэйл эсвэл нууц үг буруу байна.", "UNAUTHENTICATED");
      }

      return { member };
    },

    eduflowStartQuiz: async (
      _parent: unknown,
      { studentId }: { studentId: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(QUIZ_PLAY);
      await ensureDemoData(models);

      const member = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(studentId),
        "Сурагч олдсонгүй.",
      );

      if (member.role !== "student") {
        fail("Энэ хэсэг зөвхөн сурагчдад зориулагдсан.", "FORBIDDEN");
      }

      const existing = await models.EduflowQuizzes.findOne({
        studentId,
        status: "active",
      });

      if (existing) {
        return existing;
      }

      const concepts = await models.EduflowConcepts.find({ studentId }).sort({
        mastery: 1,
      });
      const weakest = required<IEduflowConceptDocument>(
        concepts[0],
        "Эхлээд сурах ойлголт бүртгэгдэх ёстой.",
      );

      return models.EduflowQuizzes.create({
        studentId,
        subject: weakest.subject,
        topic: weakest.topic,
        status: "active",
        questions: buildQuizQuestions(weakest.topic),
        answers: [],
        correctStreak: 0,
        bestStreak: 0,
        currentDifficulty: 1,
        xpEarned: 0,
        createdAt: new Date(),
      });
    },

    eduflowAnswerQuiz: async (
      _parent: unknown,
      {
        quizId,
        questionIndex,
        selectedIndex,
      }: { quizId: string; questionIndex: number; selectedIndex: number },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(QUIZ_PLAY);

      const quiz = required<IEduflowQuizDocument>(
        await models.EduflowQuizzes.findById(quizId),
        "Дасгал олдсонгүй.",
      );

      if (quiz.status !== "active") {
        fail("Энэ дасгал аль хэдийн дууссан.", "BAD_USER_INPUT");
      }

      if (questionIndex !== quiz.answers.length) {
        fail("Асуултын дараалал буруу байна.", "BAD_USER_INPUT");
      }

      const question = required<IEduflowQuizQuestion>(
        quiz.questions[questionIndex],
        "Асуулт олдсонгүй.",
      );

      if (
        selectedIndex < 0 ||
        selectedIndex >= question.options.length ||
        !Number.isInteger(selectedIndex)
      ) {
        fail("Хариултаа зөв сонгоно уу.", "BAD_USER_INPUT");
      }

      const correct = selectedIndex === question.correctIndex;
      const correctStreak = correct ? quiz.correctStreak + 1 : 0;

      quiz.correctStreak = correctStreak;
      quiz.bestStreak = Math.max(quiz.bestStreak, correctStreak);
      quiz.currentDifficulty = correct
        ? correctStreak >= 2
          ? Math.min(3, quiz.currentDifficulty + 1)
          : quiz.currentDifficulty
        : Math.max(1, quiz.currentDifficulty - 1);
      quiz.answers.push({ questionIndex, selectedIndex, correct });

      const nextIndex = questionIndex + 1;

      if (nextIndex < quiz.questions.length) {
        const used = quiz.questions.map((item) => item.prompt);
        const replacement = pickQuestion(
          quiz.topic,
          quiz.currentDifficulty,
          used,
        );

        if (replacement) {
          const target = required<IEduflowQuizQuestion>(
            quiz.questions[nextIndex],
            "Дараагийн асуулт олдсонгүй.",
          );
          target.prompt = replacement.prompt;
          target.options = replacement.options;
          target.correctIndex = replacement.correctIndex;
          target.difficulty = replacement.difficulty;
          target.explanation = replacement.explanation;
        }
      } else {
        const total = quiz.questions.length;
        const correctCount = quiz.answers.filter((answer) => answer.correct)
          .length;
        const xp = correctCount * 10 + (correctCount === total ? 20 : 0);

        quiz.status = "completed";
        quiz.completedAt = new Date();
        quiz.xpEarned = xp;

        const concept = await models.EduflowConcepts.findOne({
          studentId: quiz.studentId,
          topic: quiz.topic,
        });

        if (concept) {
          const mastery = Math.max(
            0,
            Math.min(
              100,
              concept.mastery +
                correctCount * 6 -
                (total - correctCount) * 4,
            ),
          );

          await models.EduflowConcepts.findByIdAndUpdate(concept._id, {
            $set: { mastery, updatedAt: new Date() },
            $inc: { attempts: total, correct: correctCount },
          });
        }

        if (correctCount >= 3) {
          const member = required<IEduflowMemberDocument>(
            await models.EduflowMembers.findById(quiz.studentId),
            "Сурагч олдсонгүй.",
          );
          const { streak } = await bumpStreak(models, member, xp);

          if (member.parentId) {
            await models.EduflowNotifications.create({
              parentId: member.parentId,
              studentId: String(member._id),
              channel: "sms",
              message: `Edu Flow: ${member.name} өнөөдрийн дасгалыг ${correctCount}/${total} гүйцэтгэж, ${streak} өдрийн цуврал үргэлжлүүллээ. 🔥`,
              status: "sent_dummy",
              createdAt: new Date(),
            });
          }
        } else {
          await models.EduflowMembers.findByIdAndUpdate(quiz.studentId, {
            $inc: { points: xp },
          });
        }
      }

      await quiz.save();

      return {
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        quiz,
      };
    },

    eduflowResetDemo: async (
      _parent: unknown,
      _args: unknown,
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(DEMO_RESET);

      await Promise.all([
        models.EduflowMembers.deleteMany({}),
        models.EduflowClasses.deleteMany({}),
        models.EduflowHomework.deleteMany({}),
        models.EduflowSubmissions.deleteMany({}),
        models.EduflowLessonPlans.deleteMany({}),
        models.EduflowNotifications.deleteMany({}),
        models.EduflowConcepts.deleteMany({}),
        models.EduflowQuizzes.deleteMany({}),
      ]);

      await ensureDemoData(models);

      return true;
    },

    eduflowSetLeaderboardVisibility: async (
      _parent: unknown,
      { studentId, visible }: { studentId: string; visible: boolean },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_READ);

      const member = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(studentId),
        "Сурагч олдсонгүй.",
      );

      if (member.role !== "student") {
        fail("Зөвхөн сурагчийн тохиргоог өөрчилнө.", "BAD_USER_INPUT");
      }

      return required<IEduflowMemberDocument>(
        await models.EduflowMembers.findByIdAndUpdate(
          studentId,
          { $set: { leaderboardVisible: visible } },
          { new: true },
        ),
        "Сурагч олдсонгүй.",
      );
    },

    eduflowSetParentPhone: async (
      _parent: unknown,
      { studentId, phone }: { studentId: string; phone: string },
      { models, user, checkPermission }: Context,
    ) => {
      requireUser(user);
      await checkPermission(HOMEWORK_MANAGE);

      const student = required<IEduflowMemberDocument>(
        await models.EduflowMembers.findById(studentId),
        "Сурагч олдсонгүй.",
      );
      const parentId = required<string>(
        student.parentId,
        "Энэ сурагчид эцэг эх холбогдоогүй байна.",
      );
      const normalized = phone.trim().replace(/[^+\d]/g, "");

      if (!/^\+?\d{6,15}$/.test(normalized)) {
        fail("Утасны дугаараа зөв оруулна уу. Жишээ: +97699112233");
      }

      return required<IEduflowMemberDocument>(
        await models.EduflowMembers.findByIdAndUpdate(
          parentId,
          { $set: { phone: normalized } },
          { new: true },
        ),
        "Эцэг эх олдсонгүй.",
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
    earnedPoints: (parent: IEduflowSubmissionDocument) =>
      parent.earnedPoints ?? 0,
    gradePercent: (parent: IEduflowSubmissionDocument) =>
      parent.gradePercent ?? 0,
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
    attachments: (parent: IEduflowLessonPlanDocument) =>
      parent.attachments ?? [],
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
    leaderboardVisible: (parent: IEduflowMemberDocument) =>
      parent.leaderboardVisible !== false,
    parentPhone: async (
      parent: IEduflowMemberDocument,
      _args: unknown,
      { models }: Context,
    ) => {
      if (!parent.parentId) return null;
      const parentMember = await models.EduflowMembers.findById(parent.parentId);
      return parentMember?.phone ?? null;
    },
  },

  EduflowConcept: {
    updatedAt: (parent: IEduflowConceptDocument) =>
      parent.updatedAt?.toISOString() ?? null,
  },

  EduflowQuiz: {
    currentQuestionIndex: (parent: IEduflowQuizDocument) =>
      parent.answers.length,
    totalQuestions: (parent: IEduflowQuizDocument) =>
      parent.questions.length,
    answeredCount: (parent: IEduflowQuizDocument) => parent.answers.length,
    correctCount: (parent: IEduflowQuizDocument) =>
      parent.answers.filter((answer) => answer.correct).length,
    createdAt: (parent: IEduflowQuizDocument) =>
      parent.createdAt?.toISOString() ?? null,
    completedAt: (parent: IEduflowQuizDocument) =>
      parent.completedAt?.toISOString() ?? null,
  },
};
