import { useMutation } from "@apollo/client";
import {
  IconBook,
  IconCheck,
  IconClipboardCheck,
  IconClock,
  IconFlame,
  IconMessage,
  IconPlus,
  IconSchool,
  IconSparkles,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Input, Textarea } from "erxes-ui";
import {
  CREATE_HOMEWORK,
  CREATE_LESSON_PLAN,
  NOTIFY_PARENT,
  REVIEW_SUBMISSION,
  UPDATE_LESSON_PLAN_STATUS,
} from "~/graphql";
import {
  AiNotice,
  Avatar,
  EmptyState,
  ErrorBanner,
  ProgressBar,
  SectionCard,
  StatusPill,
  StatCard,
  dueLabel,
  formatDate,
  formatDay,
  type Demo,
  type Homework,
  type LessonPlan,
  type Submission,
} from "./ui";

const defaultDue = () => {
  const date = new Date(Date.now() + 86_400_000);
  date.setHours(17, 0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label className="eduflow:grid eduflow:gap-1.5">
    <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
      {label}
    </span>
    {children}
  </label>
);

const LessonPlanCard = ({
  plan,
  busy,
  onStatus,
}: {
  plan: LessonPlan;
  busy: boolean;
  onStatus: (planId: string, status: string) => void;
}) => (
  <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/70 eduflow:p-3.5">
    <div className="eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-2">
      <div className="eduflow:min-w-0">
        <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
          <span className="eduflow:rounded-md eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
            {plan.subject}
          </span>
          <StatusPill
            status={plan.status}
            label={
              plan.status === "draft"
                ? "Draft"
                : plan.status === "review"
                  ? "In review"
                  : "Approved"
            }
          />
        </div>
        <h3 className="eduflow:mt-1.5 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
          {plan.title}
        </h3>
        {plan.objectives && (
          <p className="eduflow:mt-1 eduflow:line-clamp-2 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
            {plan.objectives}
          </p>
        )}
      </div>
    </div>
    <div className="eduflow:mt-2.5 eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-1.5">
      {plan.status === "draft" && (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => onStatus(plan._id, "review")}
        >
          <IconClipboardCheck className="eduflow:size-3.5" />
          Submit for review
        </Button>
      )}
      {plan.status === "review" && (
        <>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onStatus(plan._id, "approved")}
          >
            <IconCheck className="eduflow:size-3.5" />
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onStatus(plan._id, "draft")}
          >
            Back to draft
          </Button>
        </>
      )}
      {plan.status === "approved" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onStatus(plan._id, "review")}
        >
          Reopen
        </Button>
      )}
      <span className="eduflow:ml-auto eduflow:text-[10px] eduflow:text-edu-text">
        {plan.approvedAt
          ? `Approved ${formatDate(plan.approvedAt)}`
          : "Demo approval"}
      </span>
    </div>
  </div>
);

const SubmissionRow = ({
  submission,
  busy,
  onReview,
  onNotify,
}: {
  submission: Submission;
  busy: boolean;
  onReview: (submissionId: string, decision: string) => void;
  onNotify: (submissionId: string) => void;
}) => (
  <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:p-3">
    <div className="eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-3">
      <div className="eduflow:flex eduflow:min-w-0 eduflow:items-center eduflow:gap-2">
        <Avatar name={submission.student?.name ?? "Student"} />
        <div className="eduflow:min-w-0">
          <p className="eduflow:truncate eduflow:text-xs eduflow:font-medium eduflow:text-white">
            {submission.student?.name ?? "Student"}
          </p>
          <p className="eduflow:text-[10px] eduflow:text-edu-text">
            {submission.submittedAt ? formatDate(submission.submittedAt) : "—"}
          </p>
        </div>
      </div>
      <StatusPill
        status={submission.status}
        label={submission.status === "approved" ? "Done" : undefined}
      />
    </div>

    {submission.imageData && (
      <img
        src={submission.imageData}
        alt={`${submission.student?.name ?? "Student"} homework`}
        className="eduflow:mt-3 eduflow:h-28 eduflow:w-full eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:object-cover"
      />
    )}

    {submission.aiFeedback && (
      <p className="eduflow:mt-2 eduflow:rounded-lg eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:px-2.5 eduflow:py-2 eduflow:text-[10px] eduflow:leading-relaxed eduflow:text-edu-text">
        <span className="eduflow:font-semibold eduflow:text-edu-blue">
          AI {submission.aiScore ?? "—"}%:{" "}
        </span>
        {submission.aiFeedback}
      </p>
    )}

    <div className="eduflow:mt-2.5 eduflow:flex eduflow:flex-wrap eduflow:gap-1.5">
      {submission.status !== "approved" && (
        <>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onReview(submission._id, "approved")}
          >
            <IconCheck className="eduflow:size-3.5" />
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onReview(submission._id, "needs_work")}
          >
            <IconX className="eduflow:size-3.5" />
            Needs work
          </Button>
        </>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => onNotify(submission._id)}
      >
        <IconMessage className="eduflow:size-3.5" />
        SMS parent
      </Button>
    </div>
  </div>
);

