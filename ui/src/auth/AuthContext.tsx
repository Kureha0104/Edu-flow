import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import manifest from "../../../erxes.json" with { type: "json" };

export type SessionRole = "teacher" | "student" | "parent";

export type SessionMember = {
  _id: string;
  name: string;
  email: string;
  role: SessionRole;
  grade?: string | null;
  phone?: string | null;
};

type Session = { member: SessionMember };

type AuthValue = {
  session: Session | null;
  login: (member: SessionMember) => void;
  logout: () => void;
};

const STORAGE_KEY = "eduflow.session.v1";

const AuthContext = createContext<AuthValue | null>(null);

const isRole = (value: unknown): value is SessionRole =>
  value === "teacher" || value === "student" || value === "parent";

const readSession = (): Session | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    const member = parsed.member;
    if (
      !member ||
      typeof member._id !== "string" ||
      typeof member.name !== "string" ||
      typeof member.email !== "string" ||
      !isRole(member.role)
    ) {
      return null;
    }
    return { member };
  } catch {
    return null;
  }
};

export const rolePath = (role: SessionRole) =>
  `/${manifest.ui.path}/${role}`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = useCallback((member: SessionMember) => {
    const next = { member };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
};
