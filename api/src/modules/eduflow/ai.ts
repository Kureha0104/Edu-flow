export type AiCheckResult = {
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
  provider: string;
  model: string;
};

type HomeworkContext = {
  title: string;
  subject: string;
  description?: string | null;
  imageData: string;
};


const MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";

const clampScore = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const mockCheck = (imageData: string, context: HomeworkContext): AiCheckResult => {
  const score = 74 + (imageData.length % 22);
  const approved = score >= 80;

  return {
    score,
    provider: "mock",
    model: "demo",
    strengths: approved
      ? "Бодолт бүрэн, алхмууд тодорхой харагдаж байна."
      : "Ажил эхэлсэн нь харагдаж байна.",
    improvements: approved
      ? "Үргэлжлүүлээрэй."
      : "Дуусаагүй асуултаа гүйцээж, дахин зураг илгээгээрэй.",
    feedback: approved
      ? `"${context.title}" даалгаврын бодолт бүрэн харагдаж байна. Бүх асуултад хариулсан, алхмууд нь тодорхой уншигдаж байна. Сайн байна — цувралаа үргэлжлүүлээрэй!`
      : `"${context.title}" даалгаврын ихэнх ажил харагдаж байна, гэхдээ нэг асуулт дуусаагүй байна. Сүүлийн алхмаа шалгаж, засаад шинэ зураг илгээгээрэй.`,
  };
};

const parseJson = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const uploadGemmaImage = async (apiKey: string, imageData: string) => {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(imageData);
  if (!match) {
    throw new Error("Unsupported image data URL");
  }

  const mimeType = match[1] ?? "image/jpeg";
  const bytes = Buffer.from(match[2] ?? "", "base64");
  const base = "https://generativelanguage.googleapis.com";

  const start = await fetch(`${base}/upload/v1beta/files?key=${apiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "homework-photo" } }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!start.ok) {
    throw new Error(`Upload start failed: ${start.status}`);
  }

  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Upload URL missing");
  }

  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(60_000),
  });

  if (!upload.ok) {
    throw new Error(`Upload failed: ${upload.status}`);
  }

  const data = (await upload.json()) as {
    file?: { uri?: string; name?: string; mimeType?: string };
  };
  const uri = data.file?.uri;
  const name = data.file?.name;

  if (!uri || !name) {
    throw new Error("Uploaded file metadata missing");
  }

  return { uri, name, mimeType: data.file?.mimeType ?? mimeType };
};

const deleteGemmaFile = async (apiKey: string, name: string) => {
  try {
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`,
      { method: "DELETE", signal: AbortSignal.timeout(20_000) },
    );
  } catch {
    // Best-effort cleanup only.
  }
};

const parseAiJson = (text: string) => {
  const tagged = /<json>([\s\S]*?)<\/json>/i.exec(text);
  const candidates = tagged
    ? [tagged[1]]
    : [text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1)];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate.trim()) as Record<string, unknown>;
      if (typeof parsed.score === "number") {
        return parsed;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
};

