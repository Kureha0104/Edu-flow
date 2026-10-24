import { useMutation } from "@apollo/client";
import {
  IconCheck,
  IconClock,
  IconMessage,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "erxes-ui";
import {
  CREATE_HOMEWORK,
  NOTIFY_PARENT,
  REVIEW_SUBMISSION,
} from "~/graphql";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  Avatar,
  EmptyState,
  ErrorBanner,
  PageHeading,
  ProgressBar,
  SectionCard,
  StatusPill,
  dueLabel,
  formatDate,
  formatDay,
  type Homework,
  type Submission,
} from "../modules/eduflow/ui";

const defaultDue = () => {
  const date = new Date(Date.now() + 86_400_000);
  date.setHours(17, 0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const SubmissionCard = ({
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
    <div className="eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-2">
      <div className="eduflow:flex eduflow:min-w-0 eduflow:items-center eduflow:gap-2">
        <Avatar name={submission.student?.name ?? "Сурагч"} size="sm" />
        <div className="eduflow:min-w-0">
          <p className="eduflow:truncate eduflow:text-xs eduflow:font-medium eduflow:text-white">
            {submission.student?.name ?? "Сурагч"}
          </p>
          <p className="eduflow:text-[10px] eduflow:text-edu-text">
            {submission.submittedAt ? formatDate(submission.submittedAt) : "—"}
          </p>
        </div>
      </div>
      <StatusPill status={submission.status} />
    </div>

    {submission.imageData && (
      <img
        src={submission.imageData}
        alt="Сурагчийн гэрийн даалгавар"
        className="eduflow:mt-3 eduflow:h-32 eduflow:w-full eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:object-cover"
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
            Баталгаажуулах
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onReview(submission._id, "needs_work")}
          >
            <IconX className="eduflow:size-3.5" />
            Дахин хийх
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
        Эцэг эхэд SMS
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
  <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/40 eduflow:p-3.5">
    <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-2">
      <div>
        <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
          <span className="eduflow:rounded-md eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
            {homework.subject}
          </span>
          <StatusPill
            status={homework.status}
            label={homework.status === "assigned" ? "Идэвхтэй" : "Хаагдсан"}
          />
        </div>
        <h3 className="eduflow:mt-1.5 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
          {homework.title}
        </h3>
        <p className="eduflow:mt-1 eduflow:text-[11px] eduflow:text-edu-text">
          <IconClock className="eduflow:mr-1 eduflow:inline eduflow:size-3.5" />
          {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)} ·{" "}
          {homework.points} оноо
        </p>
      </div>
      <div className="eduflow:min-w-36">
        <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
          <span>{homework.submissionCount} илгээсэн</span>
          <span className="eduflow:text-edu-cyan">
            {homework.approvedCount} батлагдсан
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
          Одоогоор илгээлт алга.
        </p>
      ) : (
        submissions.map((submission) => (
          <SubmissionCard
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

export const TeacherHomeworkPage = () => {
  const { demo, loading, error, refetch } = useEduflowDemo("teacher");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "Математик",
    dueDate: defaultDue(),
    points: "10",
    description: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string>();
  const [createHomework, { loading: creating }] =
    useMutation(CREATE_HOMEWORK);
  const [reviewSubmission] = useMutation(REVIEW_SUBMISSION);
  const [notifyParent] = useMutation(NOTIFY_PARENT);

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo) {
    return (
      <ErrorBanner
        message={error?.message ?? "Даалгавар ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      await createHomework({
        variables: {
          title: form.title,
          subject: form.subject,
          dueDate: new Date(form.dueDate).toISOString(),
          points: Number(form.points) || 10,
          description: form.description || null,
        },
      });
      setForm((current) => ({ ...current, title: "", description: "" }));
      setOpen(false);
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Даалгавар үүсгэж чадсангүй.",
      );
    }
  };

  const handleReview = async (submissionId: string, decision: string) => {
    setBusyId(submissionId);
    setMessage(null);
    try {
      await reviewSubmission({ variables: { submissionId, decision } });
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Шалгалтыг хадгалж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const handleNotify = async (submissionId: string) => {
    setBusyId(submissionId);
    setMessage(null);
    try {
      await notifyParent({ variables: { submissionId } });
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "SMS бүртгэж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Багш"
        title="Гэрийн даалгавар"
        description="Даалгавар үүсгэж, сурагчдын илгээсэн зургийг AI дүгнэлттэй нь харж, батлана."
        action={
          <Button type="button" onClick={() => setOpen((value) => !value)}>
            <IconPlus className="eduflow:size-4" />
            Шинэ даалгавар
          </Button>
        }
      />

      {message && <ErrorBanner message={message} />}

      {open && (
        <SectionCard title="Шинэ даалгавар" description="Сурагчид юу хийхийг тодорхой бичнэ үү.">
          <form onSubmit={handleCreate} className="eduflow:grid eduflow:gap-3">
            <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2">
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Гарчиг</span>
                <Input
                  required
                  value={form.title}
                  placeholder="Бутархайн дасгал"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Хичээл</span>
                <Input
                  required
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                />
              </label>
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Дуусах хугацаа</span>
                <Input
                  required
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Оноо</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.points}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, points: event.target.value }))
                  }
                />
              </label>
            </div>
            <label className="eduflow:grid eduflow:gap-1.5">
              <span className="eduflow:text-[11px] eduflow:text-edu-text">Заавар</span>
              <Textarea
                rows={2}
                value={form.description}
                placeholder="Сурагч юу хийж, юугаа зураглан илгээх вэ?"
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <div className="eduflow:flex eduflow:justify-end eduflow:gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Цуцлах
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Илгээж байна…" : "Даалгавар өгөх"}
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {demo.homeworks.length === 0 ? (
        <EmptyState
          title="Даалгавар алга"
          description="Эхний даалгавраа өгөөд эхлээрэй."
        />
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
    </div>
  );
};
