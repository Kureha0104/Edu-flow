import { useQuery } from "@apollo/client";
import {
  IconBook,
  IconFlame,
  IconSchool,
  IconSettings,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { Breadcrumb, Button, Separator, Skeleton } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { DEMO_QUERY, STUDENTS_QUERY } from "../graphql";
import { ParentView } from "../modules/eduflow/ParentView";
import { RoleSwitch, type DemoRole } from "../modules/eduflow/RoleSwitch";
import { StudentView } from "../modules/eduflow/StudentView";
import { TeacherView } from "../modules/eduflow/TeacherView";
import { ErrorBanner } from "../modules/eduflow/ui";

const { path } = manifest.ui;

const LoadingGrid = () => (
  <div className="eduflow:grid eduflow:gap-4">
    <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2 eduflow:xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton
          key={index}
          className="eduflow:h-24 eduflow:rounded-2xl eduflow:bg-edu-card"
        />
      ))}
    </div>
    <div className="eduflow:grid eduflow:gap-4 eduflow:xl:grid-cols-2">
      <Skeleton className="eduflow:h-80 eduflow:rounded-2xl eduflow:bg-edu-card" />
      <Skeleton className="eduflow:h-80 eduflow:rounded-2xl eduflow:bg-edu-card" />
    </div>
  </div>
);

const JourneySteps = () => {
  const steps = [
    { icon: IconBook, label: "Teacher assigns" },
    { icon: IconSchool, label: "Student photographs" },
    { icon: IconSparkles, label: "AI checks" },
    { icon: IconUsers, label: "Parent follows" },
  ];

  return (
    <div className="eduflow:mt-4 eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
      {steps.map(({ icon: Icon, label }, index) => (
        <div key={label} className="eduflow:flex eduflow:items-center eduflow:gap-2">
          <span className="eduflow:inline-flex eduflow:items-center eduflow:gap-1.5 eduflow:rounded-full eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/60 eduflow:px-2.5 eduflow:py-1 eduflow:text-[10px] eduflow:text-edu-text">
            <Icon className="eduflow:size-3.5 eduflow:text-edu-lav" />
            {label}
          </span>
          {index < steps.length - 1 && (
            <span className="eduflow:text-edu-text/40">→</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const IndexPage = () => {
  const [role, setRole] = useState<DemoRole>("teacher");
  const [studentId, setStudentId] = useState<string>();

  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(DEMO_QUERY, {
    variables: {
      role,
      memberId: role === "student" ? studentId : undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: studentsData } = useQuery(STUDENTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const demo = data?.eduflowDemo;
  const students = studentsData?.eduflowMembers ?? demo?.students ?? [];
  const switching = loading || (demo?.role && demo.role !== role);

  const handleRole = (next: DemoRole) => {
    setRole(next);
    setStudentId(undefined);
  };

  return (
    <div className="eduflow:flex eduflow:h-full eduflow:flex-col eduflow:bg-edu-bg">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="eduflow:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/${path}`}>
                    <IconSchool />
                    {manifest.title}
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="eduflow:text-xs eduflow:text-edu-text">
                  {role === "teacher"
                    ? "Teacher workspace"
                    : role === "student"
                      ? "Student streak"
                      : "Parent progress"}
                </span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={[manifest.title]}
            icon="IconSchool"
          />
        </PageHeader.Start>
        <PageHeader.End>
          <Button variant="outline" asChild>
            <Link to={`/${path}/settings`}>
              <IconSettings />
              Settings
            </Link>
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="eduflow:flex-1 eduflow:overflow-auto">
        <div className="eduflow:mx-auto eduflow:flex eduflow:w-full eduflow:max-w-7xl eduflow:flex-col eduflow:gap-5 eduflow:p-5 eduflow:md:p-6">
          <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:p-5 eduflow:shadow-[0_0_80px_-40px_#7C3AED] eduflow:md:p-6">
            <div
              aria-hidden
              className="eduflow:pointer-events-none eduflow:absolute eduflow:-right-16 eduflow:-top-24 eduflow:size-72 eduflow:rounded-full eduflow:bg-edu-purple/25 eduflow:blur-3xl"
            />
            <div className="eduflow:relative eduflow:grid eduflow:gap-5 eduflow:lg:grid-cols-[1fr_420px] eduflow:lg:items-center">
              <div>
                <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
                  <span className="eduflow:rounded-full eduflow:border eduflow:border-edu-cyan/30 eduflow:bg-edu-cyan/10 eduflow:px-2.5 eduflow:py-0.5 eduflow:text-[10px] eduflow:font-medium eduflow:text-edu-cyan">
                    DEMO SCHOOL · GRADE 5A
                  </span>
                  <span className="eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-text">
                    <IconFlame className="eduflow:size-3.5 eduflow:text-edu-lav" />
                    streaks only for students
                  </span>
                </div>
                <h1 className="eduflow:mt-3 eduflow:text-2xl eduflow:font-semibold eduflow:tracking-tight eduflow:text-white eduflow:md:text-3xl">
                  Homework that keeps the streak alive
                </h1>
                <p className="eduflow:mt-2 eduflow:max-w-xl eduflow:text-sm eduflow:leading-relaxed eduflow:text-edu-text">
                  Teachers assign, students photograph their notebook, the demo
                  AI checks the work, and parents see progress — with a dummy
                  SMS bot standing in for the real one.
                </p>
                <JourneySteps />
              </div>
              <div className="eduflow:grid eduflow:gap-2">
                <RoleSwitch role={role} onChange={handleRole} />
                <p className="eduflow:px-1 eduflow:text-[10px] eduflow:text-edu-text">
                  Switch roles to preview the same school from each side.
                </p>
              </div>
            </div>
          </section>

          {error && !demo && (
            <ErrorBanner
              message={error.message}
              onRetry={() => {
                void refetch();
              }}
            />
          )}

          {!demo && loading && <LoadingGrid />}

          {demo && switching && (
            <div className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:text-[11px] eduflow:text-edu-text">
              <span className="eduflow:size-2 eduflow:animate-pulse eduflow:rounded-full eduflow:bg-edu-lav" />
              Switching to {role} view…
            </div>
          )}

          {demo && !switching && role === "teacher" && (
            <TeacherView demo={demo} refetch={refetch} />
          )}

          {demo && !switching && role === "student" && (
            <StudentView
              demo={demo}
              students={students}
              selectedStudentId={studentId ?? demo.member?._id}
              onSelectStudent={setStudentId}
              refetch={refetch}
            />
          )}

          {demo && !switching && role === "parent" && (
            <ParentView demo={demo} refetch={refetch} />
          )}

          <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card/60 eduflow:px-4 eduflow:py-3">
            <p className="eduflow:text-[10px] eduflow:text-edu-text">
              Demo data is seeded automatically per tenant. Real school SSO,
              vision AI and SMS are the next integrations.
            </p>
            <Link
              to={`/${path}/settings`}
              className="eduflow:text-[10px] eduflow:font-medium eduflow:text-edu-lav hover:eduflow:text-white"
            >
              Plugin settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
