import type { ComponentType, ReactNode } from "react";
import { cn } from "erxes-ui";
import type { EduflowDemoQuery } from "~/gql/graphql";

export type Demo = EduflowDemoQuery["eduflowDemo"];
export type Member = Demo["students"][number];
export type Homework = Demo["homeworks"][number];
export type Submission = Demo["submissions"][number];
export type LessonPlan = Demo["lessonPlans"][number];
export type Notification = Demo["notifications"][number];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDay = (value?: string | null) => {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
};

export const dueLabel = (value: string) => {
  const due = new Date(value);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
};

export const submissionLabel = (status: string) => {
  if (status === "approved") return "Approved";
  if (status === "needs_work") return "Needs work";
  if (status === "ai_checked") return "AI checked";
  return "Submitted";
};

export const statusTone = (status: string) => {
  if (status === "approved") {
    return "eduflow:border-edu-cyan/40 eduflow:bg-edu-cyan/10 eduflow:text-edu-cyan";
  }
  if (status === "review" || status === "ai_checked") {
    return "eduflow:border-edu-blue/40 eduflow:bg-edu-blue/10 eduflow:text-edu-blue";
  }
  if (status === "needs_work") {
    return "eduflow:border-edu-lav/40 eduflow:bg-edu-purple/15 eduflow:text-edu-lav";
  }
  return "eduflow:border-edu-border eduflow:bg-edu-card2 eduflow:text-edu-text";
};

export const StatusPill = ({
  status,
  label,
}: {
  status: string;
  label?: string;
}) => (
  <span
    className={cn(
      "eduflow:inline-flex eduflow:items-center eduflow:gap-1.5 eduflow:rounded-full eduflow:border eduflow:px-2.5 eduflow:py-0.5 eduflow:text-[11px] eduflow:font-medium",
      statusTone(status),
    )}
  >
    <span className="eduflow:size-1.5 eduflow:rounded-full eduflow:bg-current" />
    {label ?? submissionLabel(status)}
  </span>
);

export const ProgressBar = ({
  value,
  max,
  tone = "lav",
  className,
}: {
  value: number;
  max: number;
  tone?: "lav" | "cyan" | "blue";
  className?: string;
}) => {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill =
    tone === "cyan"
      ? "eduflow:bg-edu-cyan"
      : tone === "blue"
        ? "eduflow:bg-edu-blue"
        : "eduflow:bg-edu-lav";

  return (
    <div
      className={cn(
        "eduflow:h-1.5 eduflow:w-full eduflow:overflow-hidden eduflow:rounded-full eduflow:bg-edu-border",
        className,
      )}
    >
      <div
        className={cn("eduflow:h-full eduflow:rounded-full", fill)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export const Avatar = ({
  name,
  size = "md",
  tone = "lav",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  tone?: "lav" | "cyan" | "blue";
}) => {
  const sizes = {
    sm: "eduflow:size-7 eduflow:text-[10px]",
    md: "eduflow:size-9 eduflow:text-xs",
    lg: "eduflow:size-12 eduflow:text-sm",
  };
  const tones = {
    lav: "eduflow:from-edu-purple/70 eduflow:to-edu-lav/30 eduflow:text-edu-lav",
    cyan: "eduflow:from-edu-cyan/50 eduflow:to-edu-cyan/10 eduflow:text-edu-cyan",
    blue: "eduflow:from-edu-blue/50 eduflow:to-edu-blue/10 eduflow:text-edu-blue",
  };

  return (
    <span
      className={cn(
        "eduflow:inline-flex eduflow:shrink-0 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-gradient-to-br eduflow:font-semibold eduflow:ring-1 eduflow:ring-white/10",
        sizes[size],
        tones[tone],
      )}
    >
      {initials(name)}
    </span>
  );
};

export const SectionCard = ({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:p-5 eduflow:shadow-[0_0_40px_-24px_#7C3AED]",
      className,
    )}
  >
    {(title || action) && (
      <div className="eduflow:mb-4 eduflow:flex eduflow:items-start eduflow:justify-between eduflow:gap-3">
        <div>
          {title && (
            <h2 className="eduflow:text-sm eduflow:font-semibold eduflow:tracking-wide eduflow:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="eduflow:mt-1 eduflow:text-xs eduflow:text-edu-text">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = "lav",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  accent?: "lav" | "cyan" | "blue";
}) => {
  const tones = {
    lav: "eduflow:bg-edu-purple/20 eduflow:text-edu-lav",
    cyan: "eduflow:bg-edu-cyan/10 eduflow:text-edu-cyan",
    blue: "eduflow:bg-edu-blue/10 eduflow:text-edu-blue",
  };

  return (
    <div className="eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card eduflow:p-4">
      <div className="eduflow:flex eduflow:items-center eduflow:justify-between">
        <span className="eduflow:text-[11px] eduflow:font-medium eduflow:uppercase eduflow:tracking-wider eduflow:text-edu-text">
          {label}
        </span>
        <span
          className={cn(
            "eduflow:inline-flex eduflow:size-8 eduflow:items-center eduflow:justify-center eduflow:rounded-lg",
            tones[accent],
          )}
        >
          <Icon className="eduflow:size-4" />
        </span>
      </div>
      <div className="eduflow:mt-2 eduflow:text-2xl eduflow:font-semibold eduflow:text-white">
        {value}
      </div>
      {hint && (
        <div className="eduflow:mt-0.5 eduflow:text-[11px] eduflow:text-edu-text">
          {hint}
        </div>
      )}
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="eduflow:rounded-xl eduflow:border eduflow:dashed eduflow:border-edu-border eduflow:bg-edu-card2/50 eduflow:px-4 eduflow:py-8 eduflow:text-center">
    <p className="eduflow:text-sm eduflow:font-medium eduflow:text-white">
      {title}
    </p>
    {description && (
      <p className="eduflow:mt-1 eduflow:text-xs eduflow:text-edu-text">
        {description}
      </p>
    )}
  </div>
);

export const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="eduflow:mb-4 eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-3 eduflow:rounded-xl eduflow:border eduflow:border-edu-lav/40 eduflow:bg-edu-purple/15 eduflow:px-4 eduflow:py-3 eduflow:text-xs eduflow:text-edu-lav">
    <span>{message}</span>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="eduflow:rounded-md eduflow:border eduflow:border-edu-lav/30 eduflow:px-2 eduflow:py-1 eduflow:font-medium hover:eduflow:bg-edu-lav/10"
      >
        Retry
      </button>
    )}
  </div>
);

export const AiNotice = () => (
  <div className="eduflow:flex eduflow:items-start eduflow:gap-2 eduflow:rounded-xl eduflow:border eduflow:border-edu-blue/25 eduflow:bg-edu-blue/5 eduflow:px-3 eduflow:py-2.5 eduflow:text-[11px] eduflow:leading-relaxed eduflow:text-edu-text">
    <span className="eduflow:mt-0.5 eduflow:rounded-md eduflow:bg-edu-blue/15 eduflow:px-1.5 eduflow:py-0.5 eduflow:text-[10px] eduflow:font-semibold eduflow:text-edu-blue">
      DEMO AI
    </span>
    <span>
      Photo checks and SMS are simulated. The workflow is real: upload →
      AI-style review → teacher approval → parent update.
    </span>
  </div>
);
