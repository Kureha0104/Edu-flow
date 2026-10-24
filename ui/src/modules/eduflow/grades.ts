import type {
  Demo,
  Homework,
  Submission,
} from "./ui";

export const gradeForStudent = (
  studentId: string,
  homeworks: Homework[] | Demo["homeworks"],
  submissions: Submission[] | Demo["submissions"],
) => {
  const total = homeworks.reduce((sum, homework) => sum + homework.points, 0);
  const earned = submissions
    .filter(
      (submission) =>
        submission.studentId === studentId &&
        submission.status === "approved",
    )
    .reduce((sum, submission) => sum + (submission.earnedPoints ?? 0), 0);

  return total > 0 ? Math.round((earned / total) * 100) : 0;
};

export const studentHomeworkStats = (
  studentId: string,
  demo: Pick<Demo, "homeworks" | "submissions">,
) => {
  const total = demo.homeworks.length;
  const own = demo.submissions.filter(
    (submission) => submission.studentId === studentId,
  );
  const approved = own.filter(
    (submission) => submission.status === "approved",
  ).length;
  const submitted = own.length;
  const missed = total - approved;
  const grade = gradeForStudent(studentId, demo.homeworks, demo.submissions);
  const latest = own
    .map((submission) => submission.submittedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return { total, approved, submitted, missed, grade, latest };
};
