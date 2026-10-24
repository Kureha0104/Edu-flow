import { useMutation } from "@apollo/client";
import {
  IconAlertTriangle,
  IconDeviceFloppy,
  IconInfoCircle,
  IconLogout,
  IconRotate,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { useAuth } from "../auth/AuthContext";
import { RESET_DEMO } from "~/graphql";
import {
  ErrorBanner,
  PageHeading,
  SectionCard,
} from "../modules/eduflow/ui";

const { path } = manifest.ui;
const SMS_KEY = "eduflow.settings.sms";

const roleLabel = (role: string) =>
  role === "teacher" ? "Багш" : role === "student" ? "Сурагч" : "Эцэг эх";

export const SettingsPage = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [smsEnabled, setSmsEnabled] = useState(
    () => window.localStorage.getItem(SMS_KEY) !== "off",
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetDemo, { loading: resetting }] = useMutation(RESET_DEMO);

  if (!session) {
    return null;
  }

  const member = session.member;

  const savePreferences = () => {
    window.localStorage.setItem(SMS_KEY, smsEnabled ? "on" : "off");
    setMessage("Тохиргоо хадгалагдлаа.");
  };

  const handleReset = async () => {
    setMessage(null);
    try {
      await resetDemo();
      logout();
      navigate(`/${path}`, { replace: true });
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Демо өгөгдөл reset хийж чадсангүй.",
      );
    }
  };

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Тохиргоо"
        title="Бүртгэл ба тохиргоо"
        description="Профайл, мэдэгдэл, хэл болон демо өгөгдлийн удирдлага."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate(`/${path}`, { replace: true });
            }}
          >
            <IconLogout className="eduflow:size-4" />
            Гарах
          </Button>
        }
      />

      {message && <ErrorBanner message={message} />}

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-2">
        <SectionCard
          title="Профайл"
          description="Энэ мэдээлэл сургуулийн бүртгэлээс ирнэ (одоогоор жишээ)."
        >
          <div className="eduflow:flex eduflow:items-center eduflow:gap-3">
            <span className="eduflow:flex eduflow:size-14 eduflow:items-center eduflow:justify-center eduflow:rounded-2xl eduflow:bg-edu-purple/20 eduflow:text-edu-lav">
              <IconUser className="eduflow:size-7" />
            </span>
            <div>
              <p className="eduflow:text-sm eduflow:font-semibold eduflow:text-white">
                {member.name}
              </p>
              <p className="eduflow:text-[11px] eduflow:text-edu-text">
                {member.email}
              </p>
              <p className="eduflow:mt-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
                {roleLabel(member.role)} ·{" "}
                {member.role === "parent"
                  ? "Гэр бүлийн бүртгэл"
                  : member.grade ?? "5А анги"}
              </p>
            </div>
          </div>
          <div className="eduflow:mt-4 eduflow:grid eduflow:gap-2 eduflow:text-[11px]">
            <div className="eduflow:flex eduflow:justify-between eduflow:border-b eduflow:border-edu-border eduflow:pb-2">
              <span className="eduflow:text-edu-text">И-мэйл</span>
              <span className="eduflow:text-white">{member.email}</span>
            </div>
            <div className="eduflow:flex eduflow:justify-between eduflow:border-b eduflow:border-edu-border eduflow:pb-2">
              <span className="eduflow:text-edu-text">Үүрэг</span>
              <span className="eduflow:text-white">{roleLabel(member.role)}</span>
            </div>
            <div className="eduflow:flex eduflow:justify-between">
              <span className="eduflow:text-edu-text">Утас</span>
              <span className="eduflow:text-white">
                {member.phone ?? "Бүртгэгдээгүй"}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Мэдэгдэл ба хэл"
          description="SMS бот нь жишээ. Хэл одоогоор Монгол хэл дээр."
        >
          <div className="eduflow:grid eduflow:gap-3">
            <label className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-3 eduflow:py-2.5">
              <span>
                <span className="eduflow:block eduflow:text-xs eduflow:text-white">
                  Эцэг эхэд SMS
                </span>
                <span className="eduflow:block eduflow:text-[10px] eduflow:text-edu-text">
                  Даалгавар дуусахад мэдэгдэл бүртгэх
                </span>
              </span>
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(event) => setSmsEnabled(event.target.checked)}
                className="eduflow:size-4 eduflow:accent-[#C4B5FD]"
              />
            </label>

            <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-3 eduflow:py-2.5">
              <span className="eduflow:text-xs eduflow:text-white">Хэл</span>
              <span className="eduflow:rounded-full eduflow:bg-edu-purple/15 eduflow:px-2.5 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
                Монгол
              </span>
            </div>

            <Button type="button" size="sm" onClick={savePreferences}>
              <IconDeviceFloppy className="eduflow:size-4" />
              Тохиргоо хадгалах
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Демо өгөгдөл"
          description="Бүх жишээ сурагч, даалгавар, төлөвлөгөөг устгаж, анхны төлөвт буцаана."
        >
          <div className="eduflow:flex eduflow:items-start eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:px-3 eduflow:py-2.5 eduflow:text-[11px] eduflow:text-edu-lav">
            <IconAlertTriangle className="eduflow:mt-0.5 eduflow:size-4 eduflow:shrink-0" />
            <span>
              Reset хийсний дараа та дахин нэвтрэх шаардлагатай. Зөвхөн демо
              өгөгдөлд нөлөөлнө.
            </span>
          </div>

          {!confirmReset ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="eduflow:mt-3"
              onClick={() => setConfirmReset(true)}
            >
              <IconRotate className="eduflow:size-4" />
              Демо reset
            </Button>
          ) : (
            <div className="eduflow:mt-3 eduflow:flex eduflow:flex-wrap eduflow:gap-2">
              <Button
                type="button"
                size="sm"
                disabled={resetting}
                onClick={() => void handleReset()}
              >
                {resetting ? "Reset хийж байна…" : "Тийм, reset хийх"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmReset(false)}
              >
                Цуцлах
              </Button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Плагины мэдээлэл">
          <div className="eduflow:grid eduflow:gap-2 eduflow:text-[11px]">
            {[
              ["Нэр", manifest.name],
              ["Хаяг", `/${path}`],
              ["Remote", manifest.ui.remote],
              ["API", `:${manifest.api.port}${manifest.api.graphql}`],
              ["Хувилбар", manifest.version],
            ].map(([label, value]) => (
              <div
                key={label}
                className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:border-b eduflow:border-edu-border eduflow:pb-1.5 last:eduflow:border-0"
              >
                <span className="eduflow:text-edu-text">{label}</span>
                <code className="eduflow:rounded eduflow:bg-edu-card2 eduflow:px-1.5 eduflow:py-0.5 eduflow:font-mono eduflow:text-[10px] eduflow:text-edu-lav">
                  {value}
                </code>
              </div>
            ))}
          </div>
          <p className="eduflow:mt-3 eduflow:flex eduflow:items-start eduflow:gap-1.5 eduflow:text-[10px] eduflow:leading-relaxed eduflow:text-edu-text">
            <IconInfoCircle className="eduflow:mt-0.5 eduflow:size-3.5 eduflow:shrink-0" />
            Бодит SSO, AI vision, SMS нийлүүлэгчийг дараагийн шатанд холбоно.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};
