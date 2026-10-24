import { useMutation } from "@apollo/client";
import {
  IconCheck,
  IconClock,
  IconEdit,
  IconMessage,
  IconPlus,
  IconSparkles,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea, cn } from "erxes-ui";
import {
  CREATE_HOMEWORK,
  NOTIFY_PARENT,
  REVIEW_SUBMISSION,
} from "~/graphql";
import { Modal } from "../modules/eduflow/Modal";
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

const gradeOf = (submission: Submission) =>
  submission.gradePercent || submission.aiScore || 0;

const SubmissionTile = ({
  submission,
  onOpen,
}: {
  submission: Submission;
  onOpen: (submission: Submission) => void;
}) => (
  <button
    type="button"
    onClick={() => onOpen(submission)}
    aria-label={`${submission.student?.name ?? "Сурагч"} илгээлт`}
    className="eduflow:group eduflow:relative eduflow:aspect-square eduflow:overflow-hidden eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg eduflow:text-left eduflow:transition hover:eduflow:-translate-y-0.5 hover:eduflow:border-edu-lav/50 hover:eduflow:shadow-[0_16px_36px_-20px_#7C3AED] focus-visible:eduflow:outline-2 focus-visible:eduflow:outline-edu-lav"
  >
    {submission.imageData ? (
      <img
        src={submission.imageData}
        alt=""
        className="eduflow:h-full eduflow:w-full eduflow:object-contain eduflow:p-2 eduflow:transition group-hover:eduflow:scale-[1.02]"
      />
    ) : (
      <span className="eduflow:flex eduflow:h-full eduflow:items-center eduflow:justify-center eduflow:text-xs eduflow:text-edu-text">
        Зураггүй
      </span>
    )}

    <span className="eduflow:absolute eduflow:right-2 eduflow:top-2 eduflow:rounded-full eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-bg/80 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:font-semibold eduflow:backdrop-blur">
      <span
        className={
          submission.status === "approved"
            ? "eduflow:text-edu-cyan"
            : "eduflow:text-edu-lav"
        }
      >
        {gradeOf(submission)}%
      </span>
    </span>

    <span className="eduflow:absolute eduflow:inset-x-0 eduflow:bottom-0 eduflow:bg-gradient-to-t eduflow:from-edu-bg eduflow:via-edu-bg/80 eduflow:to-transparent eduflow:p-3 eduflow:pt-8">
      <span className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2">
        <span className="eduflow:truncate eduflow:text-[11px] eduflow:font-medium eduflow:text-white">
          {submission.student?.name ?? "Сурагч"}
        </span>
        <span className="eduflow:shrink-0 eduflow:text-[10px] eduflow:text-edu-cyan">
          {submission.status === "approved" ? "Дууссан" : "Шалгах"}
        </span>
      </span>
    </span>
  </button>
);

