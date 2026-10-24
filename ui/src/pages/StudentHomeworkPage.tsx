import { useMutation } from "@apollo/client";
import {
  IconCamera,
  IconCheck,
  IconClock,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button, cn } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { useAuth } from "../auth/AuthContext";
import { SUBMIT_HOMEWORK } from "~/graphql";
import { fileToCompressedDataUrl } from "../modules/eduflow/image";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  AiNotice,
  EmptyState,
  ErrorBanner,
  PageHeading,
  StatusPill,
  dueLabel,
  formatDay,
  submissionLabel,
  type Demo,
  type Homework,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

type Draft = { homeworkId: string; imageData: string };

const HomeworkCard = ({
  homework,
  submission,
  draft,
  busy,
  error,
  onFile,
  onSubmit,
}: {
  homework: Homework;
  submission: Demo["submissions"][number] | undefined;
  draft: Draft | undefined;
  busy: boolean;
  error: string | null;
  onFile: (homeworkId: string, file: File | undefined) => void;
  onSubmit: (homeworkId: string) => void;
}) => {
  const status = submission?.status ?? "todo";
  const approved = status === "approved";
  const image =
    draft?.homeworkId === homework._id ? draft.imageData : submission?.imageData;

  return (
    <div
      className={cn(
        "eduflow:rounded-2xl eduflow:border eduflow:bg-edu-card eduflow:p-4",
        approved ? "eduflow:border-edu-cyan/25" : "eduflow:border-edu-border",
      )}
    >
      <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-3">
        <div className="eduflow:min-w-0">
          <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
            <span className="eduflow:rounded-md eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:font-medium eduflow:text-edu-lav">
              {homework.subject}
            </span>
            <StatusPill
              status={status}
              label={status === "todo" ? "Эхлээгүй" : submissionLabel(status)}
            />
          </div>
          <h3 className="eduflow:mt-2 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
            {homework.title}
          </h3>
          {homework.description && (
            <p className="eduflow:mt-1 eduflow:text-xs eduflow:leading-relaxed eduflow:text-edu-text">
              {homework.description}
            </p>
          )}
          <div className="eduflow:mt-2 eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-3 eduflow:text-[11px] eduflow:text-edu-text">
            <span className="eduflow:flex eduflow:items-center eduflow:gap-1">
              <IconClock className="eduflow:size-3.5" />
              {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)}
            </span>
            <span>{homework.points} оноо</span>
          </div>
        </div>

        <label
          className={cn(
            "eduflow:inline-flex eduflow:cursor-pointer eduflow:items-center eduflow:gap-1.5 eduflow:rounded-lg eduflow:border eduflow:px-3 eduflow:py-2 eduflow:text-xs eduflow:font-medium eduflow:transition",
            busy
              ? "eduflow:cursor-wait eduflow:border-edu-border eduflow:text-edu-text"
              : "eduflow:border-edu-lav/30 eduflow:bg-edu-purple/15 eduflow:text-edu-lav hover:eduflow:bg-edu-purple/25",
          )}
        >
          <IconCamera className="eduflow:size-4" />
          {busy ? "Бэлтгэж байна…" : image ? "Дахин авах" : "Зураг нэмэх"}
          <input
            type="file"
            accept="image/*"
            className="eduflow:hidden"
            disabled={busy}
            onChange={(event) => {
              onFile(homework._id, event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <p className="eduflow:mt-3 eduflow:rounded-lg eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-lav">
          {error}
        </p>
      )}

      {image && (
        <div className="eduflow:mt-4 eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-[150px_1fr]">
          <img
            src={image}
            alt={homework.title}
            className="eduflow:h-28 eduflow:w-full eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:object-cover eduflow:sm:w-[150px]"
          />
          <div className="eduflow:min-w-0">
            {submission?.aiFeedback ? (
              <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:p-3">
                <p className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[11px] eduflow:font-semibold eduflow:text-edu-blue">
                  <IconSparkles className="eduflow:size-3.5" />
                  AI дүгнэлт · {submission.aiScore ?? "—"}%
                </p>
                <p className="eduflow:mt-1 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
                  {submission.aiFeedback}
                </p>
              </div>
            ) : (
              <div className="eduflow:flex eduflow:h-full eduflow:flex-col eduflow:justify-between eduflow:gap-2">
                <p className="eduflow:text-[11px] eduflow:text-edu-text">
                  Зураг бэлэн боллоо. AI шалгалт руу илгээгээрэй.
                </p>
                <Button
                  size="sm"
                  onClick={() => onSubmit(homework._id)}
                  disabled={busy}
                >
                  <IconUpload className="eduflow:size-4" />
                  {busy ? "Шалгаж байна…" : "AI шалгалт руу илгээх"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {approved && submission && (
        <div className="eduflow:mt-3 eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-lg eduflow:border eduflow:border-edu-cyan/25 eduflow:bg-edu-cyan/5 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-cyan">
          <IconCheck className="eduflow:size-4" />
          Даалгавар дууссан. Эцэг эхэд мэдэгдэл бүртгэгдлээ (жишээ SMS).
        </div>
      )}
    </div>
  );
};

export const StudentHomeworkPage = () => {
  const { session } = useAuth();
  const studentId = session?.member._id;
  const { demo, loading, error, refetch } = useEduflowDemo("student", studentId);
  const [draft, setDraft] = useState<Draft>();
  const [busyId, setBusyId] = useState<string>();
  const [message, setMessage] = useState<string | null>(null);
  const [submit, { loading: submitting }] = useMutation(SUBMIT_HOMEWORK);

  if (!session) {
    return null;
  }

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo?.member) {
    return (
      <ErrorBanner
        message={error?.message ?? "Даалгавар ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const member = demo.member;

  const handleFile = async (homeworkId: string, file: File | undefined) => {
    if (!file) return;
    setBusyId(homeworkId);
    setMessage(null);

    try {
      const imageData = await fileToCompressedDataUrl(file);
      setDraft({ homeworkId, imageData });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Зураг уншиж чадсангүй.");
    } finally {
      setBusyId(undefined);
    }
  };

  const handleSubmit = async (homeworkId: string) => {
    if (!draft || draft.homeworkId !== homeworkId) return;
    setBusyId(homeworkId);
    setMessage(null);

    try {
      await submit({
        variables: {
          homeworkId,
          studentId: member._id,
          imageData: draft.imageData,
        },
      });
      setDraft(undefined);
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Даалгавар илгээж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Сурагч"
        title="Миний гэрийн даалгавар"
        description="Дэвтрээ зураглан илгээгээрэй. AI шалгаж, багш баталсны дараа дууссан болно."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/student/practice`}>
              <IconSparkles className="eduflow:size-4" />
              Дасгал
            </Link>
          </Button>
        }
      />

      <AiNotice />
      {message && <ErrorBanner message={message} />}

      {demo.homeworks.length === 0 ? (
        <EmptyState
          title="Даалгавар алга"
          description="Багш удахгүй даалгавар өгнө."
        />
      ) : (
        <div className="eduflow:grid eduflow:gap-3">
          {demo.homeworks.map((homework) => {
            const submission = demo.submissions.find(
              (item) => item.homeworkId === homework._id,
            );

            return (
              <HomeworkCard
                key={homework._id}
                homework={homework}
                submission={submission}
                draft={draft}
                busy={busyId === homework._id || submitting}
                error={draft?.homeworkId === homework._id ? message : null}
                onFile={handleFile}
                onSubmit={handleSubmit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
