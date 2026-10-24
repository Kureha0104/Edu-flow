import {
  IconBook,
  IconCheck,
  IconClock,
  IconFlame,
  IconSparkles,
  IconStar,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { Button } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { useAuth } from "../auth/AuthContext";
import { StreakCard } from "../modules/eduflow/StreakCard";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  EmptyState,
  ErrorBanner,
  PageHeading,
  SectionCard,
  StatCard,
  StatusPill,
  dueLabel,
  formatDay,
  submissionLabel,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

export const StudentHomePage = () => {
  const { session } = useAuth();
  const studentId = session?.member._id;
  const { demo, loading, error, refetch } = useEduflowDemo(
    "student",
    studentId,
  );

  if (!session) {
    return null;
  }

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo?.member) {
    return (
      <ErrorBanner
        message={error?.message ?? "Сурагчийн мэдээлэл ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const member = demo.member;
  const approved = demo.submissions.filter(
    (submission) => submission.status === "approved",
  ).length;
  const pending = Math.max(0, demo.homeworks.length - approved);

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Сурагчийн ажлын талбар"
        title={`Сайн байна уу, ${member.name}?`}
        description="Өнөөдрийн даалгавраа хийж, цувралаа үргэлжлүүлээрэй. Дасгал чинь чамайг хүлээж байна."
        action={
          <Button asChild>
            <Link to={`${base}/student/practice`}>
              <IconSparkles className="eduflow:size-4" />
              Өнөөдрийн дасгал
            </Link>
          </Button>
        }
      />

      <StreakCard member={member} grade={demo.stats.homeworkGrade} />

      <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-3">
        <StatCard
          label="Дууссан"
          value={approved}
          hint="Баталгаажсан даалгавар"
          icon={IconCheck}
          accent="cyan"
        />
        <StatCard
          label="Хүлээгдэж буй"
          value={pending}
          hint="Илгээсэн эсвэл дахин хийх"
          icon={IconClock}
          accent="blue"
        />
        <StatCard
          label="Дундаж дүн"
          value={`${demo.stats.homeworkGrade}%`}
          hint="Бүх даалгаврын гүйцэтгэл"
          icon={IconStar}
          accent="lav"
        />
      </div>

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Өнөөдрийн даалгавар"
          description="Эхлээд хамгийн ойр дуусах даалгаврыг хийгээрэй."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/student/homework`}>Бүгдийг харах</Link>
            </Button>
          }
        >
          {demo.homeworks.length === 0 ? (
            <EmptyState
              title="Даалгавар алга"
              description="Багш удахгүй даалгавар өгнө."
            />
          ) : (
            <div className="eduflow:grid eduflow:gap-2.5">
              {demo.homeworks.slice(0, 3).map((homework) => {
                const submission = demo.submissions.find(
                  (item) => item.homeworkId === homework._id,
                );
                const status = submission?.status ?? "todo";

                return (
                  <Link
                    key={homework._id}
                    to={`${base}/student/homework`}
                    className="eduflow:block eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3 eduflow:transition hover:eduflow:border-edu-lav/30"
                  >
                    <div className="eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-2">
                      <div className="eduflow:min-w-0">
                        <p className="eduflow:text-[10px] eduflow:text-edu-lav">
                          {homework.subject}
                        </p>
                        <p className="eduflow:text-xs eduflow:font-semibold eduflow:text-white">
                          {homework.title}
                        </p>
                        <p className="eduflow:mt-0.5 eduflow:text-[10px] eduflow:text-edu-text">
                          {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)} · {homework.points} оноо
                        </p>
                      </div>
                      <StatusPill
                        status={status}
                        label={status === "todo" ? "Эхлээгүй" : submissionLabel(status)}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div className="eduflow:grid eduflow:gap-4">
          <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-2xl eduflow:border eduflow:border-edu-lav/25 eduflow:bg-gradient-to-br eduflow:from-edu-purple/30 eduflow:to-edu-card eduflow:p-4">
            <div
              aria-hidden
              className="eduflow:pointer-events-none eduflow:absolute eduflow:-right-8 eduflow:-top-10 eduflow:size-36 eduflow:rounded-full eduflow:bg-edu-blue/20 eduflow:blur-3xl"
            />
            <p className="eduflow:relative eduflow:text-[10px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-lav">
              Өнөөдрийн дасгал
            </p>
            <h3 className="eduflow:relative eduflow:mt-1 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
              Сул ойлголтоо бэхжүүл
            </h3>
            <p className="eduflow:relative eduflow:mt-1 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
              AI чинь хамгийн сул ойлголтыг олж, түвшинд тохирсон 5 богино
              асуулт бэлдэнэ. Зөв хариулах тусам хүндрэнэ.
            </p>
            <Button asChild size="sm" className="eduflow:relative eduflow:mt-3">
              <Link to={`${base}/student/practice`}>
                <IconSparkles className="eduflow:size-4" />
                Дасгал эхлүүлэх
              </Link>
            </Button>
          </section>

          <SectionCard title="Сүүлийн AI дүгнэлт">
            {demo.submissions.length === 0 ? (
              <EmptyState title="Одоогоор дүгнэлт алга" />
            ) : (
              <div className="eduflow:grid eduflow:gap-2">
                {demo.submissions.slice(0, 2).map((submission) => (
                  <div
                    key={submission._id}
                    className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3"
                  >
                    <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2">
                      <p className="eduflow:text-xs eduflow:text-white">
                        {submission.homework?.title ?? "Даалгавар"}
                      </p>
                      <span className="eduflow:text-[10px] eduflow:text-edu-cyan">
                        AI {submission.aiScore ?? "—"}%
                      </span>
                    </div>
                    <p className="eduflow:mt-1 eduflow:line-clamp-3 eduflow:text-[10px] eduflow:leading-relaxed eduflow:text-edu-text">
                      {submission.aiFeedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:px-3 eduflow:py-2 eduflow:text-[10px] eduflow:text-edu-text">
            <IconFlame className="eduflow:size-4 eduflow:text-edu-lav" />
            Цуврал зөвхөн сурагчид. Дүн нь баталгаажсан даалгавраар тооцогдоно.
          </div>
        </div>
      </div>

      <Link
        to={`${base}/student/homework`}
        className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:px-4 eduflow:py-3 eduflow:text-xs eduflow:text-edu-text eduflow:transition hover:eduflow:border-edu-lav/30 hover:eduflow:text-white"
      >
        <span className="eduflow:flex eduflow:items-center eduflow:gap-2">
          <IconBook className="eduflow:size-4 eduflow:text-edu-lav" />
          Бүх гэрийн даалгавраа харах
        </span>
        <span>→</span>
      </Link>
    </div>
  );
};
