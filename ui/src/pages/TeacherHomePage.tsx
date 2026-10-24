import {
  IconBook,
  IconClipboardCheck,
  IconClipboardList,
  IconFlame,
  IconUsers,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { Button } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { useAuth } from "../auth/AuthContext";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  Avatar,
  EmptyState,
  ErrorBanner,
  PageHeading,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusPill,
  dueLabel,
  formatDay,
  type Demo,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

const RecentHomework = ({ demo }: { demo: Demo }) => (
  <div className="eduflow:grid eduflow:gap-2.5">
    {demo.homeworks.slice(0, 3).map((homework) => (
      <div
        key={homework._id}
        className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3"
      >
        <div className="eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-2">
          <div>
            <p className="eduflow:text-[10px] eduflow:text-edu-lav">
              {homework.subject}
            </p>
            <p className="eduflow:text-xs eduflow:font-semibold eduflow:text-white">
              {homework.title}
            </p>
            <p className="eduflow:mt-0.5 eduflow:text-[10px] eduflow:text-edu-text">
              {formatDay(homework.dueDate)} · {dueLabel(homework.dueDate)}
            </p>
          </div>
          <StatusPill
            status={homework.status}
            label={homework.status === "assigned" ? "Идэвхтэй" : "Хаагдсан"}
          />
        </div>
        <div className="eduflow:mt-2">
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
    ))}
  </div>
);

const ReviewQueue = ({ demo }: { demo: Demo }) => {
  const pending = demo.submissions.filter(
    (submission) => submission.status !== "approved",
  );

  if (pending.length === 0) {
    return (
      <EmptyState
        title="Шалгах зүйл алга"
        description="Бүх илгээлт баталгаажсан байна."
      />
    );
  }

  return (
    <div className="eduflow:grid eduflow:gap-2">
      {pending.slice(0, 5).map((submission) => {
        const homework = demo.homeworks.find(
          (item) => item._id === submission.homeworkId,
        );

        return (
          <div
            key={submission._id}
            className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-3 eduflow:py-2"
          >
            <div className="eduflow:flex eduflow:min-w-0 eduflow:items-center eduflow:gap-2">
              <Avatar name={submission.student?.name ?? "Сурагч"} size="sm" />
              <div className="eduflow:min-w-0">
                <p className="eduflow:truncate eduflow:text-xs eduflow:text-white">
                  {submission.student?.name ?? "Сурагч"}
                </p>
                <p className="eduflow:truncate eduflow:text-[10px] eduflow:text-edu-text">
                  {homework?.title ?? "Даалгавар"} · AI {submission.aiScore ?? "—"}%
                </p>
              </div>
            </div>
            <StatusPill status={submission.status} />
          </div>
        );
      })}
    </div>
  );
};

export const TeacherHomePage = () => {
  const { session } = useAuth();
  const { demo, loading, error, refetch } = useEduflowDemo("teacher");

  if (loading && !demo) {
    return (
      <div className="eduflow:grid eduflow:gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="eduflow:h-24 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card"
          />
        ))}
      </div>
    );
  }

  if (!demo) {
    return (
      <ErrorBanner
        message={error?.message ?? "Мэдээлэл ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Багшийн ажлын талбар"
        title={`Сайн байна уу, ${session?.member.name ?? demo.teacher?.name ?? "багш"}!`}
        description="Өнөөдрийн даалгавар, шалгах дараалал, хичээлийн төлөвлөгөөгөө нэг дор хараарай."
        action={
          <Button asChild>
            <Link to={`${base}/teacher/homework`}>
              <IconBook className="eduflow:size-4" />
              Даалгавар өгөх
            </Link>
          </Button>
        }
      />

      <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2 eduflow:xl:grid-cols-4">
        <StatCard
          label="Сурагч"
          value={demo.stats.totalStudents}
          hint="5А анги"
          icon={IconUsers}
        />
        <StatCard
          label="Даалгавар"
          value={demo.stats.totalHomework}
          hint="Идэвхтэй"
          icon={IconBook}
          accent="blue"
        />
        <StatCard
          label="Шалгах"
          value={demo.stats.pendingReviews}
          hint="AI шалгасан"
          icon={IconClipboardCheck}
          accent="lav"
        />
        <StatCard
          label="Дундаж цуврал"
          value={`${demo.stats.averageStreak} өдөр`}
          hint="Ангийн хөдөлгөөн"
          icon={IconFlame}
          accent="cyan"
        />
      </div>

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-2">
        <SectionCard
          title="Өнөөдрийн даалгавар"
          description="Хамгийн сүүлийн гурван даалгавар."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/teacher/homework`}>Бүгдийг харах</Link>
            </Button>
          }
        >
          <RecentHomework demo={demo} />
        </SectionCard>

        <SectionCard
          title="Шалгах дараалал"
          description="AI шалгасан боловч багш батлаагүй илгээлтүүд."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/teacher/homework`}>Шалгах</Link>
            </Button>
          }
        >
          <ReviewQueue demo={demo} />
        </SectionCard>
      </div>

      <SectionCard
        title="Хичээлийн төлөвлөгөө"
        description="Ноорог → хяналт → батлагдсан."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/teacher/plans`}>
              <IconClipboardList className="eduflow:size-4" />
              Төлөвлөгөө
            </Link>
          </Button>
        }
      >
        <div className="eduflow:grid eduflow:gap-2 eduflow:md:grid-cols-3">
          {demo.lessonPlans.slice(0, 3).map((plan) => (
            <div
              key={plan._id}
              className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3"
            >
              <p className="eduflow:text-[10px] eduflow:text-edu-lav">
                {plan.subject}
              </p>
              <p className="eduflow:mt-0.5 eduflow:line-clamp-2 eduflow:text-xs eduflow:font-medium eduflow:text-white">
                {plan.title}
              </p>
              <div className="eduflow:mt-2">
                <StatusPill
                  status={plan.status}
                  label={
                    plan.status === "draft"
                      ? "Ноорог"
                      : plan.status === "review"
                        ? "Хяналтад"
                        : "Батлагдсан"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
