import { useMutation, useQuery } from "@apollo/client";
import {
  IconArrowRight,
  IconCheck,
  IconFlame,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
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
  const [startQuiz, { loading: starting }] = useMutation(START_QUIZ);
  const [answerQuiz, { loading: answering }] = useMutation(ANSWER_QUIZ);

  if (!session) {
    return null;
  }

  if (loading && !data) {
    return <div className="eduflow:h-40 eduflow:animate-pulse eduflow:rounded-2xl eduflow:bg-edu-card" />;
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
  const activeQuiz = quiz ?? practice.activeQuiz;
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
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Дасгал эхлүүлж чадсангүй.",
      );
    }
  };

  const answer = async (index: number) => {
    if (!activeQuiz || result) return;
    setSelected(index);
    setMessage(null);

    const questionIndex = activeQuiz.currentQuestionIndex;
    const currentQuestion = activeQuiz.questions[questionIndex];

    if (!currentQuestion) return;

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

      if (value.quiz.status === "completed") {
        await refetch();
      }
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Хариултыг шалгаж чадсангүй.",
      );
    }
  };

  const next = () => {
    setResult(null);
    setSelected(null);
  };

  const displayIndex = result
    ? result.questionIndex
    : activeQuiz?.currentQuestionIndex ?? 0;
  const question = result ? result.question : activeQuiz?.questions[displayIndex];

  return (
    <div className="eduflow:grid eduflow:gap-5">
      <PageHeading
        eyebrow="Сурагч"
        title="Дасан зохицсон дасгал"
        description="AI чинь хамгийн сул ойлголтыг олж, 5 богино асуултаар бэхжүүлнэ. Зөв хариулах тусам хүндрэл нэмэгдэнэ."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/student`}>Нүүр</Link>
          </Button>
        }
      />

      {message && <ErrorBanner message={message} />}

      <div className="eduflow:grid eduflow:gap-5 eduflow:xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={activeQuiz ? "Өнөөдрийн дасгал" : "Бэлэн дасгал"}
          description={
            activeQuiz
              ? `${activeQuiz.subject} · ${activeQuiz.topic}`
              : "Хамгийн сул ойлголтоос эхэлнэ."
          }
          action={
            !activeQuiz ? (
              <Button type="button" size="sm" disabled={starting} onClick={start}>
                <IconSparkles className="eduflow:size-4" />
                {starting ? "Бэлтгэж байна…" : "Эхлүүлэх"}
              </Button>
            ) : undefined
          }
        >
          {activeQuiz && question && (activeQuiz.status === "active" || result) ? (
            <div className="eduflow:grid eduflow:gap-4">
              <div className="eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:justify-between eduflow:gap-2">
                <div className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:text-[10px] eduflow:text-edu-text">
                  <span className="eduflow:rounded-full eduflow:bg-edu-purple/20 eduflow:px-2 eduflow:py-0.5 eduflow:text-edu-lav">
                    {activeQuiz.topic}
                  </span>
                  <span>
                    Асуулт {displayIndex + 1}/{activeQuiz.totalQuestions}
                  </span>
                </div>
                <div className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:text-[10px] eduflow:text-edu-text">
                  <span className="eduflow:flex eduflow:items-center eduflow:gap-1">
                    <IconFlame className="eduflow:size-3.5 eduflow:text-edu-lav" />
                    {activeQuiz.correctStreak} дараалсан
                  </span>
                  <span className="eduflow:flex eduflow:items-center eduflow:gap-1">
                    Хүндрэл
                    <span className="eduflow:flex eduflow:gap-0.5">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={cn(
                            "eduflow:size-1.5 eduflow:rounded-full",
                            level <= activeQuiz.currentDifficulty
                              ? "eduflow:bg-edu-lav"
                              : "eduflow:bg-edu-border",
                          )}
                        />
                      ))}
                    </span>
                  </span>
                </div>
              </div>

              <ProgressBar
                value={displayIndex}
                max={activeQuiz.totalQuestions}
                tone="blue"
              />

              <div>
                <h3 className="eduflow:text-sm eduflow:font-semibold eduflow:leading-relaxed eduflow:text-white">
                  {question.prompt}
                </h3>
                <div className="eduflow:mt-3 eduflow:grid eduflow:gap-2">
                  {question.options.map((option, index) => {
                    const chosen = selected === index;
                    const correct = result ? result.correctIndex === index : false;
                    const wrong = result && chosen && !result.correct;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={Boolean(result) || answering}
                        onClick={() => void answer(index)}
                        className={cn(
                          "eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:px-3 eduflow:py-2.5 eduflow:text-left eduflow:text-xs eduflow:transition",
                          correct
                            ? "eduflow:border-edu-cyan/50 eduflow:bg-edu-cyan/10 eduflow:text-edu-cyan"
                            : wrong
                              ? "eduflow:border-edu-lav/50 eduflow:bg-edu-purple/15 eduflow:text-edu-lav"
                              : "eduflow:border-edu-border eduflow:bg-edu-card2/60 eduflow:text-edu-text hover:eduflow:border-edu-lav/30 hover:eduflow:text-white",
                        )}
                      >
                        <span>{option}</span>
                        {correct && <IconCheck className="eduflow:size-4" />}
                        {wrong && <IconX className="eduflow:size-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {result && (
                <div
                  className={cn(
                    "eduflow:rounded-xl eduflow:border eduflow:p-3 eduflow:text-[11px] eduflow:leading-relaxed",
                    result.correct
                      ? "eduflow:border-edu-cyan/30 eduflow:bg-edu-cyan/5 eduflow:text-edu-cyan"
                      : "eduflow:border-edu-lav/30 eduflow:bg-edu-purple/10 eduflow:text-edu-lav",
                  )}
                >
                  <p className="eduflow:font-semibold">
                    {result.correct ? "Зөв хариулт!" : "Дахин оролдоорой"}
                  </p>
                  <p className="eduflow:mt-1 eduflow:text-edu-text">
                    {result.explanation}
                  </p>
                  <Button type="button" size="sm" className="eduflow:mt-3" onClick={next}>
                    {displayIndex + 1 >= activeQuiz.totalQuestions
                      ? "Үр дүн харах"
                      : "Дараах асуулт"}
                    <IconArrowRight className="eduflow:size-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : activeQuiz && activeQuiz.status === "completed" && !result ? (
            <div className="eduflow:grid eduflow:gap-4">
              <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-cyan/30 eduflow:bg-edu-cyan/5 eduflow:p-5 eduflow:text-center">
                <div className="eduflow:mx-auto eduflow:flex eduflow:size-14 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-edu-cyan/15 eduflow:text-edu-cyan">
                  <IconSparkles className="eduflow:size-7" />
                </div>
                <h3 className="eduflow:mt-3 eduflow:text-lg eduflow:font-semibold eduflow:text-white">
                  Дасгал дууслаа!
                </h3>
                <p className="eduflow:mt-1 eduflow:text-xs eduflow:text-edu-text">
                  {activeQuiz.correctCount}/{activeQuiz.totalQuestions} зөв
                  хариулт
                </p>
                <div className="eduflow:mt-3 eduflow:flex eduflow:justify-center eduflow:gap-2">
                  <Button type="button" size="sm" disabled={starting} onClick={start}>
                    {starting ? "Бэлтгэж байна…" : "Дахин дасгал"}
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`${base}/student`}>Нүүр</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Дасгал эхлүүлэхэд бэлэн"
              description="AI чинь сул ойлголтыг сонгоод 5 асуулт бэлдэнэ."
            />
          )}
        </SectionCard>

        <div className="eduflow:grid eduflow:gap-4">
          <SectionCard
            title="Сул ойлголтууд"
            description="Бага mastery-тай ойлголтоос дасгал эхэлнэ."
          >
            {concepts.length === 0 ? (
              <EmptyState title="Ойлголт бүртгэгдээгүй" />
            ) : (
              <div className="eduflow:grid eduflow:gap-3">
                {concepts.map((concept) => (
                  <div key={concept._id}>
                    <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-2 eduflow:text-[11px]">
                      <span className="eduflow:text-white">
                        {concept.topic}
                        <span className="eduflow:ml-1.5 eduflow:text-[10px] eduflow:text-edu-text">
                          {concept.subject}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "eduflow:font-medium",
                          concept.mastery < 50
                            ? "eduflow:text-edu-lav"
                            : "eduflow:text-edu-cyan",
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

          <SectionCard
            title="Сүүлийн дасгалууд"
            description="Дууссан дасгалын түүх."
          >
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
                      <p className="eduflow:text-xs eduflow:text-white">
                        {item.topic}
                      </p>
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
