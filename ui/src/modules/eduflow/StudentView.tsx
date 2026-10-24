import { useMutation } from "@apollo/client";
import {
  IconCamera,
  IconCheck,
  IconClock,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button, cn } from "erxes-ui";
import { SUBMIT_HOMEWORK } from "~/graphql";
import { fileToCompressedDataUrl } from "./image";
import { StreakCard } from "./StreakCard";
import {
  AiNotice,
  Avatar,
  EmptyState,
  ErrorBanner,
  SectionCard,
  StatusPill,
  dueLabel,
  formatDay,
  submissionLabel,
  type Demo,
  type Homework,
  type Member,
} from "./ui";

type Draft = { homeworkId: string; imageData: string };

const HomeworkCard = ({
  homework,
  member,
  submission,
  draft,
  busy,
  error,
  onFile,
  onSubmit,
}: {
  homework: Homework;
  member: Member;
  submission: Demo["submissions"][number] | undefined;
  draft: Draft | undefined;
  busy: boolean;
  error: string | null;
  onFile: (homeworkId: string, file: File | undefined) => void;
  onSubmit: (homeworkId: string) => void;
}) => {
  const status = submission?.status ?? "todo";
  const approved = status === "approved";
  const image = draft?.homeworkId === homework._id
    ? draft.imageData
    : submission?.imageData;

  return (
    <div
      className={cn(
        "eduflow:rounded-2xl eduflow:border eduflow:bg-edu-card eduflow:p-4",
        approved
          ? "eduflow:border-edu-cyan/25"
          : "eduflow:border-edu-border",
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
              label={status === "todo" ? "Not started" : submissionLabel(status)}
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
            <span>{homework.points} pts</span>
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
          {busy ? "Preparing…" : image ? "Retake" : "Add photo"}
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
            alt={`${homework.title} submission by ${member.name}`}
            className="eduflow:h-28 eduflow:w-full eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:object-cover eduflow:sm:w-[150px]"
          />
          <div className="eduflow:min-w-0">
            {submission ? (
              <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:p-3">
                <p className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[11px] eduflow:font-semibold eduflow:text-edu-blue">
                  <IconSparkles className="eduflow:size-3.5" />
                  AI feedback · {submission.aiScore ?? "—"}%
                </p>
                <p className="eduflow:mt-1 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
                  {submission.aiFeedback}
                </p>
              </div>
            ) : (
              <div className="eduflow:flex eduflow:h-full eduflow:flex-col eduflow:justify-between eduflow:gap-2">
                <p className="eduflow:text-[11px] eduflow:text-edu-text">
                  Photo ready. Send it for an AI-style check.
                </p>
                <Button
                  size="sm"
                  onClick={() => onSubmit(homework._id)}
                  disabled={busy}
                >
                  <IconUpload className="eduflow:size-4" />
                  {busy ? "Checking…" : "Submit for AI check"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {approved && submission && (
        <div className="eduflow:mt-3 eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-lg eduflow:border eduflow:border-edu-cyan/25 eduflow:bg-edu-cyan/5 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-cyan">
          <IconCheck className="eduflow:size-4" />
          Homework marked done. Parent update queued (dummy SMS).
        </div>
      )}
    </div>
  );
};

export const StudentView = ({
  demo,
  students,
  selectedStudentId,
  onSelectStudent,
  refetch,
}: {
  demo: Demo;
  students: Member[];
  selectedStudentId?: string;
  onSelectStudent: (id: string) => void;
  refetch: () => Promise<unknown>;
}) => {
  const member = demo.member;
  const [draft, setDraft] = useState<Draft>();
  const [busyId, setBusyId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [submit, { loading }] = useMutation(SUBMIT_HOMEWORK);

  if (!member) {
    return <EmptyState title="No student profile" />;
  }

  const homeworkForStudent = demo.homeworks;

  const handleFile = async (homeworkId: string, file: File | undefined) => {
    if (!file) return;
    setBusyId(homeworkId);
    setError(null);

    try {
      const imageData = await fileToCompressedDataUrl(file);
      setDraft({ homeworkId, imageData });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read image.");
    } finally {
      setBusyId(undefined);
    }
  };

  const handleSubmit = async (homeworkId: string) => {
    if (!draft || draft.homeworkId !== homeworkId) return;
    setBusyId(homeworkId);
    setError(null);

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
      setError(
        cause instanceof Error ? cause.message : "Could not submit homework.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:justify-between eduflow:gap-3">
        <div>
          <p className="eduflow:text-[11px] eduflow:uppercase eduflow:tracking-widest eduflow:text-edu-text">
            Student dashboard
          </p>
          <h2 className="eduflow:text-lg eduflow:font-semibold eduflow:text-white">
            Hi {member.name.split(" ")[0]}, ready for today?
          </h2>
        </div>
        <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2">
          {students.map((student) => (
            <button
              key={student._id}
              type="button"
              onClick={() => onSelectStudent(student._id)}
              className={cn(
                "eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-full eduflow:border eduflow:px-2.5 eduflow:py-1 eduflow:text-[11px] eduflow:transition",
                student._id === (selectedStudentId ?? member._id)
                  ? "eduflow:border-edu-lav/40 eduflow:bg-edu-purple/20 eduflow:text-white"
                  : "eduflow:border-edu-border eduflow:bg-edu-card eduflow:text-edu-text hover:eduflow:border-edu-lav/30",
              )}
            >
              <Avatar name={student.name} size="sm" />
              {student.name}
            </button>
          ))}
        </div>
      </div>

      <StreakCard member={member} />
      <AiNotice />
      {error && <ErrorBanner message={error} />}

      <SectionCard
        title="Today’s homework"
        description="Photograph your notebook, submit it, and let the demo AI check the work."
      >
        {homeworkForStudent.length === 0 ? (
          <EmptyState
            title="No homework assigned"
            description="Your teacher hasn’t posted anything yet."
          />
        ) : (
          <div className="eduflow:grid eduflow:gap-3">
            {homeworkForStudent.map((homework) => {
              const submission = demo.submissions.find(
                (item) =>
                  item.homeworkId === homework._id &&
                  item.studentId === member._id,
              );

              return (
                <HomeworkCard
                  key={homework._id}
                  homework={homework}
                  member={member}
                  submission={submission}
                  draft={draft}
                  busy={busyId === homework._id || loading}
                  error={draft?.homeworkId === homework._id ? error : null}
                  onFile={handleFile}
                  onSubmit={handleSubmit}
                />
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
