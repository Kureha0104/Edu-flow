import "./styles.css";
import { useEffect, useRef, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { AppLayout } from "erxes-ui";
import manifest from "../../erxes.json" with { type: "json" };
import { AuthProvider, rolePath, useAuth, type SessionRole } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { Navigation } from "./modules/Navigation";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ParentPage } from "./pages/ParentPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudentHomePage } from "./pages/StudentHomePage";
import { StudentHomeworkPage } from "./pages/StudentHomeworkPage";
import { StudentPracticePage } from "./pages/StudentPracticePage";
import { TeacherHomePage } from "./pages/TeacherHomePage";
import { TeacherStudentsPage } from "./pages/TeacherStudentsPage";
import { TeacherHomeworkPage } from "./pages/TeacherHomeworkPage";
import { TeacherPlansPage } from "./pages/TeacherPlansPage";

const RoleHome = () => {
  const { session } = useAuth();
  return <Navigate to={rolePath(session?.member.role ?? "teacher")} replace />;
};

const RoleGate = ({
  role,
  children,
}: {
  role: SessionRole;
  children: ReactNode;
}) => {
  const { session } = useAuth();

  if (!session) {
    return <LoginPage />;
  }

  if (session.member.role !== role) {
    return <Navigate to={rolePath(session.member.role)} replace />;
  }

  return <>{children}</>;
};

const Shell = () => {
  const { session } = useAuth();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!session) {
    return <LoginPage />;
  }

  return (
    <AppLayout
      id={manifest.name}
      title={manifest.title}
      sidebar={<Navigation />}
    >
      <div ref={scrollRef} className="eduflow-surface eduflow:h-full eduflow:min-h-0 eduflow:overflow-y-auto eduflow:bg-edu-bg">
        <div className="eduflow:mx-auto eduflow:w-full eduflow:max-w-7xl eduflow:px-5 eduflow:pb-5 eduflow:pt-10 eduflow:md:p-6">
      <Routes>
        <Route index element={<RoleHome />} />
        <Route path="teacher" element={<RoleGate role="teacher"><TeacherHomePage /></RoleGate>} />
        <Route path="teacher/homework" element={<RoleGate role="teacher"><TeacherHomeworkPage /></RoleGate>} />
        <Route path="teacher/plans" element={<RoleGate role="teacher"><TeacherPlansPage /></RoleGate>} />
        <Route path="teacher/students" element={<RoleGate role="teacher"><TeacherStudentsPage /></RoleGate>} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="student" element={<RoleGate role="student"><StudentHomePage /></RoleGate>} />
        <Route path="student/homework" element={<RoleGate role="student"><StudentHomeworkPage /></RoleGate>} />
        <Route path="student/practice" element={<RoleGate role="student"><StudentPracticePage /></RoleGate>} />
        <Route path="parent" element={<RoleGate role="parent"><ParentPage /></RoleGate>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<RoleHome />} />
      </Routes>
        </div>
      </div>
    </AppLayout>
  );
};

// core-ui mounts this component at `/<path>/*`; routes below are relative to
// it. It resolves the component by the PascalCase expose name.
export const Eduflow = () => (
  <AuthProvider>
    <Shell />
  </AuthProvider>
);
