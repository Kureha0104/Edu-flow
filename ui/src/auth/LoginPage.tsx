import { useMutation } from "@apollo/client";
import {
  IconArrowRight,
  IconFlame,
  IconLock,
  IconMail,
  IconSchool,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input, cn } from "erxes-ui";
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

const Feature = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof IconSchool;
  title: string;
  description: string;
}) => (
  <div className="eduflow:flex eduflow:items-start eduflow:gap-3">
    <span className="eduflow:mt-0.5 eduflow:inline-flex eduflow:size-9 eduflow:shrink-0 eduflow:items-center eduflow:justify-center eduflow:rounded-xl eduflow:bg-edu-lav/10 eduflow:text-edu-lav eduflow:ring-1 eduflow:ring-edu-lav/20">
      <Icon className="eduflow:size-4" />
    </span>
    <div>
      <p className="eduflow:text-xs eduflow:font-semibold eduflow:text-white">
        {title}
      </p>
      <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
        {description}
      </p>
    </div>
  </div>
);

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("sara.teacher@school.eduflow.local");
  const [password, setPassword] = useState("123456");
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
    <div className="eduflow:min-h-screen eduflow:bg-edu-bg eduflow:text-edu-text">
      <div className="eduflow:mx-auto eduflow:grid eduflow:min-h-screen eduflow:w-full eduflow:max-w-6xl eduflow:items-stretch eduflow:lg:grid-cols-[1.05fr_0.95fr]">
        <section className="eduflow:relative eduflow:flex eduflow:flex-col eduflow:justify-between eduflow:overflow-hidden eduflow:bg-gradient-to-br eduflow:from-edu-purple/25 eduflow:via-edu-card eduflow:to-edu-bg eduflow:p-8 eduflow:lg:p-12">
          <div
            aria-hidden
            className="eduflow:pointer-events-none eduflow:absolute eduflow:-left-24 eduflow:top-20 eduflow:size-72 eduflow:rounded-full eduflow:bg-edu-blue/10 eduflow:blur-3xl"
          />
          <div className="eduflow:relative">
            <div className="eduflow:flex eduflow:items-center eduflow:gap-3">
              <span className="eduflow:inline-flex eduflow:size-11 eduflow:items-center eduflow:justify-center eduflow:rounded-2xl eduflow:bg-gradient-to-br eduflow:from-edu-lav eduflow:to-edu-purple eduflow:text-edu-bg eduflow:shadow-[0_0_30px_-6px_#7C3AED]">
                <IconSchool className="eduflow:size-6" />
              </span>
              <div>
                <p className="eduflow:text-lg eduflow:font-semibold eduflow:tracking-tight eduflow:text-white">
                  Edu Flow
                </p>
                <p className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-[0.2em] eduflow:text-edu-lav">
                  Homework · Streak · Progress
                </p>
              </div>
            </div>

            <h1 className="eduflow:mt-10 eduflow:max-w-md eduflow:text-3xl eduflow:font-semibold eduflow:leading-tight eduflow:tracking-tight eduflow:text-white eduflow:lg:text-4xl">
              Даалгавраа хийж,
              <br />
              цувралаа үргэлжлүүл.
            </h1>
            <p className="eduflow:mt-3 eduflow:max-w-md eduflow:text-sm eduflow:leading-relaxed eduflow:text-edu-text">
              Багш даалгавар өгнө. Сурагч дэвтрээ зураглан илгээнэ. AI шалгаж,
              эцэг эх явцыг нь хянана.
            </p>

            <div className="eduflow:mt-8 eduflow:grid eduflow:max-w-md eduflow:gap-4">
              <Feature
                icon={IconSchool}
                title="Багшид зориулсан ажлын талбар"
                description="Даалгавар өгөх, илгээлтийг шалгах, хичээлийн төлөвлөгөө батлах."
              />
              <Feature
                icon={IconSparkles}
                title="AI шалгалт ба дасан зохицсон дасгал"
                description="Сурагчийн сул ойлголтыг олж, түвшинд тохирсон богино дасгал үүсгэнэ."
              />
              <Feature
                icon={IconFlame}
                title="Зөвхөн сурагчид цуврал"
                description="Өдөр бүр даалгавраа хийж XP, түвшин, цувралаа өсгөнө."
              />
              <Feature
                icon={IconUsers}
                title="Эцэг эхийн хяналт"
                description="Хүүхдийн явц, AI дүгнэлт, SMS мэдэгдлийг нэг дор харна."
              />
            </div>
          </div>

          <p className="eduflow:relative eduflow:mt-8 eduflow:text-[10px] eduflow:text-edu-text/70">
            Жишээ сургууль · 5А анги · Бүх өгөгдөл демо
          </p>
        </section>

        <section className="eduflow:flex eduflow:items-center eduflow:justify-center eduflow:bg-edu-bg eduflow:p-6 eduflow:lg:p-12">
          <div className="eduflow:w-full eduflow:max-w-sm">
            <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:p-6 eduflow:shadow-[0_0_60px_-30px_#7C3AED]">
              <h2 className="eduflow:text-xl eduflow:font-semibold eduflow:text-white">
                Нэвтрэх
              </h2>
              <p className="eduflow:mt-1 eduflow:text-xs eduflow:text-edu-text">
                Сургуулийн бүртгэлээрээ нэвтэрнэ үү.
              </p>

              <form onSubmit={handleSubmit} className="eduflow:mt-5 eduflow:grid eduflow:gap-3">
                <label className="eduflow:grid eduflow:gap-1.5">
                  <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
                    И-мэйл
                  </span>
                  <div className="eduflow:relative">
                    <IconMail className="eduflow:pointer-events-none eduflow:absolute eduflow:left-3 eduflow:top-1/2 eduflow:size-4 eduflow:-translate-y-1/2 eduflow:text-edu-text/60" />
                    <Input
                      required
                      type="email"
                      value={email}
                      autoComplete="username"
                      onChange={(event) => setEmail(event.target.value)}
                      className="eduflow:pl-9"
                    />
                  </div>
                </label>

                <label className="eduflow:grid eduflow:gap-1.5">
                  <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
                    Нууц үг
                  </span>
                  <div className="eduflow:relative">
                    <IconLock className="eduflow:pointer-events-none eduflow:absolute eduflow:left-3 eduflow:top-1/2 eduflow:size-4 eduflow:-translate-y-1/2 eduflow:text-edu-text/60" />
                    <Input
                      required
                      type="password"
                      value={password}
                      autoComplete="current-password"
                      onChange={(event) => setPassword(event.target.value)}
                      className="eduflow:pl-9"
                    />
                  </div>
                </label>

                {error && (
                  <p className="eduflow:rounded-lg eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-lav">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={loading} className="eduflow:mt-1">
                  {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
                  <IconArrowRight className="eduflow:size-4" />
                </Button>
              </form>
            </div>

            <div className="eduflow:mt-5">
              <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
                <p className="eduflow:text-[10px] eduflow:uppercase eduflow:tracking-widest eduflow:text-edu-text">
                  Жишээ бүртгэл
                </p>
                <span className="eduflow:text-[10px] eduflow:text-edu-text/70">
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
                    className={cn(
                      "eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card/60 eduflow:px-3 eduflow:py-2 eduflow:text-left eduflow:transition",
                      "hover:eduflow:border-edu-lav/40 hover:eduflow:bg-edu-card2",
                    )}
                  >
                    <span className="eduflow:min-w-0">
                      <span className="eduflow:block eduflow:text-xs eduflow:font-medium eduflow:text-white">
                        {account.name}
                      </span>
                      <span className="eduflow:block eduflow:truncate eduflow:text-[10px] eduflow:text-edu-text">
                        {account.detail}
                      </span>
                    </span>
                    <span className="eduflow:shrink-0 eduflow:rounded-full eduflow:border eduflow:border-edu-border eduflow:px-2 eduflow:py-0.5 eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-lav">
                      {roleLabel(account.role)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="eduflow:mt-4 eduflow:text-center eduflow:text-[10px] eduflow:text-edu-text/60">
              Энэ нь демо нэвтрэлт. Бодит сургуулийн SSO дараагийн шат.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
