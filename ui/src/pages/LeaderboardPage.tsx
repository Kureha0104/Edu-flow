import { useQuery } from "@apollo/client";
import { IconCrown, IconFlame, IconLock, IconTrophy } from "@tabler/icons-react";
import { Link } from "react-router";
import { Button } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import type { EduflowLeaderboardQuery } from "~/gql/graphql";
import { LEADERBOARD_QUERY } from "~/graphql";
import { useAuth } from "../auth/AuthContext";
import {
  Avatar,
  EmptyState,
  ErrorBanner,
  PageHeading,
  SectionCard,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

type Entry = EduflowLeaderboardQuery["eduflowLeaderboard"][number];

const EntryCard = ({ entry, featured }: { entry: Entry; featured?: boolean }) => (
  <div
    className={`eduflow:flex eduflow:items-center eduflow:gap-3 eduflow:rounded-2xl eduflow:border eduflow:p-3 ${
      featured
        ? "eduflow:border-edu-lav/30 eduflow:bg-gradient-to-br eduflow:from-edu-purple/25 eduflow:to-edu-card"
        : "eduflow:border-edu-border eduflow:bg-edu-card2/50"
    }`}
  >
    <span
      className={`eduflow:flex eduflow:size-8 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:text-xs eduflow:font-semibold ${
        entry.rank === 1
          ? "eduflow:bg-edu-lav/20 eduflow:text-edu-lav"
          : entry.rank === 2
            ? "eduflow:bg-edu-blue/15 eduflow:text-edu-blue"
            : entry.rank === 3
              ? "eduflow:bg-edu-cyan/10 eduflow:text-edu-cyan"
              : "eduflow:bg-edu-card2 eduflow:text-edu-text"
      }`}
    >
      {entry.rank}
    </span>
    <Avatar name={entry.member.name} />
    <div className="eduflow:min-w-0 eduflow:flex-1">
      <p className="eduflow:truncate eduflow:text-xs eduflow:font-semibold eduflow:text-white">
        {entry.member.name}
      </p>
      <p className="eduflow:text-[10px] eduflow:text-edu-text">
        {entry.approved}/{entry.total} даалгавар · {entry.streak} өдрийн цуврал
      </p>
    </div>
    <div className="eduflow:text-right">
      <p className="eduflow:text-lg eduflow:font-semibold eduflow:text-edu-cyan">
        {entry.grade}%
      </p>
      <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
        дүн
      </p>
    </div>
    {entry.rank === 1 && (
      <IconCrown className="eduflow:size-4 eduflow:text-edu-lav" />
    )}
  </div>
);

export const LeaderboardPage = () => {
  const { session } = useAuth();
  const { data, loading, error, refetch } = useQuery(LEADERBOARD_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (error || !data) {
    return (
      <ErrorBanner
        message={error?.message ?? "Тэргүүлэгчдийг ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const entries = data.eduflowLeaderboard;
  const top = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Нээлттэй тэргүүлэгчид"
        title="Энэ долоо хоногийн тэргүүлэгчид"
        description="Батлагдсан гэрийн даалгаврын дүнгээр эрэмбэлнэ. Зөвхөн нийтэд нээлттэй сурагчид харагдана."
        action={
          session?.member.role === "student" ? (
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/settings`}>
                <IconLock className="eduflow:size-4" />
                Хувийн тохиргоо
              </Link>
            </Button>
          ) : undefined
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Тэргүүлэгч байхгүй"
          description="Сурагчид даалгавраа баталгаажуулж, нээлттэй болгоогүй байна."
        />
      ) : (
        <>
          <div className="eduflow:grid eduflow:gap-2.5 eduflow:md:grid-cols-3">
            {top.map((entry) => (
              <div
                key={entry.member._id}
                className={`eduflow:rounded-3xl eduflow:border eduflow:p-4 ${
                  entry.rank === 1
                    ? "eduflow:border-edu-lav/40 eduflow:bg-gradient-to-br eduflow:from-edu-purple/35 eduflow:to-edu-card"
                    : "eduflow:border-edu-border eduflow:bg-edu-card"
                }`}
              >
                <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
                  <span className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-widest eduflow:text-edu-lav">
                    #{entry.rank}
                  </span>
                  <IconTrophy className="eduflow:size-4 eduflow:text-edu-lav" />
                </div>
                <div className="eduflow:mt-4 eduflow:flex eduflow:items-center eduflow:gap-3">
                  <Avatar name={entry.member.name} size="lg" />
                  <div>
                    <p className="eduflow:text-sm eduflow:font-semibold eduflow:text-white">
                      {entry.member.name}
                    </p>
                    <p className="eduflow:text-[10px] eduflow:text-edu-text">
                      {entry.approved}/{entry.total} даалгавар
                    </p>
                  </div>
                </div>
                <div className="eduflow:mt-4 eduflow:flex eduflow:items-end eduflow:justify-between">
                  <span className="eduflow:text-2xl eduflow:font-semibold eduflow:text-edu-cyan">
                    {entry.grade}%
                  </span>
                  <span className="eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-lav">
                    <IconFlame className="eduflow:size-3.5" />
                    {entry.streak} өдөр
                  </span>
                </div>
              </div>
            ))}
          </div>

          <SectionCard
            title="Бүх нээлттэй сурагч"
            description="Хувийн сурагчид энд харагдахгүй, гэхдээ багш, эцэг эх өөрсдийн самбараас харна."
          >
            <div className="eduflow:grid eduflow:gap-2">
              {rest.length === 0 ? (
                <p className="eduflow:py-4 eduflow:text-center eduflow:text-[11px] eduflow:text-edu-text">
                  Бусад нээлттэй сурагч байхгүй.
                </p>
              ) : (
                rest.map((entry) => (
                  <EntryCard key={entry.member._id} entry={entry} />
                ))
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};
