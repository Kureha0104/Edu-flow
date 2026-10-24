import { useMutation } from "@apollo/client";
import {
  IconArrowRight,
  IconEye,
  IconEyeClosed,
  IconLock,
  IconMail,
  IconSparkles,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input, cn } from "erxes-ui";
import { EduflowMark } from "../assets/brand/EduflowMark";
import { LOGIN } from "~/graphql";
import { rolePath, useAuth, type SessionMember, type SessionRole } from "./AuthContext";

type DemoAccount = {
  email: string;
  name: string;
  role: SessionRole;
  detail: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "sara.teacher@school.eduflow.local",
    name: "Сара багш",
    role: "teacher",
    detail: "Багш · 5А анги",
  },
  {
    email: "anu.5a@school.eduflow.local",
    name: "Ану",
    role: "student",
    detail: "Сурагч · 6 өдрийн цуврал",
  },
  {
    email: "bilguun.5a@school.eduflow.local",
    name: "Билгүүн",
    role: "student",
    detail: "Сурагч · 2 өдрийн цуврал",
  },
  {
    email: "sarnai.5a@school.eduflow.local",
    name: "Сарнай",
    role: "student",
    detail: "Сурагч · шинэ",
  },
  {
    email: "tuya.parent@example.com",
    name: "Хатагтай Туяа",
    role: "parent",
    detail: "Эцэг эх · 3 хүүхэд",
  },
];

