import { useMutation } from "@apollo/client";
import {
  IconCheck,
  IconClipboardCheck,
  IconFileText,
  IconPaperclip,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "erxes-ui";
import {
  CREATE_LESSON_PLAN,
  UPDATE_LESSON_PLAN_STATUS,
} from "~/graphql";
import { fileToDataUrl } from "../modules/eduflow/image";
import { useEduflowDemo } from "../modules/eduflow/useDemo";
import {
  EmptyState,
  ErrorBanner,
  PageHeading,
  SectionCard,
  StatusPill,
  formatDate,
  type LessonPlan,
} from "../modules/eduflow/ui";

type Attachment = {
  name: string;
  mimeType: string;
  size: number;
  data: string;
};

const ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const statusLabel = (status: string) =>
  status === "draft" ? "Ноорог" : status === "review" ? "Хяналтад" : "Батлагдсан";

const PlanCard = ({
  plan,
  busy,
  onStatus,
}: {
  plan: LessonPlan;
  busy: boolean;
  onStatus: (planId: string, status: string) => void;
}) => (
  <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-4">
    <div className="eduflow:flex eduflow:flex-wrap eduflow:items-start eduflow:justify-between eduflow:gap-2">
      <div className="eduflow:min-w-0">
        <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
          <span className="eduflow:rounded-md eduflow:bg-edu-purple/15 eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
            {plan.subject}
          </span>
          <StatusPill status={plan.status} label={statusLabel(plan.status)} />
        </div>
        <h3 className="eduflow:mt-1.5 eduflow:text-sm eduflow:font-semibold eduflow:text-white">
          {plan.title}
        </h3>
      </div>
      <span className="eduflow:text-[10px] eduflow:text-edu-text">
        {plan.approvedAt
          ? `Батлагдсан ${formatDate(plan.approvedAt)}`
          : "Жишээ батлах урсгал"}
      </span>
    </div>

    <div className="eduflow:mt-3 eduflow:grid eduflow:gap-2 eduflow:md:grid-cols-2">
      {plan.objectives && (
        <div className="eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:p-2.5">
          <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
            Зорилго
          </p>
          <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
            {plan.objectives}
          </p>
        </div>
      )}
      {plan.materials && (
        <div className="eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:p-2.5">
          <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
            Материал
          </p>
          <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
            {plan.materials}
          </p>
        </div>
      )}
      {plan.assessment && (
        <div className="eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:p-2.5">
          <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
            Үнэлгээ
          </p>
          <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
            {plan.assessment}
          </p>
        </div>
      )}
      {plan.reviewNote && (
        <div className="eduflow:rounded-lg eduflow:border eduflow:border-edu-blue/20 eduflow:bg-edu-blue/5 eduflow:p-2.5">
          <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-blue">
            Тэмдэглэл
          </p>
          <p className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
            {plan.reviewNote}
          </p>
        </div>
      )}
    </div>

    {plan.attachments.length > 0 && (
      <div className="eduflow:mt-3 eduflow:flex eduflow:flex-wrap eduflow:gap-1.5">
        {plan.attachments.map((attachment) => (
          <a
            key={`${attachment.name}-${attachment.size}`}
            href={attachment.data}
            download={attachment.name}
            className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-bg/40 eduflow:px-2 eduflow:py-1 eduflow:text-[10px] eduflow:text-edu-lav eduflow:transition hover:eduflow:border-edu-lav/40 hover:eduflow:text-white"
          >
            <IconFileText className="eduflow:size-3.5" />
            {attachment.name}
          </a>
        ))}
      </div>
    )}

    <div className="eduflow:mt-3 eduflow:flex eduflow:flex-wrap eduflow:gap-1.5">
      {plan.status === "draft" && (
        <Button type="button" size="sm" disabled={busy} onClick={() => onStatus(plan._id, "review")}>
          <IconClipboardCheck className="eduflow:size-3.5" />
          Хяналтад илгээх
        </Button>
      )}
      {plan.status === "review" && (
        <>
          <Button type="button" size="sm" disabled={busy} onClick={() => onStatus(plan._id, "approved")}>
            <IconCheck className="eduflow:size-3.5" />
            Батлах
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onStatus(plan._id, "draft")}>
            Ноорог руу буцаах
          </Button>
        </>
      )}
      {plan.status === "approved" && (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onStatus(plan._id, "review")}>
          Дахин нээх
        </Button>
      )}
    </div>
  </div>
);

