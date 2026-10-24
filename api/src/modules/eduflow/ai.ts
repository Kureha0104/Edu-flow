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

export const checkHomeworkImage = async (
  context: HomeworkContext,
): Promise<AiCheckResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const image = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(
    context.imageData,
  );

  if (!apiKey || !image) {
    return mockCheck(context.imageData, context);
  }

  const prompt = `You are a careful primary-school homework checker. Review the photographed notebook page.

Homework: ${context.title}
Subject: ${context.subject}
Instructions: ${context.description ?? "No extra instructions"}

Return ONLY valid JSON with this shape:
{"score": 0-100, "feedback": "2-3 sentences for the student", "strengths": "one sentence", "improvements": "one sentence"}

Rules:
- Score how completely and correctly the visible work answers the assignment.
- Be encouraging and specific. Write all text in Mongolian Cyrillic.
- If the image is unreadable or incomplete, score below 60 and say what to re-photograph.
- Do not invent work that is not visible.`;

  try {
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
                  inline_data: {
                    mime_type: image[1],
                    data: image[2],
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `[eduflow-ai] Gemma request failed: ${response.status} ${detail.slice(0, 300)}`,
      );
      return { ...mockCheck(context.imageData, context), provider: "mock-fallback" };
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
      }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";
    const parsed = parseJson(text);

    if (!parsed || typeof parsed.score !== "number") {
      console.error("[eduflow-ai] Gemma returned no parseable JSON:", text.slice(0, 300));
      return { ...mockCheck(context.imageData, context), provider: "mock-fallback" };
    }

    return {
      score: clampScore(parsed.score),
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
  }
};

export const aiInfo = () => ({
  configured: Boolean(process.env.GEMINI_API_KEY),
  provider: process.env.GEMINI_API_KEY ? "gemma" : "mock",
  model: process.env.GEMINI_API_KEY ? MODEL : "demo",
});
