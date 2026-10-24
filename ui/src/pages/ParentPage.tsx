import { useMutation } from "@apollo/client";
import {
  IconCheck,
  IconClock,
  IconFlame,
  IconMessage,
  IconPhone,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button, cn } from "erxes-ui";
import { NOTIFY_PARENT } from "~/graphql";
import { useAuth } from "../auth/AuthContext";
import { gradeForStudent } from "../modules/eduflow/grades";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  AiNotice,
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
  type Demo,
  type Member,
} from "../modules/eduflow/ui";

const ChildSummary = ({
  child,
  homeworks,
  approved,
  pending,
  grade,
}: {
  child: Member;
  homeworks: Demo["homeworks"];
  approved: number;
  pending: number;
  grade: number;
}) => (
  <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-lav/25 eduflow:bg-gradient-to-br eduflow:from-edu-purple/25 eduflow:via-edu-card eduflow:to-edu-card eduflow:p-4">
    <div className="eduflow:flex eduflow:items-center eduflow:gap-3">
      <Avatar name={child.name} size="lg" />
      <div className="eduflow:min-w-0">
        <h3 className="eduflow:text-base eduflow:font-semibold eduflow:text-white">
          {child.name}
        </h3>
        <p className="eduflow:text-[11px] eduflow:text-edu-text">
          {child.grade ?? "Сурагч"} · {child.email}
        </p>
      </div>
      <div className="eduflow:ml-auto eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:rounded-full eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-bg/40 eduflow:px-3 eduflow:py-1 eduflow:text-xs eduflow:font-semibold eduflow:text-edu-lav">
        <IconFlame className="eduflow:size-4" />
        {child.streak} өдөр
      </div>
    </div>

    <div className="eduflow:mt-4 eduflow:grid eduflow:grid-cols-3 eduflow:gap-2">
      <div className="eduflow:rounded-xl eduflow:bg-edu-bg/40 eduflow:px-3 eduflow:py-2">
        <p className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
          Дууссан
        </p>
        <p className="eduflow:text-lg eduflow:font-semibold eduflow:text-edu-cyan">
          {approved}/{homeworks.length}
        </p>
      </div>
      <div className="eduflow:rounded-xl eduflow:bg-edu-bg/40 eduflow:px-3 eduflow:py-2">
        <p className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
          Хүлээгдэж буй
        </p>
        <p className="eduflow:text-lg eduflow:font-semibold eduflow:text-edu-blue">
          {pending}
        </p>
      </div>
      <div className="eduflow:rounded-xl eduflow:bg-edu-bg/40 eduflow:px-3 eduflow:py-2">
        <p className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
          Дүн
        </p>
        <p className="eduflow:text-lg eduflow:font-semibold eduflow:text-edu-lav">
          {grade}%
        </p>
      </div>
    </div>

    <div className="eduflow:mt-3">
      <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
        <span>Даалгаврын гүйцэтгэл</span>
        <span>
          {homeworks.length > 0
            ? Math.round((approved / homeworks.length) * 100)
            : 0}
          %
        </span>
      </div>
      <ProgressBar
        value={approved}
        max={homeworks.length || 1}
        tone="cyan"
        className="eduflow:mt-1"
      />
    </div>
  </div>
);