const roleLabel = (role: SessionRole) =>
  role === "teacher" ? "Багш" : role === "student" ? "Сурагч" : "Эцэг эх";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const toSessionMember = (member: {
  _id: string;
  name: string;
  email: string;
  role: string;
  grade?: string | null;
  phone?: string | null;
}): SessionMember | null => {
  if (
    member.role !== "teacher" &&
    member.role !== "student" &&
    member.role !== "parent"
  ) {
    return null;
  }

  return {
    _id: member._id,
    name: member.name,
    email: member.email,
    role: member.role,
    grade: member.grade,
    phone: member.phone,
  };
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("sara.teacher@school.eduflow.local");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMutation, { loading }] = useMutation(LOGIN);

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setError(null);

    try {
      const result = await loginMutation({
        variables: { email: nextEmail, password: nextPassword },
      });
      const member = result.data?.eduflowLogin.member;
      const sessionMember = member ? toSessionMember(member) : null;

      if (!sessionMember) {
        setError("Бүртгэлийн мэдээлэл буруу байна.");
        return;
      }

      login(sessionMember);
      navigate(rolePath(sessionMember.role), { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.",
      );
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void signIn(email, password);
  };

  return (
    <div className="eduflow-surface eduflow:min-h-screen eduflow:bg-[#f5f7fe] eduflow:text-edu-ink">
      <div className="eduflow:mx-auto eduflow:grid eduflow:min-h-screen eduflow:w-full eduflow:max-w-[1500px] eduflow:items-stretch eduflow:lg:grid-cols-[1.06fr_0.94fr]">
        <section className="eduflow:relative eduflow:hidden eduflow:overflow-hidden eduflow:bg-[#eaf1ff] eduflow:p-10 eduflow:lg:flex eduflow:lg:flex-col eduflow:lg:justify-between eduflow:xl:p-14">
          <div
            aria-hidden
            className="eduflow:pointer-events-none eduflow:absolute eduflow:-right-24 eduflow:top-10 eduflow:size-[520px] eduflow:rounded-full eduflow:bg-gradient-to-br eduflow:from-[#c6d8ff] eduflow:to-[#eef4ff] eduflow:blur-2xl"
          />
          <div
            aria-hidden
            className="eduflow:pointer-events-none eduflow:absolute eduflow:-bottom-24 eduflow:-left-16 eduflow:size-[420px] eduflow:rounded-full eduflow:bg-gradient-to-tr eduflow:from-[#ffd9c8] eduflow:to-[#fff3ec] eduflow:blur-3xl"
          />
          <div
            aria-hidden
            className="eduflow:pointer-events-none eduflow:absolute eduflow:right-8 eduflow:top-36 eduflow:size-64 eduflow:rounded-full eduflow:border eduflow:border-white/80 eduflow:bg-gradient-to-br eduflow:from-[#9fbaff] eduflow:to-[#dbe6ff] eduflow:shadow-[0_30px_80px_-20px_#7c9cff]"
          />

          <div className="eduflow:relative eduflow:flex eduflow:items-center eduflow:gap-3">
            <span className="eduflow:flex eduflow:size-11 eduflow:items-center eduflow:justify-center eduflow:rounded-2xl eduflow:bg-edu-lav eduflow:text-white eduflow:shadow-[0_10px_30px_-12px_#2f5bff]">
              <EduflowMark className="eduflow:size-6" />
            </span>
            <span className="eduflow:text-lg eduflow:font-semibold eduflow:tracking-tight">
              Edu Flow
            </span>
          </div>

          <div className="eduflow:relative eduflow:max-w-xl">
            <p className="eduflow:text-[11px] eduflow:font-semibold eduflow:uppercase eduflow:tracking-[0.26em] eduflow:text-[#50638a]">
              — Илүү тодорхой сурах зам
            </p>
            <h1 className="eduflow:mt-5 eduflow:text-[40px] eduflow:font-semibold eduflow:leading-[1.02] eduflow:tracking-[-0.04em] eduflow:text-[#0b1220] eduflow:xl:text-[56px]">
              Хүүхэд бүрийн
              <br />
              сурах зам.
            </h1>
            <p className="eduflow:mt-6 eduflow:max-w-md eduflow:text-base eduflow:leading-relaxed eduflow:text-[#53617c]">
              Багш даалгавар өгч, сурагч дэвтрээ зураглан илгээж, AI шалгана.
              Эцэг эх явцыг нь нэг дор харна.
            </p>

            <div className="eduflow:mt-10 eduflow:flex eduflow:items-center eduflow:gap-3">
              <div className="eduflow:flex eduflow:-space-x-2">
                {["А", "Б", "С", "Т"].map((letter, index) => (
                  <span
                    key={letter}
                    className={cn(
                      "eduflow:flex eduflow:size-9 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:border-2 eduflow:border-[#eaf1ff] eduflow:text-[10px] eduflow:font-semibold",
                      index === 0
                        ? "eduflow:bg-[#c9d9ff] eduflow:text-[#233b74]"
                        : index === 1
                          ? "eduflow:bg-[#ffd9c8] eduflow:text-[#7a3a22]"
                          : index === 2
                            ? "eduflow:bg-[#d6f3e5] eduflow:text-[#1f5a45]"
                            : "eduflow:bg-[#e6ddff] eduflow:text-[#3e2b7a]",
                    )}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <div>
                <p className="eduflow:text-[11px] eduflow:font-semibold eduflow:text-[#23324d]">
                  5А ангийн сурагчид
                </p>
                <p className="eduflow:text-[10px] eduflow:text-[#68758f]">
                  3 сурагч · 1 эцэг эх · өдөр тутмын цуврал
                </p>
              </div>
            </div>
          </div>

          <p className="eduflow:relative eduflow:text-[10px] eduflow:text-[#7b879e]">
            Edu Flow · жишээ сургууль · бүх өгөгдөл демо
          </p>
        </section>

        <section className="eduflow:flex eduflow:items-center eduflow:justify-center eduflow:bg-white eduflow:px-5 eduflow:py-10 eduflow:sm:px-8 eduflow:lg:px-12">
          <div className="eduflow:w-full eduflow:max-w-[420px]">
            <div className="eduflow:mb-8 eduflow:flex eduflow:items-center eduflow:gap-3 eduflow:lg:hidden">
              <span className="eduflow:flex eduflow:size-10 eduflow:items-center eduflow:justify-center eduflow:rounded-2xl eduflow:bg-edu-lav eduflow:text-white">
                <EduflowMark className="eduflow:size-5" />
              </span>
              <span className="eduflow:text-lg eduflow:font-semibold">
                Edu Flow
              </span>
            </div>

            <h2 className="eduflow:text-3xl eduflow:font-semibold eduflow:tracking-tight eduflow:text-[#0b1220]">
              Тавтай морил
            </h2>
            <p className="eduflow:mt-2 eduflow:text-sm eduflow:text-[#67738b]">
              Сургуулийн бүртгэлээрээ нэвтэрнэ үү.
            </p>

            <form onSubmit={handleSubmit} className="eduflow:mt-8 eduflow:grid eduflow:gap-4">
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-[#3c4a63]">
                  И-мэйл
                </span>
                <div className="eduflow:relative">
                  <IconMail className="eduflow:pointer-events-none eduflow:absolute eduflow:left-3 eduflow:top-1/2 eduflow:size-4 eduflow:-translate-y-1/2 eduflow:text-[#8a96ad]" />
                  <Input
                    required
                    type="email"
                    value={email}
                    autoComplete="username"
                    onChange={(event) => setEmail(event.target.value)}
                    className="eduflow:h-11 eduflow:rounded-xl eduflow:border-[#dfe5f1] eduflow:bg-white eduflow:pl-9 eduflow:text-[#0b1220]"
                  />
                </div>
              </label>

              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-[#3c4a63]">
                  Нууц үг
                </span>
                <div className="eduflow:relative">
                  <IconLock className="eduflow:pointer-events-none eduflow:absolute eduflow:left-3 eduflow:top-1/2 eduflow:size-4 eduflow:-translate-y-1/2 eduflow:text-[#8a96ad]" />
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    className="eduflow:h-11 eduflow:rounded-xl eduflow:border-[#dfe5f1] eduflow:bg-white eduflow:pl-9 eduflow:pr-9 eduflow:text-[#0b1220]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                    className="eduflow:absolute eduflow:right-2.5 eduflow:top-1/2 eduflow:-translate-y-1/2 eduflow:text-[#8a96ad] hover:eduflow:text-[#2f5bff]"
                  >
                    {showPassword ? (
                      <IconEyeClosed className="eduflow:size-4" />
                    ) : (
                      <IconEye className="eduflow:size-4" />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <p className="eduflow:rounded-xl eduflow:border eduflow:border-[#ffd2c7] eduflow:bg-[#fff1ed] eduflow:px-3 eduflow:py-2.5 eduflow:text-[11px] eduflow:text-[#a33a20]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="eduflow:mt-1 eduflow:h-11 eduflow:rounded-xl eduflow:bg-edu-lav eduflow:text-sm eduflow:text-white hover:eduflow:bg-edu-blue"
              >
                {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
                <IconArrowRight className="eduflow:size-4" />
              </Button>
            </form>

            <div className="eduflow:mt-7">
              <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
                <p className="eduflow:text-[10px] eduflow:font-medium eduflow:uppercase eduflow:tracking-[0.16em] eduflow:text-[#8a96ad]">
                  Жишээ бүртгэл
                </p>
                <span className="eduflow:text-[10px] eduflow:text-[#8a96ad]">
                  нууц үг: 123456
                </span>
              </div>
              <div className="eduflow:mt-2 eduflow:grid eduflow:gap-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={loading}
                    onClick={() => void signIn(account.email, "123456")}
                    className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-[#e6ebf5] eduflow:bg-[#fbfcff] eduflow:px-3 eduflow:py-2.5 eduflow:text-left eduflow:transition hover:eduflow:border-[#c6d5ff] hover:eduflow:bg-[#f4f7ff]"
                  >
                    <span className="eduflow:flex eduflow:min-w-0 eduflow:items-center eduflow:gap-2.5">
                      <span className="eduflow:flex eduflow:size-8 eduflow:shrink-0 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-[#e7edff] eduflow:text-[10px] eduflow:font-semibold eduflow:text-[#3154a3]">
                        {initials(account.name)}
                      </span>
                      <span className="eduflow:min-w-0">
                        <span className="eduflow:block eduflow:text-xs eduflow:font-medium eduflow:text-[#14203a]">
                          {account.name}
                        </span>
                        <span className="eduflow:block eduflow:truncate eduflow:text-[10px] eduflow:text-[#7b879e]">
                          {account.detail}
                        </span>
                      </span>
                    </span>
                    <span className="eduflow:shrink-0 eduflow:rounded-full eduflow:bg-white eduflow:px-2 eduflow:py-0.5 eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-[#50638a] eduflow:ring-1 eduflow:ring-[#e6ebf5]">
                      {roleLabel(account.role)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="eduflow:mt-6 eduflow:flex eduflow:items-center eduflow:justify-center eduflow:gap-1.5 eduflow:text-center eduflow:text-[10px] eduflow:text-[#9aa5b8]">
              <IconSparkles className="eduflow:size-3.5" />
              Демо нэвтрэлт. Бодит сургуулийн SSO дараагийн шат.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