const HomeworkCard = ({
  homework,
  submissions,
  busyId,
  onReview,
  onNotify,
}: {
  homework: Homework;
  submissions: Submission[];
  busyId?: string;
  onReview: (submissionId: string, decision: string) => void;
  onNotify: (submissionId: string) => void;
}) => (
  <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3.5">
    <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-2">
      <div>
        <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
          <span className="eduflow:rounded-md eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
            {homework.subject}
          </span>
          <StatusPill
            status={homework.status}
            label={homework.status === "assigned" ? "Assigned" : "Closed"}
          />
        </div>
        <h3 className="eduflow:mt-1.5 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
          {homework.title}
        </h3>
        <p className="eduflow:mt-1 eduflow:text-[11px] eduflow:text-edu-text">
          <IconClock className="eduflow:mr-1 eduflow:inline eduflow:size-3.5" />
          {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)} ·{" "}
          {homework.points} pts
        </p>
      </div>
      <div className="eduflow:min-w-36">
        <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
          <span>{homework.submissionCount} submitted</span>
          <span className="eduflow:text-edu-cyan">
            {homework.approvedCount} done
          </span>
        </div>
        <ProgressBar
          value={homework.approvedCount}
          max={homework.submissionCount || 1}
          tone="cyan"
          className="eduflow:mt-1"
        />
      </div>
    </div>

    <div className="eduflow:mt-3 eduflow:grid eduflow:gap-2">
      {submissions.length === 0 ? (
        <p className="eduflow:rounded-lg eduflow:border eduflow:dashed eduflow:border-edu-border eduflow:px-3 eduflow:py-3 eduflow:text-[11px] eduflow:text-edu-text">
          No submissions yet.
        </p>
      ) : (
        submissions.map((submission) => (
          <SubmissionRow
            key={submission._id}
            submission={submission}
            busy={busyId === submission._id}
            onReview={onReview}
            onNotify={onNotify}
          />
        ))
      )}
    </div>
  </div>
);