export const TeacherPlansPage = () => {
  const { demo, loading, error, refetch } = useEduflowDemo("teacher");
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busyId, setBusyId] = useState<string>();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "Математик",
    objectives: "",
    content: "",
    materials: "",
    assessment: "",
  });
  const [createPlan, { loading: creating }] =
    useMutation(CREATE_LESSON_PLAN);
  const [updateStatus] = useMutation(UPDATE_LESSON_PLAN_STATUS);

  if (loading && !demo) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
  }

  if (!demo) {
    return (
      <ErrorBanner
        message={error?.message ?? "Төлөвлөгөө ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      await createPlan({
        variables: {
          title: form.title,
          subject: form.subject,
          objectives: form.objectives || null,
          content: form.content || null,
          materials: form.materials || null,
          assessment: form.assessment || null,
          attachments,
        },
      });
      setForm((current) => ({
        ...current,
        title: "",
        objectives: "",
        content: "",
        materials: "",
        assessment: "",
      }));
      setAttachments([]);
      setOpen(false);
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Төлөвлөгөө үүсгэж чадсангүй.",
      );
    }
  };

  const handleAttachment = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);

    if (!ATTACHMENT_TYPES.includes(file.type)) {
      setMessage("Зөвхөн PDF, DOC, DOCX файл хавсаргана уу.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Файл 3MB-аас бага байх ёстой.");
      return;
    }
    if (attachments.length >= 3) {
      setMessage("Хамгийн ихдээ 3 файл хавсаргана.");
      return;
    }

    try {
      const data = await fileToDataUrl(file);
      setAttachments((current) => [
        ...current,
        {
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data,
        },
      ]);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Файлыг уншиж чадсангүй.",
      );
    }
  };

  const handleStatus = async (planId: string, status: string) => {
    setBusyId(planId);
    setMessage(null);
    try {
      await updateStatus({ variables: { planId, status } });
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Төлөв өөрчилж чадсангүй.",
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const grouped = {
    draft: demo.lessonPlans.filter((plan) => plan.status === "draft").length,
    review: demo.lessonPlans.filter((plan) => plan.status === "review").length,
    approved: demo.lessonPlans.filter((plan) => plan.status === "approved")
      .length,
  };

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Багш"
        title="Хичээлийн төлөвлөгөө"
        description="Зорилго, материал, үнэлгээгээ төлөвлөж, хяналт → батлах урсгалаар удирдана."
        action={
          <Button type="button" onClick={() => setOpen((value) => !value)}>
            <IconPlus className="eduflow:size-4" />
            Шинэ төлөвлөгөө
          </Button>
        }
      />

      <div className="eduflow:grid eduflow:grid-cols-3 eduflow:gap-2">
        {(
          [
            ["Ноорог", grouped.draft],
            ["Хяналтад", grouped.review],
            ["Батлагдсан", grouped.approved],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:px-3 eduflow:py-2.5"
          >
            <p className="eduflow:text-[9px] eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
              {label}
            </p>
            <p className="eduflow:text-lg eduflow:font-semibold eduflow:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {message && <ErrorBanner message={message} />}

      {open && (
        <SectionCard title="Шинэ төлөвлөгөө" description="Эхлээд ноорог хэлбэрээр хадгална.">
          <form onSubmit={handleCreate} className="eduflow:grid eduflow:gap-3">
            <div className="eduflow:grid eduflow:gap-3 eduflow:sm:grid-cols-2">
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Гарчиг</span>
                <Input
                  required
                  value={form.title}
                  placeholder="Бутархай: тэнцүү бутархай"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label className="eduflow:grid eduflow:gap-1.5">
                <span className="eduflow:text-[11px] eduflow:text-edu-text">Хичээл</span>
                <Input
                  required
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                />
              </label>
            </div>
            <label className="eduflow:grid eduflow:gap-1.5">
              <span className="eduflow:text-[11px] eduflow:text-edu-text">Зорилго</span>
              <Textarea
                rows={2}
                value={form.objectives}
                placeholder="Сурагч юу сурах вэ?"
                onChange={(event) =>
                  setForm((current) => ({ ...current, objectives: event.target.value }))
                }
              />
            </label>
            <label className="eduflow:grid eduflow:gap-1.5">
              <span className="eduflow:text-[11px] eduflow:text-edu-text">Материал</span>
              <Input
                value={form.materials}
                placeholder="Бутархайн загвар, ажлын хуудас"
                onChange={(event) =>
                  setForm((current) => ({ ...current, materials: event.target.value }))
                }
              />
            </label>
            <label className="eduflow:grid eduflow:gap-1.5">
              <span className="eduflow:text-[11px] eduflow:text-edu-text">Үнэлгээ</span>
              <Input
                value={form.assessment}
                placeholder="Гарах тасалбар, 3 бодлого"
                onChange={(event) =>
                  setForm((current) => ({ ...current, assessment: event.target.value }))
                }
              />
            </label>
            <div className="eduflow:grid eduflow:gap-1.5">
              <span className="eduflow:text-[11px] eduflow:text-edu-text">
                Хавсралт (PDF, DOC, DOCX · 3MB хүртэл)
              </span>
              <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:gap-2">
                <label className="eduflow:inline-flex eduflow:cursor-pointer eduflow:items-center eduflow:gap-1.5 eduflow:rounded-lg eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-purple/15 eduflow:px-3 eduflow:py-1.5 eduflow:text-[11px] eduflow:text-edu-lav hover:eduflow:bg-edu-purple/25">
                  <IconPaperclip className="eduflow:size-3.5" />
                  Файл нэмэх
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="eduflow:hidden"
                    onChange={(event) => {
                      void handleAttachment(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                {attachments.map((attachment) => (
                  <span
                    key={`${attachment.name}-${attachment.size}`}
                    className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2 eduflow:px-2 eduflow:py-1 eduflow:text-[10px] eduflow:text-edu-text"
                  >
                    <IconFileText className="eduflow:size-3.5 eduflow:text-edu-lav" />
                    {attachment.name}
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item !== attachment),
                        )
                      }
                      aria-label={`${attachment.name} хасах`}
                      className="eduflow:text-edu-text hover:eduflow:text-white"
                    >
                      <IconX className="eduflow:size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="eduflow:flex eduflow:justify-end eduflow:gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Цуцлах
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Хадгалж байна…" : "Ноорог хадгалах"}
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {demo.lessonPlans.length === 0 ? (
        <EmptyState title="Төлөвлөгөө алга" />
      ) : (
        <div className="eduflow:grid eduflow:gap-3">
          {demo.lessonPlans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              busy={busyId === plan._id}
              onStatus={handleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
