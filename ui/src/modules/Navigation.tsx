import {
  IconBook,
  IconClipboardList,
  IconFlame,
  IconLayoutDashboard,
  IconLogout,
  IconSchool,
  IconSettings,
  IconSparkles,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
// Root import on purpose: core-ui shares `erxes-ui` as a Module Federation
// singleton keyed on the bare specifier, so deep imports would bundle a second
// private copy instead of reusing the host's.
import { NavigationMenuLinkItem, Sidebar } from "erxes-ui";
import { useNavigate } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { useAuth, type SessionRole } from "../auth/AuthContext";

const NAV_ITEMS: Record<
  SessionRole,
  { name: string; icon: typeof IconBook; path: string }[]
> = {
  teacher: [
    {
      name: "Хянах самбар",
      icon: IconLayoutDashboard,
      path: "/teacher",
    },
    {
      name: "Гэрийн даалгавар",
      icon: IconBook,
      path: "/teacher/homework",
    },
    {
      name: "Төлөвлөгөө",
      icon: IconClipboardList,
      path: "/teacher/plans",
    },
    {
      name: "Сурагчид",
      icon: IconUsers,
      path: "/teacher/students",
    },
    {
      name: "Тэргүүлэгчид",
      icon: IconTrophy,
      path: "/leaderboard",
    },
  ],
  student: [
    {
      name: "Миний өдөр",
      icon: IconFlame,
      path: "/student",
    },
    {
      name: "Гэрийн даалгавар",
      icon: IconBook,
      path: "/student/homework",
    },
    {
      name: "Дасгал",
      icon: IconSparkles,
      path: "/student/practice",
    },
    {
      name: "Тэргүүлэгчид",
      icon: IconTrophy,
      path: "/leaderboard",
    },
  ],
  parent: [
    {
      name: "Хүүхдийн явц",
      icon: IconUsers,
      path: "/parent",
    },
    {
      name: "Тэргүүлэгчид",
      icon: IconTrophy,
      path: "/leaderboard",
    },
  ],
};

const roleLabel = (role: SessionRole) =>
  role === "teacher" ? "Багш" : role === "student" ? "Сурагч" : "Эцэг эх";

export const Navigation = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    return null;
  }

  const { member } = session;

  return (
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <div className="eduflow:mb-3 eduflow:flex eduflow:items-center eduflow:gap-2.5 eduflow:px-2 eduflow:py-1">
          <span className="eduflow:inline-flex eduflow:size-9 eduflow:items-center eduflow:justify-center eduflow:rounded-xl eduflow:bg-gradient-to-br eduflow:from-edu-lav eduflow:to-edu-purple eduflow:text-edu-bg">
            <IconSchool className="eduflow:size-4" />
          </span>
          <div className="eduflow:min-w-0">
            <p className="eduflow:truncate eduflow:text-xs eduflow:font-semibold eduflow:text-white">
              {member.name}
            </p>
            <p className="eduflow:text-[10px] eduflow:text-edu-lav">
              {roleLabel(member.role)}
            </p>
          </div>
        </div>

        <Sidebar.Menu>
          {NAV_ITEMS[member.role].map((item) => (
            <NavigationMenuLinkItem
              key={item.path}
              name={item.name}
              icon={item.icon}
              path={`/${manifest.ui.path}${item.path}`}
            />
          ))}
          <NavigationMenuLinkItem
            name="Тохиргоо"
            icon={IconSettings}
            path={`/${manifest.ui.path}/settings`}
          />
        </Sidebar.Menu>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate(`/${manifest.ui.path}`, { replace: true });
          }}
          className="eduflow:mt-3 eduflow:flex eduflow:w-full eduflow:items-center eduflow:gap-2 eduflow:rounded-lg eduflow:px-2.5 eduflow:py-2 eduflow:text-left eduflow:text-xs eduflow:text-edu-text eduflow:transition hover:eduflow:bg-edu-card2 hover:eduflow:text-white"
        >
          <IconLogout className="eduflow:size-4" />
          Гарах
        </button>

        <p className="eduflow:mt-2 eduflow:px-2 eduflow:text-[9px] eduflow:text-edu-text/50">
          Edu Flow · demo school
        </p>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};