export const TeacherView = ({
  demo,
  refetch,
}: {
  demo: Demo;
  refetch: () => Promise<unknown>;
}) => {
  const classroom = demo.classes[0];
  const [homeworkOpen, setHomeworkOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string>();
  const [homeworkForm, setHomeworkForm] = useState({
    title: "",
    subject: classroom?.subject ?? "Mathematics",
    dueDate: defaultDue(),
    points: "10",
    description: "",
  });
  const [planForm, setPlanForm] = useState({
    title: "",
    subject: classroom?.subject ?? "Mathematics",
    objectives: "",
    content: "",
    materials: "",
    assessment: "",
  });

  const [createHomework, { loading: creatingHomework }] =
    useMutation(CREATE_HOMEWORK);
  const [createPlan, { loading: creatingPlan }] =
    useMutation(CREATE_LESSON_PLAN);
  const [updatePlan] = useMutation(UPDATE_LESSON_PLAN_STATUS);
  const [reviewSubmission] = useMutation(REVIEW_SUBMISSION);
  const [notifyParent] = useMutation(NOTIFY_PARENT);

  const handleCreateHomework = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await createHomework({
        variables: {
          title: homeworkForm.title,
          subject: homeworkForm.subject,
          dueDate: new Date(homeworkForm.dueDate).toISOString(),
          points: Number(homeworkForm.points) || 10,
          description: homeworkForm.description || null,
        },
      });
      setHomeworkForm((current) => ({
        ...current,
        title: "",
        description: "",
      }));
      setHomeworkOpen(false);
      await refetch();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create homework.",
      );
    }
  };

  const handleCreatePlan = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await createPlan({
        variables: {
          title: planForm.title,
          subject: planForm.subject,
          objectives: planForm.objectives || null,
          content: planForm.content || null,
          materials: planForm.materials || null,
          assessment: planForm.assessment || null,
        },
      });
      setPlanForm((current) => ({
        ...current,
        title: "",
        objectives: "",
        content: "",
        materials: "",
        assessment: "",
      }));
      setPlanOpen(false);
      await refetch();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create lesson plan.",
      );
    }
  };

  const handlePlanStatus = async (planId: string, status: string) => {
    setBusyId(planId);
    setError(null);
    try {
      await updatePlan({ variables: { planId, status } });
      await refetch();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update plan.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const handleReview = async (submissionId: string, decision: string) => {
    setBusyId(submissionId);
    setError(null);
    try {
      await reviewSubmission({ variables: { submissionId, decision } });
      await refetch();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not review submission.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const handleNotify = async (submissionId: string) => {
    setBusyId(submissionId);
    setError(null);
    try {
      await notifyParent({ variables: { submissionId } });
      await refetch();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not send parent SMS.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2 eduflow:xl:grid-cols-4">
        <StatCard
          label="Students"
          value={demo.stats.totalStudents}
          hint={classroom ? `${classroom.name} · ${classroom.code}` : undefined}
          icon={IconUsers}
        />
        <StatCard
          label="Assignments"
          value={demo.stats.totalHomework}
          hint="Active this week"
          icon={IconBook}
          accent="blue"
        />
        <StatCard
          label="To review"
          value={demo.stats.pendingReviews}
          hint="AI checked, teacher decides"
          icon={IconClipboardCheck}
          accent="lav"
        />
        <StatCard
          label="Avg streak"
          value={`${demo.stats.averageStreak}d`}
          hint="Class momentum"
          icon={IconFlame}
          accent="cyan"
        />
      </div>

      <AiNotice />
      {error && <ErrorBanner message={error} />}

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Assignments"
          description="Create homework and review what students photographed."
          action={
            <Button
              type="button"
              size="sm"
              onClick={() => setHomeworkOpen((open) => !open)}
            >
              <IconPlus className="eduflow:size-4" />
              New homework
            </Button>
          }
        >
          {homeworkOpen && (
            <form
              onSubmit={handleCreateHomework}
              className="eduflow:mb-4 eduflow:grid eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-lav/20 eduflow:bg-edu-card2/60 eduflow:p-3.5"
            >
              <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2">
                <Field label="Title">
                  <Input
                    required
                    value={homeworkForm.title}
                    placeholder="Fractions worksheet"
                    onChange={(event) =>
                      setHomeworkForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Subject">
                  <Input
                    required
                    value={homeworkForm.subject}
                    onChange={(event) =>
                      setHomeworkForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Due">
                  <Input
                    required
                    type="datetime-local"
                    value={homeworkForm.dueDate}
                    onChange={(event) =>
                      setHomeworkForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Points">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={homeworkForm.points}
                    onChange={(event) =>
                      setHomeworkForm((current) => ({
                        ...current,
                        points: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Instructions">
                <Textarea
                  rows={2}
                  value={homeworkForm.description}
                  placeholder="What should students photograph?"
                  onChange={(event) =>
                    setHomeworkForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="eduflow:flex eduflow:justify-end eduflow:gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setHomeworkOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingHomework}>
                  {creatingHomework ? "Assigning…" : "Assign homework"}
                </Button>
              </div>
            </form>
          )}

          {demo.homeworks.length === 0 ? (
            <EmptyState title="No homework yet" />
          ) : (
            <div className="eduflow:grid eduflow:gap-3">
              {demo.homeworks.map((homework) => (
                <HomeworkCard
                  key={homework._id}
                  homework={homework}
                  submissions={demo.submissions.filter(
                    (submission) => submission.homeworkId === homework._id,
                  )}
                  busyId={busyId}
                  onReview={handleReview}
                  onNotify={handleNotify}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Lesson plans"
          description="Draft → review → approved. Demo lets the teacher approve too."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPlanOpen((open) => !open)}
            >
              <IconPlus className="eduflow:size-4" />
              New plan
            </Button>
          }
        >
          {planOpen && (
            <form
              onSubmit={handleCreatePlan}
              className="eduflow:mb-4 eduflow:grid eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-lav/20 eduflow:bg-edu-card2/60 eduflow:p-3.5"
            >
              <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2">
                <Field label="Title">
                  <Input
                    required
                    value={planForm.title}
                    placeholder="Equivalent fractions"
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Subject">
                  <Input
                    required
                    value={planForm.subject}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Objectives">
                <Textarea
                  rows={2}
                  value={planForm.objectives}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      objectives: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Materials">
                <Input
                  value={planForm.materials}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      materials: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Assessment">
                <Input
                  value={planForm.assessment}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      assessment: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="eduflow:flex eduflow:justify-end eduflow:gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlanOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingPlan}>
                  {creatingPlan ? "Saving…" : "Save draft"}
                </Button>
              </div>
            </form>
          )}

          {demo.lessonPlans.length === 0 ? (
            <EmptyState title="No lesson plans yet" />
          ) : (
            <div className="eduflow:grid eduflow:gap-2.5">
              {demo.lessonPlans.map((plan) => (
                <LessonPlanCard
                  key={plan._id}
                  plan={plan}
                  busy={busyId === plan._id}
                  onStatus={handlePlanStatus}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:px-4 eduflow:py-3">
        <p className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:text-[11px] eduflow:text-edu-text">
          <IconSchool className="eduflow:size-4 eduflow:text-edu-lav" />
          {classroom
            ? `${classroom.name} · ${classroom.subject} · ${demo.students.length} students`
            : "No class configured"}
        </p>
        <p className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:text-[11px] eduflow:text-edu-text">
          <IconSparkles className="eduflow:size-4 eduflow:text-edu-blue" />
          Role-aware backend permissions are next; this demo runs as the owner.
        </p>
      </div>
    </div>
  );
};
