import { useMutation } from "@apollo/client";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconDownload,
  IconFileText,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconWand,
  IconX,
} from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "erxes-ui";
import {
  ASSESS_LESSON_PLAN,
  CREATE_LESSON_PLAN,
  GENERATE_LESSON_PLAN,
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

type Stage = {
  name: string;
  minutes: number;
  description: string;
  childrenRole: string;
};

type Draft = {
  title: string;
  ageGroup: string;
  duration: number;
  learningArea: string;
  goals: string;
  learningObjectives: string[];
  materials: string;
  activities: Stage[];
  childrenParticipation: string;
  differentiation: string;
  assessment: string;
  qualityScore: number;
  qualityIssues: string[];
};

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

const emptyDraft = (): Draft => ({
  title: "",
  ageGroup: "5–6 нас",
  duration: 30,
  learningArea: "Хэл яриа",
  goals: "",
  learningObjectives: [""],
  materials: "",
  activities: [
    { name: "", minutes: 5, description: "", childrenRole: "" },
  ],
  childrenParticipation: "",
  differentiation: "",
  assessment: "",
  qualityScore: 0,
  qualityIssues: [],
});

const toDraft = (plan: LessonPlan): Draft => ({
  title: plan.title,
  ageGroup: plan.ageGroup ?? "5–6 нас",
  duration: plan.duration ?? 30,
  learningArea: plan.learningArea ?? plan.subject,
  goals: plan.goals ?? plan.objectives ?? "",
  learningObjectives:
    plan.learningObjectives.length > 0 ? plan.learningObjectives : [""],
  materials: plan.materials ?? "",
  activities:
    plan.activities.length > 0
      ? plan.activities
      : [
          {
            name: "Үйл ажиллагаа",
            minutes: plan.duration ?? 30,
            description: plan.content ?? "",
            childrenRole: plan.childrenParticipation ?? "",
          },
        ],
  childrenParticipation: plan.childrenParticipation ?? "",
  differentiation: plan.differentiation ?? "",
  assessment: plan.assessment ?? "",
  qualityScore: plan.qualityScore ?? 0,
  qualityIssues: plan.qualityIssues,
});

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const downloadWord = (draft: Draft) => {
  const stages = draft.activities
    .map(
      (stage) => `<tr>
        <td>${escapeHtml(stage.name)}</td>
        <td>${stage.minutes} мин</td>
        <td>${escapeHtml(stage.description)}</td>
        <td>${escapeHtml(stage.childrenRole)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8">
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12pt; color: #111; }
    h1 { font-size: 20pt; } h2 { font-size: 14pt; margin-top: 18px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 6px; vertical-align: top; }
    .meta { color: #555; }
  </style></head><body>
  <h1>${escapeHtml(draft.title)}</h1>
  <p class="meta">${escapeHtml(draft.ageGroup)} · ${draft.duration} минут · ${escapeHtml(draft.learningArea)}</p>
  <h2>Зорилго</h2><p>${escapeHtml(draft.goals)}</p>
  <h2>Сурах зорилт</h2><ul>${draft.learningObjectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h2>Материал</h2><p>${escapeHtml(draft.materials)}</p>
  <h2>Үйл ажиллагааны үе</h2>
  <table><tr><th>Үе</th><th>Хугацаа</th><th>Багшийн үйлдэл</th><th>Хүүхдийн оролцоо</th></tr>${stages}</table>
  <h2>Хүүхдийн оролцоо</h2><p>${escapeHtml(draft.childrenParticipation)}</p>
  <h2>Ялгаатай хандах</h2><p>${escapeHtml(draft.differentiation)}</p>
  <h2>Үнэлгээ</h2><p>${escapeHtml(draft.assessment)}</p>
  </body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${draft.title || "hicheelin-tolovlogoo"}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const Label = ({
  text,
  children,
  hint,
}: {
  text: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <label className="eduflow:grid eduflow:gap-1.5">
    <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
      {text}
    </span>
    {children}
    {hint && (
      <span className="eduflow:text-[10px] eduflow:text-edu-text/70">{hint}</span>
    )}
  </label>
);

export const TeacherPlansPage = () => {
  const { demo, loading, error, refetch } = useEduflowDemo("teacher");
  const [form, setForm] = useState({
    group: "5–6 нас",
    learningArea: "Хэл яриа",
    topic: "",
    duration: 30,
    instructions: "",
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string>();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generate, { loading: generating }] = useMutation(
    GENERATE_LESSON_PLAN,
  );
  const [createPlan, { loading: saving }] = useMutation(CREATE_LESSON_PLAN);
  const [assessPlan, { loading: assessing }] = useMutation(
    ASSESS_LESSON_PLAN,
  );
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

  const runGenerate = async (improve: boolean) => {
    setMessage(null);
    setSuccess(null);

    if (!form.topic.trim()) {
      setMessage("Сэдвийг оруулна уу.");
      return;
    }

    try {
      const response = await generate({
        variables: {
          request: {
            group: form.group,
            learningArea: form.learningArea,
            topic: form.topic,
            duration: form.duration,
            instructions: form.instructions || null,
            currentPlan: improve && draft ? JSON.stringify(draft) : null,
          },
        },
      });
      const plan = response.data?.eduflowGenerateLessonPlan;
      if (!plan) {
        setMessage("AI төлөвлөгөө үүсгэж чадсангүй.");
        return;
      }
      setDraft(plan as Draft);
      setSavedPlanId(undefined);
      setSuccess(
        improve
          ? "Төлөвлөгөө сайжруулагдлаа. Одоо хадгалах эсвэл дахин засаж болно."
          : "AI төлөвлөгөө бэлэн боллоо. Хэсэг бүрийг засаж болно.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "AI төлөвлөгөө үүсгэж чадсангүй.",
      );
    }
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft) return;
    setMessage(null);
    setSuccess(null);

    try {
      const response = await createPlan({
        variables: {
          title: draft.title || form.topic,
          subject: draft.learningArea,
          objectives: draft.goals,
          goals: draft.goals,
          learningObjectives: draft.learningObjectives.filter(Boolean),
          content: null,
          materials: draft.materials,
          activities: draft.activities,
          childrenParticipation: draft.childrenParticipation,
          differentiation: draft.differentiation,
          assessment: draft.assessment,
          ageGroup: draft.ageGroup,
          duration: draft.duration,
          learningArea: draft.learningArea,
          qualityScore: draft.qualityScore,
          qualityIssues: draft.qualityIssues,
          source: "ai",
          attachments,
        },
      });
      const id = response.data?.eduflowCreateLessonPlan._id;
      if (id) setSavedPlanId(id);
      setSuccess("Төлөвлөгөө хадгалагдлаа.");
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Төлөвлөгөө хадгалж чадсангүй.",
      );
    }
  };

  const assess = async () => {
    if (!savedPlanId) {
      setMessage("Эхлээд төлөвлөгөөгөө хадгална уу.");
      return;
    }
    setMessage(null);
    setSuccess(null);
    try {
      const response = await assessPlan({ variables: { planId: savedPlanId } });
      const plan = response.data?.eduflowAssessPlan;
      if (plan) {
        setDraft((current) =>
          current
            ? {
                ...current,
                qualityScore: plan.qualityScore ?? 0,
                qualityIssues: plan.qualityIssues,
              }
            : current,
        );
      }
      setSuccess("AI чанарын шалгалт дууслаа.");
      await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Чанарын шалгалт хийж чадсангүй.",
      );
    }
  };

  const handleAttachment = async (file: File | undefined) => {
    if (!file) return;
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
        { name: file.name, mimeType: file.type, size: file.size, data },
      ]);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Файлыг уншиж чадсангүй.",
      );
    }
  };

  const updateStage = (index: number, patch: Partial<Stage>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            activities: current.activities.map((stage, stageIndex) =>
              stageIndex === index ? { ...stage, ...patch } : stage,
            ),
          }
        : current,
    );
  };

  const filteredPlans = demo.lessonPlans.filter((plan) => {
    const haystack =
      `${plan.title} ${plan.subject} ${plan.learningArea ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Edu-flow AI"
        title="Хичээлийн төлөвлөгөө бүтээгч"
        description="Бүлэг, сурах хүрээ, сэдвээ өгөөд бүтэцтэй төлөвлөгөө үүсгэнэ. Хэсэг бүрийг засаж, сайжруулж, Word-оор татаж болно."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(emptyDraft());
              setSavedPlanId(undefined);
              setSuccess(null);
              setMessage(null);
            }}
          >
            <IconPlus className="eduflow:size-4" />
            Шинэ төлөвлөгөө
          </Button>
        }
      />

      {message && <ErrorBanner message={message} />}
      {success && (
        <p className="eduflow:rounded-xl eduflow:border eduflow:border-edu-cyan/30 eduflow:bg-edu-cyan/5 eduflow:px-4 eduflow:py-2.5 eduflow:text-[11px] eduflow:text-edu-cyan">
          {success}
        </p>
      )}

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-[360px_1fr]">
        <div className="eduflow:grid eduflow:content-start eduflow:gap-4 eduflow:xl:sticky eduflow:xl:top-4">
          <SectionCard
            title="Шинэ төлөвлөгөө"
            description="AI-д өгөх мэдээлэл."
          >
            <form onSubmit={(event) => void save(event)} className="eduflow:grid eduflow:gap-3">
              <Label text="Бүлэг / нас">
                <Input
                  value={form.group}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, group: event.target.value }))
                  }
                />
              </Label>
              <Label text="Сурах хүрээ">
                <Input
                  value={form.learningArea}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, learningArea: event.target.value }))
                  }
                />
              </Label>
              <Label text="Сэдэв">
                <Input
                  required
                  value={form.topic}
                  placeholder="Жишээ: Хавар ирлээ"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, topic: event.target.value }))
                  }
                />
              </Label>
              <Label text="Үргэлжлэх хугацаа (мин)">
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={form.duration}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      duration: Number(event.target.value) || 30,
                    }))
                  }
                />
              </Label>
              <Label
                text="Нэмэлт заавар"
                hint="Жишээ: хөдөлгөөн нэм, 4 настай хүүхдэд тохируул, тоглоомжуул."
              >
                <Textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                />
              </Label>

              <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2">
                <Button type="button" disabled={generating} onClick={() => void runGenerate(false)}>
                  <IconWand className="eduflow:size-4" />
                  {generating ? "AI бодож байна…" : "AI-аар үүсгэх"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={generating || !draft}
                  onClick={() => void runGenerate(true)}
                >
                  <IconSparkles className="eduflow:size-4" />
                  Сайжруулах
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Хавсралт" description="PDF, DOC, DOCX · 3MB хүртэл">
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
            <div className="eduflow:mt-2 eduflow:grid eduflow:gap-1.5">
              {attachments.map((attachment) => (
                <div
                  key={`${attachment.name}-${attachment.size}`}
                  className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:rounded-lg eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2 eduflow:px-2 eduflow:py-1.5 eduflow:text-[10px] eduflow:text-edu-text"
                >
                  <span className="eduflow:flex eduflow:items-center eduflow:gap-1.5">
                    <IconFileText className="eduflow:size-3.5 eduflow:text-edu-lav" />
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`${attachment.name} хасах`}
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item !== attachment),
                      )
                    }
                  >
                    <IconX className="eduflow:size-3" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="eduflow:grid eduflow:content-start eduflow:gap-4">
          {!draft ? (
            <SectionCard>
              <EmptyState
                title="Төлөвлөгөө хараахан алга"
                description="Зүүн талын маягтыг бөглөж, AI-аар үүсгэнэ үү."
              />
            </SectionCard>
          ) : (
            <SectionCard
              title={draft.title || form.topic || "Шинэ төлөвлөгөө"}
              description={`${draft.ageGroup} · ${draft.duration} мин · ${draft.learningArea}`}
              action={
                <span className="eduflow:rounded-full eduflow:bg-edu-purple/15 eduflow:px-2.5 eduflow:py-0.5 eduflow:text-[10px] eduflow:text-edu-lav">
                  AI чанар {draft.qualityScore}%
                </span>
              }
            >
              <div className="eduflow:grid eduflow:gap-4">
                <div className="eduflow:grid eduflow:gap-3 eduflow:md:grid-cols-3">
                  <Label text="Гарчиг">
                    <Input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, title: event.target.value } : current,
                        )
                      }
                    />
                  </Label>
                  <Label text="Бүлэг / нас">
                    <Input
                      value={draft.ageGroup}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, ageGroup: event.target.value } : current,
                        )
                      }
                    />
                  </Label>
                  <Label text="Хугацаа (мин)">
                    <Input
                      type="number"
                      value={draft.duration}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, duration: Number(event.target.value) || 30 }
                            : current,
                        )
                      }
                    />
                  </Label>
                </div>

                <Label text="Зорилго">
                  <Textarea
                    rows={2}
                    value={draft.goals}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, goals: event.target.value } : current,
                      )
                    }
                  />
                </Label>

                <div className="eduflow:grid eduflow:gap-2">
                  <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
                    <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
                      Сурах зорилт
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                learningObjectives: [...current.learningObjectives, ""],
                              }
                            : current,
                        )
                      }
                    >
                      <IconPlus className="eduflow:size-3.5" />
                      Нэмэх
                    </Button>
                  </div>
                  {draft.learningObjectives.map((objective, index) => (
                    <div key={index} className="eduflow:flex eduflow:gap-2">
                      <Input
                        value={objective}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  learningObjectives: current.learningObjectives.map(
                                    (item, itemIndex) =>
                                      itemIndex === index ? event.target.value : item,
                                  ),
                                }
                              : current,
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Зорилт хасах"
                        onClick={() =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  learningObjectives:
                                    current.learningObjectives.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                }
                              : current,
                          )
                        }
                      >
                        <IconTrash className="eduflow:size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Label text="Материал">
                  <Textarea
                    rows={2}
                    value={draft.materials}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, materials: event.target.value } : current,
                      )
                    }
                  />
                </Label>

                <div className="eduflow:grid eduflow:gap-2">
                  <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
                    <span className="eduflow:text-[11px] eduflow:font-medium eduflow:text-edu-text">
                      Үйл ажиллагааны үе
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                activities: [
                                  ...current.activities,
                                  {
                                    name: "",
                                    minutes: 5,
                                    description: "",
                                    childrenRole: "",
                                  },
                                ],
                              }
                            : current,
                        )
                      }
                    >
                      <IconPlus className="eduflow:size-3.5" />
                      Үе нэмэх
                    </Button>
                  </div>
                  {draft.activities.map((stage, index) => (
                    <div
                      key={index}
                      className="eduflow:grid eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:p-3"
                    >
                      <div className="eduflow:grid eduflow:gap-2 eduflow:sm:grid-cols-[1fr_90px_36px]">
                        <Input
                          value={stage.name}
                          placeholder="Үеийн нэр"
                          onChange={(event) =>
                            updateStage(index, { name: event.target.value })
                          }
                        />
                        <Input
                          type="number"
                          min={1}
                          value={stage.minutes}
                          aria-label="Минут"
                          onChange={(event) =>
                            updateStage(index, {
                              minutes: Number(event.target.value) || 1,
                            })
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label="Үе хасах"
                          onClick={() =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    activities: current.activities.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  }
                                : current,
                            )
                          }
                        >
                          <IconTrash className="eduflow:size-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        rows={2}
                        value={stage.description}
                        placeholder="Багшийн үйлдэл"
                        onChange={(event) =>
                          updateStage(index, { description: event.target.value })
                        }
                      />
                      <Input
                        value={stage.childrenRole}
                        placeholder="Хүүхдийн оролцоо"
                        onChange={(event) =>
                          updateStage(index, { childrenRole: event.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="eduflow:grid eduflow:gap-3 eduflow:md:grid-cols-3">
                  <Label text="Хүүхдийн оролцоо">
                    <Textarea
                      rows={3}
                      value={draft.childrenParticipation}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, childrenParticipation: event.target.value }
                            : current,
                        )
                      }
                    />
                  </Label>
                  <Label text="Ялгаатай хандах">
                    <Textarea
                      rows={3}
                      value={draft.differentiation}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, differentiation: event.target.value }
                            : current,
                        )
                      }
                    />
                  </Label>
                  <Label text="Үнэлгээ">
                    <Textarea
                      rows={3}
                      value={draft.assessment}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, assessment: event.target.value } : current,
                        )
                      }
                    />
                  </Label>
                </div>

                {draft.qualityIssues.length > 0 && (
                  <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:p-3">
                    <p className="eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[11px] eduflow:font-semibold eduflow:text-edu-lav">
                      <IconAlertTriangle className="eduflow:size-4" />
                      AI-ийн сайжруулах зөвлөмж
                    </p>
                    <ul className="eduflow:mt-1.5 eduflow:grid eduflow:gap-1 eduflow:text-[10px] eduflow:text-edu-text">
                      {draft.qualityIssues.map((issue) => (
                        <li key={issue}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2 eduflow:border-t eduflow:border-edu-border eduflow:pt-3">
                  <Button type="button" disabled={saving} onClick={() => void save()}>
                    <IconCheck className="eduflow:size-4" />
                    {saving ? "Хадгалж байна…" : "Хадгалах"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={assessing}
                    onClick={() => void assess()}
                  >
                    <IconSparkles className="eduflow:size-4" />
                    {assessing ? "Шалгаж байна…" : "AI чанар шалгах"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadWord(draft)}
                  >
                    <IconDownload className="eduflow:size-4" />
                    Word татах
                  </Button>
                  {savedPlanId && (
                    <span className="eduflow:ml-auto eduflow:text-[10px] eduflow:text-edu-cyan">
                      Хадгалагдсан
                    </span>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Хадгалсан төлөвлөгөө"
            description="Хайж, дахин нээж, засаж болно."
            action={
              <div className="eduflow:relative">
                <IconSearch className="eduflow:pointer-events-none eduflow:absolute eduflow:left-2.5 eduflow:top-1/2 eduflow:size-3.5 eduflow:-translate-y-1/2 eduflow:text-edu-text" />
                <Input
                  value={search}
                  placeholder="Хайх…"
                  onChange={(event) => setSearch(event.target.value)}
                  className="eduflow:pl-8"
                />
              </div>
            }
          >
            {filteredPlans.length === 0 ? (
              <EmptyState title="Төлөвлөгөө олдсонгүй" />
            ) : (
              <div className="eduflow:grid eduflow:gap-2">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(plan));
                      setSavedPlanId(plan._id);
                      setAttachments(plan.attachments);
                      setMessage(null);
                      setSuccess("Хадгалсан төлөвлөгөө нээгдлээ.");
                    }}
                    className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-3 eduflow:py-2.5 eduflow:text-left eduflow:transition hover:eduflow:border-edu-lav/40 hover:eduflow:bg-edu-card2"
                  >
                    <div className="eduflow:min-w-0">
                      <p className="eduflow:truncate eduflow:text-xs eduflow:font-medium eduflow:text-edu-ink">
                        {plan.title}
                      </p>
                      <p className="eduflow:text-[10px] eduflow:text-edu-text">
                        {plan.subject} · {formatDate(plan.createdAt)} ·{" "}
                        {plan.qualityScore ?? 0}% чанар
                      </p>
                    </div>
                    <StatusPill
                      status={plan.status}
                      label={
                        plan.status === "draft"
                          ? "Ноорог"
                          : plan.status === "review"
                            ? "Хяналтад"
                            : "Батлагдсан"
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          {savedPlanId && (
            <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2">
              {(["review", "approved", "draft"] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await updateStatus({ variables: { planId: savedPlanId, status } });
                    await refetch();
                  }}
                >
                  <IconClock className="eduflow:size-3.5" />
                  {status === "review"
                    ? "Хяналтад илгээх"
                    : status === "approved"
                      ? "Батлах"
                      : "Ноорог"}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
