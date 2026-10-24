import { useMutation, useQuery } from "@apollo/client";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFlame,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button, cn } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };
import { ANSWER_QUIZ, PRACTICE_QUERY, START_QUIZ } from "~/graphql";
import type { EduflowPracticeQuery } from "~/gql/graphql";
import { useAuth } from "../auth/AuthContext";
import {
  EmptyState,
  ErrorBanner,
  PageHeading,
  ProgressBar,
  SectionCard,
  formatDate,
} from "../modules/eduflow/ui";

const base = `/${manifest.ui.path}`;

type Practice = EduflowPracticeQuery["eduflowPractice"];
type Quiz = NonNullable<Practice["activeQuiz"]>;
type AnswerResult = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  questionIndex: number;
  question: Quiz["questions"][number];
};

const ANSWER_STYLES = [
  { className: "eduflow:bg-[#e21b3c]", shape: "▲" },
  { className: "eduflow:bg-[#1368ce]", shape: "◆" },
  { className: "eduflow:bg-[#d89e00]", shape: "●" },
  { className: "eduflow:bg-[#26890c]", shape: "■" },
];

export const StudentPracticePage = () => {
  const { session } = useAuth();
  const studentId = session?.member._id ?? "";
  const { data, loading, error, refetch } = useQuery(PRACTICE_QUERY, {
    variables: { studentId },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startQuiz, { loading: starting }] = useMutation(START_QUIZ);
  const [answerQuiz, { loading: answering }] = useMutation(ANSWER_QUIZ);

  const activeQuiz = quiz ?? data?.eduflowPractice.activeQuiz ?? null;

  useEffect(() => {
    if (!activeQuiz || activeQuiz.status !== "active" || result) return;
    setTimeLeft(30);
    const timer = window.setInterval(
      () => setTimeLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [activeQuiz, activeQuiz?.currentQuestionIndex, result]);

  if (!session) return null;

  if (loading && !data) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-3xl eduflow:bg-edu-card" />;
  }

  if (error || !data?.eduflowPractice) {
    return (
      <ErrorBanner
        message={error?.message ?? "Дасгал ачаалж чадсангүй."}
        onRetry={() => void refetch()}
      />
    );
  }

  const practice = data.eduflowPractice;
  const concepts = practice.concepts;

  const start = async () => {
    setMessage(null);
    setResult(null);
    setSelected(null);
    try {
      const response = await startQuiz({ variables: { studentId } });
      const nextQuiz = response.data?.eduflowStartQuiz;
      if (!nextQuiz) {
        setMessage("Дасгал эхлүүлж чадсангүй.");
        return;
      }
      setQuiz(nextQuiz);
      setTimeLeft(30);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Дасгал эхлүүлж чадсангүй.",
      );
    }
  };

  const answer = async (index: number) => {
    if (!activeQuiz || result) return;
    const questionIndex = activeQuiz.currentQuestionIndex;
    const currentQuestion = activeQuiz.questions[questionIndex];
    if (!currentQuestion) return;

    setSelected(index);
    setMessage(null);
    try {
      const response = await answerQuiz({
        variables: {
          quizId: activeQuiz._id,
          questionIndex,
          selectedIndex: index,
        },
      });
      const value = response.data?.eduflowAnswerQuiz;
      if (!value) {
        setMessage("Хариултыг шалгаж чадсангүй.");
        return;
      }
      setQuiz(value.quiz);
      setResult({
        correct: value.correct,
        correctIndex: value.correctIndex,
        explanation: value.explanation,
        questionIndex,
        question: currentQuestion,
      });
      if (value.quiz.status === "completed") await refetch();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Хариултыг шалгаж чадсангүй.",
      );
    }
  };

  const next = () => {
    setResult(null);
    setSelected(null);
    setTimeLeft(30);
  };

  const displayIndex = result
    ? result.questionIndex
    : activeQuiz?.currentQuestionIndex ?? 0;
  const question = result ? result.question : activeQuiz?.questions[displayIndex];

  return (
    <div className="eduflow:grid eduflow:gap-4">
      <PageHeading
        eyebrow="Өдөр тутмын дасгал"
        title="Хурдан. Хөгжилтэй. Чамд тохирсон."
        description="AI чинь хамгийн сул ойлголтыг олж, 5 богино асуултаар бэхжүүлнэ. Зөв хариулах тусам хүндрэл нэмэгдэнэ."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/student`}>Нүүр</Link>
          </Button>
        }
      />

      {message && <ErrorBanner message={message} />}

      <div className="eduflow:grid eduflow:gap-4 eduflow:xl:grid-cols-[1fr_320px]">
        <div className="eduflow:grid eduflow:gap-4">
          {activeQuiz && question && (activeQuiz.status === "active" || result) ? (
            <>
              <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-3xl eduflow:bg-gradient-to-br eduflow:from-[#2f5bff] eduflow:via-[#4b5cff] eduflow:to-[#7c3aed] eduflow:p-5 eduflow:text-white eduflow:shadow-[0_24px_60px_-28px_#2f5bff]">
                <div
                  aria-hidden
                  className="eduflow:pointer-events-none eduflow:absolute eduflow:-right-10 eduflow:-top-16 eduflow:size-52 eduflow:rounded-full eduflow:bg-white/10 eduflow:blur-2xl"
                />
                <div className="eduflow:relative eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-3">
                  <div>
                    <span className="eduflow:rounded-full eduflow:bg-white/15 eduflow:px-2.5 eduflow:py-1 eduflow:text-[10px] eduflow:font-medium eduflow:text-white">
                      {activeQuiz.subject} · {activeQuiz.topic}
                    </span>
                    <p className="eduflow:mt-3 eduflow:text-[11px] eduflow:text-white/75">
                      Асуулт {displayIndex + 1} / {activeQuiz.totalQuestions}
                    </p>
                  </div>
                  <div className="eduflow:flex eduflow:items-center eduflow:gap-2">
                    <span className="eduflow:flex eduflow:items-center eduflow:gap-1 eduflow:rounded-full eduflow:bg-white/15 eduflow:px-2.5 eduflow:py-1 eduflow:text-[11px]">
                      <IconFlame className="eduflow:size-3.5" />
                      {activeQuiz.correctStreak}
                    </span>
                    <span
                      className={cn(
                        "eduflow:flex eduflow:size-12 eduflow:flex-col eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-white/15 eduflow:text-sm eduflow:font-semibold",
                        timeLeft <= 5 && "eduflow:bg-[#e21b3c] eduflow:text-white",
                      )}
                    >
                      {timeLeft}
                      <span className="eduflow:text-[8px] eduflow:font-normal eduflow:text-white/70">
                        сек
                      </span>
                    </span>
                  </div>
                </div>
                <div className="eduflow:relative eduflow:mt-4 eduflow:h-1.5 eduflow:overflow-hidden eduflow:rounded-full eduflow:bg-white/20">
                  <div
                    className="eduflow:h-full eduflow:rounded-full eduflow:bg-white"
                    style={{
                      width: `${((displayIndex + 1) / activeQuiz.totalQuestions) * 100}%`,
                    }}
                  />
                </div>
                <p className="eduflow:relative eduflow:mt-3 eduflow:text-[10px] eduflow:text-white/70">
                  Хүндрэл: {activeQuiz.currentDifficulty}/3 · Зөв хариулбал дараагийн
                  асуулт хүндэрнэ
                </p>
              </section>

              <section className="eduflow:rounded-3xl eduflow:border eduflow:border-edu-border eduflow:bg-white eduflow:p-5 eduflow:shadow-[0_16px_40px_-30px_#0b1220]">
                <h2 className="eduflow:text-lg eduflow:font-semibold eduflow:leading-snug eduflow:text-edu-ink eduflow:md:text-xl">
                  {question.prompt}
                </h2>
                <div className="eduflow:mt-5 eduflow:grid eduflow:gap-2.5 eduflow:sm:grid-cols-2">
                  {question.options.map((option, index) => {
                    const style = ANSWER_STYLES[index % ANSWER_STYLES.length] ?? {
                      className: "eduflow:bg-[#1368ce]",
                      shape: "◆",
                    };
                    const isCorrect = result?.correctIndex === index;
                    const isWrong = Boolean(result && selected === index && !result.correct);

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={Boolean(result) || answering}
                        onClick={() => void answer(index)}
                        className={cn(
                          "eduflow:flex eduflow:min-h-24 eduflow:items-center eduflow:gap-3 eduflow:rounded-2xl eduflow:px-4 eduflow:py-4 eduflow:text-left eduflow:text-sm eduflow:font-medium eduflow:text-white eduflow:shadow-[0_8px_20px_-12px_#0b1220] eduflow:transition",
                          style.className,
                          !result && "hover:eduflow:-translate-y-0.5 hover:eduflow:brightness-110",
                          isCorrect && "eduflow:ring-4 eduflow:ring-white eduflow:ring-offset-2",
                          isWrong && "eduflow:opacity-40",
                        )}
                      >
                        <span className="eduflow:flex eduflow:size-7 eduflow:shrink-0 eduflow:items-center eduflow:justify-center eduflow:rounded-md eduflow:bg-black/15 eduflow:text-xs">
                          {style.shape}
                        </span>
                        <span>{option}</span>
                        {isCorrect && <IconCheck className="eduflow:ml-auto eduflow:size-5" />}
                        {isWrong && <IconX className="eduflow:ml-auto eduflow:size-5" />}
                      </button>
                    );
                  })}
                </div>

                {result && (
                  <div
                    className={cn(
                      "eduflow:mt-4 eduflow:rounded-2xl eduflow:border eduflow:p-4 eduflow:text-[12px] eduflow:leading-relaxed",
                      result.correct
                        ? "eduflow:border-[#b8ebc8] eduflow:bg-[#effbf2] eduflow:text-[#1d6b39]"
                        : "eduflow:border-[#ffd2c7] eduflow:bg-[#fff4f0] eduflow:text-[#9e3a22]",
                    )}
                  >
                    <p className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:font-semibold">
                      {result.correct ? (
                        <IconCheck className="eduflow:size-4" />
                      ) : (
                        <IconX className="eduflow:size-4" />
                      )}
                      {result.correct ? "Зөв хариулт!" : "Дахин оролдоорой"}
                    </p>
                    <p className="eduflow:mt-1">{result.explanation}</p>
                    <Button type="button" size="sm" className="eduflow:mt-3" onClick={next}>
                      {displayIndex + 1 >= activeQuiz.totalQuestions
                        ? "Үр дүн харах"
                        : "Дараах асуулт"}
                      <IconArrowRight className="eduflow:size-4" />
                    </Button>
                  </div>
                )}

                {!result && (
                  <p className="eduflow:mt-4 eduflow:flex eduflow:items-center eduflow:gap-1.5 eduflow:text-[10px] eduflow:text-edu-text">
                    <IconClock className="eduflow:size-3.5" />
                    Хариултаа сонгоорой. Зөв хариулбал цуврал нэмэгдэнэ.
                  </p>
                )}
              </section>
            </>
          ) : activeQuiz && activeQuiz.status === "completed" && !result ? (
            <section className="eduflow:rounded-3xl eduflow:border eduflow:border-edu-border eduflow:bg-white eduflow:p-8 eduflow:text-center eduflow:shadow-[0_16px_40px_-30px_#0b1220]">
              <div className="eduflow:mx-auto eduflow:flex eduflow:size-16 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-[#e9f0ff] eduflow:text-edu-lav">
                <IconSparkles className="eduflow:size-8" />
              </div>
              <h2 className="eduflow:mt-4 eduflow:text-2xl eduflow:font-semibold eduflow:text-edu-ink">
                Дасгал дууслаа!
              </h2>
              <p className="eduflow:mt-1 eduflow:text-sm eduflow:text-edu-text">
                {activeQuiz.correctCount}/{activeQuiz.totalQuestions} зөв хариулт
              </p>
              <div className="eduflow:mt-5 eduflow:flex eduflow:justify-center eduflow:gap-2">
                <Button type="button" disabled={starting} onClick={() => void start()}>
                  {starting ? "Бэлтгэж байна…" : "Дахин дасгал"}
                </Button>
                <Button asChild variant="outline">
                  <Link to={`${base}/student`}>Нүүр</Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-3xl eduflow:border eduflow:border-[#dbe4ff] eduflow:bg-gradient-to-br eduflow:from-[#eef4ff] eduflow:to-white eduflow:p-6">
              <p className="eduflow:text-[10px] eduflow:font-semibold eduflow:uppercase eduflow:tracking-[0.2em] eduflow:text-edu-lav">
                AI-ийн сонгосон дасгал
              </p>
              <h2 className="eduflow:mt-2 eduflow:max-w-xl eduflow:text-2xl eduflow:font-semibold eduflow:tracking-tight eduflow:text-edu-ink">
                Сул ойлголтоо өнөөдөр л бэхжүүл
              </h2>
              <p className="eduflow:mt-2 eduflow:max-w-xl eduflow:text-sm eduflow:leading-relaxed eduflow:text-edu-text">
                Таны хамгийн бага mastery-тай ойлголтоос 5 асуулт бэлдэнэ. Зөв
                хариулах тусам хүндрэл өснө.
              </p>
              <Button
                type="button"
                disabled={starting}
                className="eduflow:mt-5 eduflow:rounded-xl eduflow:bg-edu-lav eduflow:text-white"
                onClick={() => void start()}
              >
                <IconSparkles className="eduflow:size-4" />
                {starting ? "Бэлтгэж байна…" : "Дасгал эхлүүлэх"}
              </Button>
            </section>
          )}
        </div>

        <div className="eduflow:grid eduflow:content-start eduflow:gap-4">
          <SectionCard title="Сул ойлголтууд" description="Бага mastery-тай ойлголтоос эхэлнэ.">
            {concepts.length === 0 ? (
              <EmptyState title="Ойлголт бүртгэгдээгүй" />
            ) : (
              <div className="eduflow:grid eduflow:gap-3">
                {concepts.map((concept) => (
                  <div key={concept._id}>
                    <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:text-[11px]">
                      <span className="eduflow:text-edu-ink">
                        {concept.topic}
                        <span className="eduflow:ml-1.5 eduflow:text-[10px] eduflow:text-edu-text">
                          {concept.subject}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "eduflow:font-medium",
                          concept.mastery < 50 ? "eduflow:text-edu-lav" : "eduflow:text-edu-cyan",
                        )}
                      >
                        {concept.mastery}%
                      </span>
                    </div>
                    <ProgressBar
                      value={concept.mastery}
                      max={100}
                      tone={concept.mastery < 50 ? "lav" : "cyan"}
                      className="eduflow:mt-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Сүүлийн дасгалууд" description="Дууссан дасгалын түүх.">
            {practice.completedQuizzes.length === 0 ? (
              <EmptyState title="Дууссан дасгал алга" />
            ) : (
              <div className="eduflow:grid eduflow:gap-2">
                {practice.completedQuizzes.map((item) => (
                  <div
                    key={item._id}
                    className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-3 eduflow:py-2"
                  >
                    <div>
                      <p className="eduflow:text-xs eduflow:text-edu-ink">{item.topic}</p>
                      <p className="eduflow:text-[10px] eduflow:text-edu-text">
                        {item.correctCount}/{item.totalQuestions} зөв хариулт
                      </p>
                    </div>
                    <span className="eduflow:text-[10px] eduflow:text-edu-text">
                      {formatDate(item.completedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