const HomeworkGroup = ({
  homework,
  submissions,
  onOpen,
}: {
  homework: Homework;
  submissions: Submission[];
  onOpen: (submission: Submission) => void;
}) => (
  <section className="eduflow:rounded-3xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:p-4 eduflow:shadow-[0_0_40px_-30px_#7C3AED]">
    <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-3">
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
        <h2 className="eduflow:mt-1.5 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
          {homework.title}
        </h2>
        <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
          <IconClock className="eduflow:mr-1 eduflow:inline eduflow:size-3.5" />
          {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)} ·{" "}
          {homework.points} оноо
        </p>
      </div>
      <div className="eduflow:w-40">
        <div className="eduflow:flex eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
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

    {submissions.length === 0 ? (
      <p className="eduflow:mt-3 eduflow:rounded-xl eduflow:border eduflow:dashed eduflow:border-edu-border eduflow:px-3 eduflow:py-6 eduflow:text-center eduflow:text-[11px] eduflow:text-edu-text">
        Одоогоор илгээлт алга.
      </p>
    ) : (
      <div className="eduflow:mt-3 eduflow:grid eduflow:grid-cols-2 eduflow:gap-2.5 eduflow:sm:grid-cols-3 eduflow:lg:grid-cols-4 eduflow:xl:grid-cols-5">
        {submissions.map((submission) => (
          <SubmissionTile
            key={submission._id}
            submission={submission}
            onOpen={onOpen}
          />
        ))}
      </div>
    )}
  </section>
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
  const [selected, setSelected] = useState<Submission | null>(null);
  const [grade, setGrade] = useState(100);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsResult, setSmsResult] = useState<string | null>(null);
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

  const selectedHomework = selected
    ? demo.homeworks.find((homework) => homework._id === selected.homeworkId)
    : undefined;

  const openSubmission = (submission: Submission) => {
    setSelected(submission);
    setGrade(gradeOf(submission) || 100);
    setMessage(null);
    setSmsResult(null);
  };

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

  const review = async (decision: "approved" | "needs_work") => {
    if (!selected) return;
    setBusyId(selected._id);
    setMessage(null);
    try {
      await reviewSubmission({
        variables: {
          submissionId: selected._id,
          decision,
          gradePercent: decision === "approved" ? grade : undefined,
        },
      });
      setSelected(null);
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Шалгалтыг хадгалж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const openSms = () => {
    if (!selected || !selectedHomework) return;
    const studentName = selected.student?.name ?? "Сурагч";
    setSmsText(
      `Edu Flow: ${studentName} "${selectedHomework.title}" даалгаврыг ${grade}% гүйцэтгэсэн. Дэлгэрэнгүйг Edu Flow-оос харна уу.`,
    );
    setSmsResult(null);
    setSmsOpen(true);
  };

  const sendSms = async () => {
    if (!selected) return;
    setBusyId(selected._id);
    setSmsResult(null);
    try {
      const response = await notifyParent({
        variables: { submissionId: selected._id, message: smsText },
      });
      const status = response.data?.eduflowNotifyParent.status;
      setSmsResult(
        status === "sent"
          ? "SMS амжилттай илгээгдлээ."
          : status === "sent_dummy"
            ? "Жишээ горим: мессеж бүртгэгдлээ. Twilio тохируулбал бодитоор илгээнэ."
            : "SMS илгээхэд алдаа гарлаа.",
      );
      await refetch();
    } catch (cause) {
      setSmsResult(
        cause instanceof Error ? cause.message : "SMS илгээж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Багш · шалгалт"
        title="Гэрийн даалгаврын шалгалт"
        description="Зурган дээр дарж томруулна. AI дүгнэлт, дүнгээ шалгаад батлах эсвэл дахин хийхийг илгээнэ."
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
            <HomeworkGroup
              key={homework._id}
              homework={homework}
              submissions={demo.submissions.filter(
                (submission) => submission.homeworkId === homework._id,
              )}
              onOpen={openSubmission}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selected.student?.name ?? "Сурагч"} · ${selectedHomework?.title ?? "Даалгавар"}`
            : "Илгээлт"
        }
      >
        {selected && (
          <div className="eduflow:grid eduflow:gap-5 eduflow:md:grid-cols-[1.1fr_0.9fr]">
            <div className="eduflow:flex eduflow:max-h-[68vh] eduflow:items-center eduflow:justify-center eduflow:overflow-hidden eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg">
              {selected.imageData ? (
                <img
                  src={selected.imageData}
                  alt="Илгээсэн гэрийн даалгавар"
                  className="eduflow:max-h-[68vh] eduflow:w-auto eduflow:max-w-full eduflow:object-contain"
                />
              ) : (
                <span className="eduflow:p-10 eduflow:text-xs eduflow:text-edu-text">
                  Зураг байхгүй
                </span>
              )}
            </div>

            <div className="eduflow:grid eduflow:content-start eduflow:gap-3">
              <div className="eduflow:flex eduflow:items-center eduflow:gap-2">
                <Avatar name={selected.student?.name ?? "Сурагч"} />
                <div>
                  <p className="eduflow:text-sm eduflow:font-semibold eduflow:text-white">
                    {selected.student?.name ?? "Сурагч"}
                  </p>
                  <p className="eduflow:text-[10px] eduflow:text-edu-text">
                    {selected.submittedAt ? formatDate(selected.submittedAt) : ""}
                  </p>
                </div>
                <span className="eduflow:ml-auto">
                  <StatusPill status={selected.status} />
                </span>
              </div>

              <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:p-3">
                <p className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[11px] eduflow:font-semibold eduflow:text-edu-blue">
                  <IconSparkles className="eduflow:size-3.5" />
                  {selected.aiProvider === "gemma"
                    ? "Gemma 4 дүгнэлт"
                    : selected.aiProvider === "mock-fallback"
                      ? "AI fallback (жишээ)"
                      : "Жишээ AI дүгнэлт"}{" "}
                  · {selected.aiScore ?? "—"}%
                </p>
                <p className="eduflow:mt-1 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
                  {selected.aiFeedback}
                </p>
              </div>

              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">
                  Даалгаврын дүн (%)
                </span>
                <div className="eduflow:flex eduflow:items-center eduflow:gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={grade}
                    onChange={(event) => setGrade(Number(event.target.value))}
                    className="eduflow:max-w-28"
                  />
                  <span className="eduflow:text-[10px] eduflow:text-edu-text">
                    {selectedHomework
                      ? `${Math.round((selectedHomework.points * grade) / 100)} / ${selectedHomework.points} оноо`
                      : ""}
                  </span>
                </div>
              </label>

              <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busyId === selected._id}
                  onClick={() => void review("approved")}
                >
                  <IconCheck className="eduflow:size-4" />
                  Батлах
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === selected._id}
                  onClick={() => void review("needs_work")}
                >
                  <IconX className="eduflow:size-4" />
                  Дахин хийх
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={openSms}
                >
                  <IconMessage className="eduflow:size-4" />
                  Эцэг эхэд SMS
                </Button>
              </div>

              <p className="eduflow:text-[10px] eduflow:leading-relaxed eduflow:text-edu-text/70">
                Баталснаар сурагчийн дүн, цуврал шинэчлэгдэж, эцэг эхэд SMS
                бүртгэгдэнэ. Дүнг гараар засаж болно.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        title="Эцэг эхэд SMS илгээх"
      >
        <div className="eduflow:grid eduflow:gap-3">
          <p className="eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
            Мессежийг засаж болно. Хүлээн авагч:{" "}
            <span className="eduflow:text-white">
              {demo.parent?.phone ?? "утас бүртгэгдээгүй"}
            </span>
          </p>
          <Textarea
            rows={5}
            value={smsText}
            onChange={(event) => setSmsText(event.target.value)}
            aria-label="SMS мессеж"
          />
          <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2">
            <span className="eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-text">
              <IconEdit className="eduflow:size-3.5" />
              {smsText.length}/1000
            </span>
            <div className="eduflow:flex eduflow:gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSmsOpen(false)}
              >
                Цуцлах
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!smsText.trim() || busyId === selected?._id}
                onClick={() => void sendSms()}
              >
                <IconUpload className="eduflow:size-4" />
                Илгээх
              </Button>
            </div>
          </div>
          {smsResult && (
            <p
              className={cn(
                "eduflow:rounded-lg eduflow:border eduflow:px-3 eduflow:py-2 eduflow:text-[11px]",
                smsResult.includes("алдаа")
                  ? "eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:text-edu-lav"
                  : "eduflow:border-edu-cyan/30 eduflow:bg-edu-cyan/5 eduflow:text-edu-cyan",
              )}
            >
              {smsResult}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