export const ParentPage = () => {
  const { session } = useAuth();
  const parentId = session?.member._id;
  const { demo, loading, error, refetch } = useEduflowDemo("parent", parentId);
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notifyParent] = useMutation(NOTIFY_PARENT);

  if (!session) {
    return null;
  }

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo) {
    return (
      <ErrorBanner
        message={error?.message ?? "Хүүхдийн явц ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const children = demo.students;
  const child = children.find((item) => item._id === selectedId) ?? children[0];

  if (!child) {
    return <EmptyState title="Хүүхэд холбогдоогүй байна" />;
  }

  const childSubmissions = demo.submissions.filter(
    (submission) => submission.studentId === child._id,
  );
  const approved = childSubmissions.filter(
    (submission) => submission.status === "approved",
  ).length;
  const pending = Math.max(0, demo.homeworks.length - approved);
  const notifications = demo.notifications.filter(
    (notification) => notification.studentId === child._id,
  );
  const latestSubmission = childSubmissions[0];
  const grade = gradeForStudent(child._id, demo.homeworks, demo.submissions);

  const sendTestSms = async () => {
    if (!latestSubmission) {
      setMessage("Илгээх илгээлт алга.");
      return;
    }

    setSending(true);
    setMessage(null);
    try {
      await notifyParent({ variables: { submissionId: latestSubmission._id } });
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "SMS бүртгэж чадсангүй.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Эцэг эх"
        title={`${session.member.name}, хүүхдийнхээ явцыг хараарай`}
        description="Даалгаврын гүйцэтгэл, AI дүгнэлт, цуврал болон SMS мэдэгдлийг нэг дор."
      />

      <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
        {children.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => setSelectedId(item._id)}
            className={cn(
              "eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-full eduflow:border eduflow:px-2.5 eduflow:py-1 eduflow:text-[11px] eduflow:transition",
              item._id === child._id
                ? "eduflow:border-edu-lav/40 eduflow:bg-edu-purple/20 eduflow:text-white"
                : "eduflow:border-edu-border eduflow:bg-edu-card eduflow:text-edu-text hover:eduflow:border-edu-lav/30",
            )}
          >
            <Avatar name={item.name} size="sm" />
            {item.name}
          </button>
        ))}
      </div>

      <AiNotice />
      {message && <ErrorBanner message={message} />}

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-[0.9fr_1.1fr]">
        <div className="eduflow:grid eduflow:gap-5">
          <ChildSummary
            child={child}
            homeworks={demo.homeworks}
            approved={approved}
            pending={pending}
            grade={grade}
          />

          <SectionCard
            title="SMS мэдэгдэл"
            description="Жишээ бот. Мессежүүд энд бүртгэгдэнэ, бодитоор илгээгдэхгүй."
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sending || !latestSubmission}
                onClick={sendTestSms}
              >
                <IconMessage className="eduflow:size-4" />
                {sending ? "Бүртгэж байна…" : "Жишээ SMS"}
              </Button>
            }
          >
            <div className="eduflow:mb-3 eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/60 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-text">
              <IconPhone className="eduflow:size-4 eduflow:text-edu-cyan" />
              {demo.parent?.phone ?? "Утас бүртгэгдээгүй"} ·{" "}
              <span className="eduflow:text-edu-cyan">жишээ суваг</span>
            </div>

            {notifications.length === 0 ? (
              <EmptyState
                title="Мэдэгдэл алга"
                description="Даалгавар дуусах эсвэл жишээ SMS илгээхэд энд харагдана."
              />
            ) : (
              <div className="eduflow:grid eduflow:gap-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:p-3"
                  >
                    <div className="eduflow:flex eduflow:items-start eduflow:gap-2">
                      <IconSparkles className="eduflow:mt-0.5 eduflow:size-4 eduflow:shrink-0 eduflow:text-edu-lav" />
                      <p className="eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
                        {notification.message}
                      </p>
                    </div>
                    <div className="eduflow:mt-1.5 eduflow:flex eduflow:items-center eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
                      <span>
                        {notification.student?.name ?? child.name} ·{" "}
                        {formatDate(notification.createdAt)}
                      </span>
                      <span className="eduflow:rounded-full eduflow:bg-edu-cyan/10 eduflow:px-2 eduflow:py-0.5 eduflow:text-edu-cyan">
                        {notification.status === "sent"
                          ? "илгээгдсэн"
                          : notification.status === "failed"
                            ? "алдаа"
                            : "жишээ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={`${child.name}-ийн даалгавар`}
          description="Багшийн даалгаврын жагсаалтаас шууд шинэчлэгдэнэ."
        >
          {demo.homeworks.length === 0 ? (
            <EmptyState title="Даалгавар алга" />
          ) : (
            <div className="eduflow:grid eduflow:gap-2.5">
              {demo.homeworks.map((homework) => {
                const submission = childSubmissions.find(
                  (item) => item.homeworkId === homework._id,
                );
                const status = submission?.status ?? "todo";

                return (
                  <div
                    key={homework._id}
                    className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3.5"
                  >
                    <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-2">
                      <div>
                        <p className="eduflow:text-[10px] eduflow:text-edu-lav">
                          {homework.subject}
                        </p>
                        <h3 className="eduflow:text-sm eduflow:font-semibold eduflow:text-white">
                          {homework.title}
                        </h3>
                        <p className="eduflow:mt-1 eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-text">
                          <IconClock className="eduflow:size-3" />
                          {formatDay(homework.dueDate)} ·{" "}
                          {dueLabel(homework.dueDate)}
                        </p>
                      </div>
                      <StatusPill
                        status={status}
                        label={
                          status === "todo"
                            ? "Илгээгээгүй"
                            : status === "approved"
                              ? "Дууссан"
                              : undefined
                        }
                      />
                    </div>

                    {submission?.aiFeedback && (
                      <p className="eduflow:mt-2 eduflow:rounded-lg eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:px-2.5 eduflow:py-2 eduflow:text-[10px] eduflow:leading-relaxed eduflow:text-edu-text">
                        {submission.aiFeedback}
                      </p>
                    )}

                    {submission?.status === "approved" && (
                      <p className="eduflow:mt-2 eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-cyan">
                        <IconCheck className="eduflow:size-3.5" />
                        Дууссан
                        {submission.completedAt
                          ? ` · ${formatDate(submission.completedAt)}`
                          : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