export const checkHomeworkImage = async (
  context: HomeworkContext,
): Promise<AiCheckResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return mockCheck(context.imageData, context);
  }

  let uploaded: { uri: string; name: string; mimeType: string } | undefined;

  try {
    const file = await uploadGemmaImage(apiKey, context.imageData);
    uploaded = file;
    const imageFile = file;
    const prompt = `You are a careful primary-school homework checker. Review the photographed notebook page.

Homework: ${context.title}
Subject: ${context.subject}
Instructions: ${context.description ?? "No extra instructions"}

Return the result inside <json> tags, exactly:
<json>{"score": 0-100, "feedback": "2-3 sentences for the student", "strengths": "one sentence", "improvements": "one sentence"}</json>

Rules:
- Score how completely and correctly the visible work answers the assignment.
- Be encouraging and specific. Write ALL feedback, strengths and improvements in Mongolian Cyrillic.
- If the image is unreadable or incomplete, score below 60 and say what to re-photograph.
- Do not invent work that is not visible.
- Do not put any JSON example in your reasoning. The only JSON must be the final tagged result.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  file_data: {
                    mime_type: imageFile.mimeType,
                    file_uri: imageFile.uri,
                  },
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: "You are a strict homework grader. Output only the final <json> result. Write feedback in Mongolian Cyrillic.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 3000,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );

    if (!response.ok) {
      console.error(
        `[eduflow-ai] Gemma request failed: ${response.status} ${(await response.text()).slice(0, 300)}`,
      );
      return { ...mockCheck(context.imageData, context), provider: "mock-fallback" };
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join("") ?? "";
    const parsed = parseAiJson(text);

    if (!parsed) {
      console.error(
        "[eduflow-ai] Gemma returned no parseable JSON:",
        text.slice(0, 500),
      );
      return { ...mockCheck(context.imageData, context), provider: "mock-fallback" };
    }

    return {
      score: clampScore(parsed.score as number),
      feedback:
        typeof parsed.feedback === "string"
          ? parsed.feedback
          : "AI дүгнэлт бэлэн боллоо.",
      strengths:
        typeof parsed.strengths === "string" ? parsed.strengths : "",
      improvements:
        typeof parsed.improvements === "string" ? parsed.improvements : "",
      provider: "gemma",
      model: MODEL,
    };
  } catch (cause) {
    console.error("[eduflow-ai] Gemma request error:", cause);
    return { ...mockCheck(context.imageData, context), provider: "mock-fallback" };
  } finally {
    if (uploaded) {
      await deleteGemmaFile(apiKey, uploaded.name);
    }
  }
};

export const aiInfo = () => ({
  configured: Boolean(process.env.GEMINI_API_KEY),
  provider: process.env.GEMINI_API_KEY ? "gemma" : "mock",
  model: process.env.GEMINI_API_KEY ? MODEL : "demo",
});

export type LessonPlanDraft = {
  title: string;
  ageGroup: string;
  duration: number;
  learningArea: string;
  goals: string;
  learningObjectives: string[];
  materials: string;
  activities: {
    name: string;
    minutes: number;
    description: string;
    childrenRole: string;
  }[];
  childrenParticipation: string;
  differentiation: string;
  assessment: string;
  qualityScore: number;
  qualityIssues: string[];
};

export type PlanRequest = {
  group: string;
  learningArea: string;
  topic: string;
  duration: number;
  instructions?: string;
  currentPlan?: string;
};

const fallbackPlan = (request: PlanRequest): LessonPlanDraft => ({
  title: request.topic,
  ageGroup: request.group,
  duration: request.duration,
  learningArea: request.learningArea,
  goals: `${request.group}-ийн хүүхдүүд "${request.topic}" сэдвийн гол ойлголтыг тоглоом, хөдөлгөөн, харилцан яриагаар эзэмшинэ.`,
  learningObjectives: [
    `"${request.topic}" тухай 2–3 шинэ ойлголтыг нэрлэж чадна.`,
    "Багаар ажиллаж, бусдын санааг сонсож харилцана.",
    "Үйл ажиллагааны үр дүнгээ зураг, хөдөлгөөн эсвэл өгүүлбэрээр илэрхийлнэ.",
  ],
  materials: "Сэдвийн зурагт карт, өнгөт цаас, харандаа, хайч, цавуу, хөгжмийн дагалдан",
  activities: [
    {
      name: "Халуун эхлэл",
      minutes: 5,
      description: "Сэдвийн зураг үзүүлж, хүүхдүүдийн туршлагаас асуулт асууна.",
      childrenRole: "Асуултад хариулж, өөрийн туршлагаас хуваалцана.",
    },
    {
      name: "Тоглоомт хайгуул",
      minutes: 10,
      description: "Жижиг бүлгээр материалтай танилцаж, сэдвийн гол ойлголтыг олно.",
      childrenRole: "Багаар материал судалж, санаагаа наана.",
    },
    {
      name: "Бүтээлч дасгал",
      minutes: 10,
      description: "Сэдвийг илэрхийлсэн зураг эсвэл хөдөлгөөнт тоглоом бүтээнэ.",
      childrenRole: "Зураг зурж, хөдөлгөөнөөр илэрхийлнэ.",
    },
    {
      name: "Хуваалцах ба дүгнэлт",
      minutes: 5,
      description: "Бүлгүүд бүтээлээ танилцуулж, багш гол ойлголтыг нэгтгэнэ.",
      childrenRole: "Бүтээлээ танилцуулж, нэг зүйл сурснаа хэлнэ.",
    },
  ],
  childrenParticipation: "Хүүхэд бүр дор хаяж нэг удаа хариулж, нэг бүтээлч үйлдэлд оролцоно.",
  differentiation: "Хурдан хүүхдэд нэмэлт асуулт, дэмжлэг хэрэгтэй хүүхдэд зурагт карт, жишээ өгнө.",
  assessment: "Ажиглалт, бүлгийн танилцуулга, хүүхдийн зурсан бүтээлээр сурсан эсэхийг дүгнэнэ.",
  qualityScore: 82,
  qualityIssues: [
    "Үнэлгээг хүүхэд бүрийн хувьд тусгайлан бичих боломжтой.",
    "Хөдөлгөөнт завсарлага нэмэх нь 30 минутын хуваарьт тохирно.",
  ],
});

const normalizePlan = (
  value: Record<string, unknown>,
  request: PlanRequest,
): LessonPlanDraft => {
  const fallback = fallbackPlan(request);
  const activities = Array.isArray(value.activities)
    ? value.activities
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const activity = item as Record<string, unknown>;
          return {
            name: typeof activity.name === "string" ? activity.name : "Үйл ажиллагаа",
            minutes: typeof activity.minutes === "number" ? activity.minutes : 5,
            description:
              typeof activity.description === "string"
                ? activity.description
                : "",
            childrenRole:
              typeof activity.childrenRole === "string"
                ? activity.childrenRole
                : "",
          };
        })
        .filter((item): item is LessonPlanDraft["activities"][number] => Boolean(item))
    : fallback.activities;

  const objectives = Array.isArray(value.learningObjectives)
    ? value.learningObjectives.filter(
        (item): item is string => typeof item === "string",
      )
    : fallback.learningObjectives;

  return {
    title: typeof value.title === "string" ? value.title : request.topic,
    ageGroup:
      typeof value.ageGroup === "string" ? value.ageGroup : request.group,
    duration:
      typeof value.duration === "number" ? value.duration : request.duration,
    learningArea:
      typeof value.learningArea === "string"
        ? value.learningArea
        : request.learningArea,
    goals: typeof value.goals === "string" ? value.goals : fallback.goals,
    learningObjectives: objectives.length > 0 ? objectives : fallback.learningObjectives,
    materials:
      typeof value.materials === "string"
        ? value.materials
        : Array.isArray(value.materials)
          ? value.materials.filter((item): item is string => typeof item === "string").join(", ")
          : fallback.materials,
    activities: activities.length > 0 ? activities : fallback.activities,
    childrenParticipation:
      typeof value.childrenParticipation === "string"
        ? value.childrenParticipation
        : fallback.childrenParticipation,
    differentiation:
      typeof value.differentiation === "string"
        ? value.differentiation
        : fallback.differentiation,
    assessment:
      typeof value.assessment === "string"
        ? value.assessment
        : fallback.assessment,
    qualityScore:
      typeof value.qualityScore === "number"
        ? Math.max(0, Math.min(100, Math.round(value.qualityScore)))
        : fallback.qualityScore,
    qualityIssues: Array.isArray(value.qualityIssues)
      ? value.qualityIssues.filter(
          (item): item is string => typeof item === "string",
        )
      : fallback.qualityIssues,
  };
};

export const generateLessonPlan = async (
  request: PlanRequest,
): Promise<LessonPlanDraft> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackPlan(request);
  }

  const prompt = `You are an experienced Mongolian preschool methodologist. Create a practical, play-based lesson plan.

Group/age: ${request.group}
Learning area: ${request.learningArea}
Topic: ${request.topic}
Duration: ${request.duration} minutes
Teacher instructions: ${request.instructions || "none"}
${request.currentPlan ? `Current plan to improve:\n${request.currentPlan}\nApply the teacher's instructions while keeping what works.` : ""}

Return ONLY valid JSON in this exact shape:
{
  "title": "short Mongolian title",
  "ageGroup": "${request.group}",
  "duration": ${request.duration},
  "learningArea": "${request.learningArea}",
  "goals": "1-2 sentences",
  "learningObjectives": ["3 measurable objectives"],
  "materials": "comma-separated materials",
  "activities": [
    {"name": "stage name", "minutes": 5, "description": "what the teacher does", "childrenRole": "what children do"}
  ],
  "childrenParticipation": "how every child participates",
  "differentiation": "support and extension",
  "assessment": "how learning is assessed",
  "qualityScore": 0-100,
  "qualityIssues": ["specific improvement suggestions"]
}

Rules:
- Activities must add up to about ${request.duration} minutes and include a movement break.
- Every section must be specific to the topic, not generic filler.
- Write all text in Mongolian Cyrillic.
- No markdown, no code fences, JSON only.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1800,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!response.ok) {
      console.error(
        `[eduflow-ai] Lesson plan request failed: ${response.status} ${(await response.text()).slice(0, 300)}`,
      );
      return fallbackPlan(request);
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";
    const parsed = parseJson(text);

    return parsed ? normalizePlan(parsed, request) : fallbackPlan(request);
  } catch (cause) {
    console.error("[eduflow-ai] Lesson plan error:", cause);
    return fallbackPlan(request);
  }
};

export const assessLessonPlan = async (
  plan: LessonPlanDraft,
): Promise<{ score: number; issues: string[] }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      score: plan.qualityScore,
      issues: plan.qualityIssues,
    };
  }

  const prompt = `You are a Mongolian preschool methodologist reviewing a lesson plan. Check goal-objective alignment, age suitability, timing, participation, and assessment. Return ONLY JSON: {"score":0-100,"issues":["specific issue in Mongolian"]}. Plan:\n${JSON.stringify(plan)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
    if (!response.ok) {
      return { score: plan.qualityScore, issues: plan.qualityIssues };
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";
    const parsed = parseJson(text);
    const score =
      parsed && typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : plan.qualityScore;
    const issues =
      parsed && Array.isArray(parsed.issues)
        ? parsed.issues.filter((item): item is string => typeof item === "string")
        : plan.qualityIssues;
    return { score, issues };
  } catch {
    return { score: plan.qualityScore, issues: plan.qualityIssues };
  }
};
