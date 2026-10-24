import {
  IconAlertTriangle,
  IconCheck,
  IconEdit,
  IconFlame,
  IconPhone,
  IconTrophy,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button, Input } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { useMutation } from "@apollo/client";
import { studentHomeworkStats } from "../modules/eduflow/grades";
import { SET_PARENT_PHONE } from "~/graphql";
import { Modal } from "../modules/eduflow/Modal";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  Avatar,
  EmptyState,
  ErrorBanner,
  PageHeading,
  ProgressBar,
  SectionCard,
  StatCard,
  formatDate,
  type Member,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

export const TeacherStudentsPage = () => {
  const { demo, loading, error, refetch } = useEduflowDemo("teacher");
  const [phoneStudent, setPhoneStudent] = useState<Member | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savePhone, { loading: savingPhone }] = useMutation(SET_PARENT_PHONE);

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo) {
    return (
      <ErrorBanner
        message={error?.message ?? "Сурагчдын мэдээлэл ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const openPhone = (student: Member) => {
    setPhoneStudent(student);
    setPhone(student.parentPhone ?? "");
    setPhoneError(null);
  };

  const saveParentPhone = async () => {
    if (!phoneStudent) return;
    setPhoneError(null);
    try {
      await savePhone({ variables: { studentId: phoneStudent._id, phone } });
      setPhoneStudent(null);
      await refetch();
    } catch (cause) {
      setPhoneError(
        cause instanceof Error ? cause.message : "Утасны дугаарыг хадгалж чадсангүй.",
      );
    }
  };

  const rows = demo.students.map((student) => ({
    student,
    stats: studentHomeworkStats(student._id, demo),
  }));

  const classGrade =
    rows.length > 0
      ? Math.round(rows.reduce((sum, row) => sum + row.stats.grade, 0) / rows.length)
      : 0;
  const totalMissed = rows.reduce((sum, row) => sum + row.stats.missed, 0);

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Багш"
        title="Сурагчдын явц"
        description="Хэн даалгавраа хийсэн, хэн хоцорсон, дүн хэд байгааг нэг хүснэгтээс харна."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/leaderboard`}>
              <IconTrophy className="eduflow:size-4" />
              Тэргүүлэгчид
            </Link>
          </Button>
        }
      />

      <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-3">
        <StatCard
          label="Ангийн дүн"
          value={`${classGrade}%`}
          hint="Бүх даалгаврын дундаж"
          icon={IconTrophy}
          accent="cyan"
        />
        <StatCard
          label="Хоцорсон"
          value={totalMissed}
          hint="Батлагдаагүй даалгавар"
          icon={IconAlertTriangle}
          accent="lav"
        />
        <StatCard
          label="Сурагч"
          value={rows.length}
          hint="5А анги"
          icon={IconCheck}
          accent="blue"
        />
      </div>

      <SectionCard
        title="Сурагчийн тойм"
        description="Дүн нь батлагдсан даалгаврын оноог нийт оноонд харьцуулж тооцно."
      >
        {rows.length === 0 ? (
          <EmptyState title="Сурагч бүртгэгдээгүй" />
        ) : (
          <div className="eduflow:overflow-x-auto">
            <table className="eduflow:w-full eduflow:min-w-[720px] eduflow:border-separate eduflow:border-spacing-y-2 eduflow:text-left">
              <thead>
                <tr className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
                  <th className="eduflow:px-3 eduflow:py-1">Сурагч</th>
                  <th className="eduflow:px-3 eduflow:py-1">Дүн</th>
                  <th className="eduflow:px-3 eduflow:py-1">Цуврал</th>
                  <th className="eduflow:px-3 eduflow:py-1">Дууссан</th>
                  <th className="eduflow:px-3 eduflow:py-1">Хоцорсон</th>
                  <th className="eduflow:px-3 eduflow:py-1">Эцэг эхийн утас</th>
                  <th className="eduflow:px-3 eduflow:py-1">Сүүлийн илгээлт</th>
                  <th className="eduflow:px-3 eduflow:py-1">Тэргүүлэгч</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, stats }) => (
                  <tr key={student._id} className="eduflow:bg-edu-card2/50">
                    <td className="eduflow:rounded-l-xl eduflow:px-3 eduflow:py-2.5">
                      <div className="eduflow:flex eduflow:items-center eduflow:gap-2">
                        <Avatar name={student.name} size="sm" />
                        <div>
                          <p className="eduflow:text-xs eduflow:font-medium eduflow:text-edu-ink">
                            {student.name}
                          </p>
                          <p className="eduflow:text-[10px] eduflow:text-edu-text">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5">
                      <div className="eduflow:w-28">
                        <div className="eduflow:flex eduflow:justify-between eduflow:text-[10px] eduflow:text-edu-text">
                          <span>{stats.grade}%</span>
                          <span>{stats.approved}/{stats.total}</span>
                        </div>
                        <ProgressBar
                          value={stats.grade}
                          max={100}
                          tone={stats.grade < 50 ? "lav" : "cyan"}
                          className="eduflow:mt-1"
                        />
                      </div>
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5">
                      <span className="eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:text-xs eduflow:text-edu-lav">
                        <IconFlame className="eduflow:size-3.5" />
                        {student.streak} өдөр
                      </span>
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5 eduflow:text-xs eduflow:text-edu-cyan">
                      {stats.approved}
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5">
                      <span
                        className={
                          stats.missed > 0
                            ? "eduflow:rounded-full eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav"
                            : "eduflow:text-[10px] eduflow:text-edu-text"
                        }
                      >
                        {stats.missed} хоцорсон
                      </span>
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5">
                      <button
                        type="button"
                        onClick={() => openPhone(student)}
                        className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[10px] eduflow:text-edu-text hover:eduflow:text-edu-lav"
                      >
                        <IconPhone className="eduflow:size-3.5" />
                        {student.parentPhone ?? "Утас нэмэх"}
                        <IconEdit className="eduflow:size-3" />
                      </button>
                    </td>
                    <td className="eduflow:px-3 eduflow:py-2.5 eduflow:text-[10px] eduflow:text-edu-text">
                      {formatDate(stats.latest)}
                    </td>
                    <td className="eduflow:rounded-r-xl eduflow:px-3 eduflow:py-2.5">
                      <span
                        className={
                          student.leaderboardVisible
                            ? "eduflow:text-[10px] eduflow:text-edu-cyan"
                            : "eduflow:text-[10px] eduflow:text-edu-text"
                        }
                      >
                        {student.leaderboardVisible ? "Нээлттэй" : "Хувийн"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={Boolean(phoneStudent)}
        onClose={() => setPhoneStudent(null)}
        title="Эцэг эхийн утас"
        className="eduflow:max-w-md"
      >
        <div className="eduflow:grid eduflow:gap-3">
          <p className="eduflow:text-[11px] eduflow:text-edu-text">
            {phoneStudent?.name} сурагчийн эцэг эхийн утас. SMS мэдэгдэл энэ
            дугаар руу явна.
          </p>
          <Input
            value={phone}
            placeholder="+97699112233"
            onChange={(event) => setPhone(event.target.value)}
          />
          {phoneError && (
            <p className="eduflow:text-[11px] eduflow:text-[#a33a20]">{phoneError}</p>
          )}
          <div className="eduflow:flex eduflow:justify-end eduflow:gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPhoneStudent(null)}
            >
              Цуцлах
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingPhone}
              onClick={() => void saveParentPhone()}
            >
              {savingPhone ? "Хадгалж байна…" : "Хадгалах"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
