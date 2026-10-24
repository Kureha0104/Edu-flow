import { IconSchool, IconUser, IconUsers } from "@tabler/icons-react";
import { cn } from "erxes-ui";

export type DemoRole = "teacher" | "student" | "parent";

const ROLES: {
  value: DemoRole;
  label: string;
  hint: string;
  icon: typeof IconSchool;
}[] = [
  {
    value: "teacher",
    label: "Teacher",
    hint: "Assign",
    icon: IconSchool,
  },
  {
    value: "student",
    label: "Student",
    hint: "Streak",
    icon: IconUser,
  },
  {
    value: "parent",
    label: "Parent",
    hint: "Progress",
    icon: IconUsers,
  },
];

export const RoleSwitch = ({
  role,
  onChange,
}: {
  role: DemoRole;
  onChange: (role: DemoRole) => void;
}) => (
  <div className="eduflow:grid eduflow:grid-cols-3 eduflow:gap-2 eduflow:rounded-2xl eduflow:border eduflow:border-edu-border eduflow:bg-edu-card/80 eduflow:p-1.5">
    {ROLES.map(({ value, label, hint, icon: Icon }) => {
      const active = value === role;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={active}
          className={cn(
            "eduflow:flex eduflow:items-center eduflow:gap-2.5 eduflow:rounded-xl eduflow:px-3 eduflow:py-2.5 eduflow:text-left eduflow:transition",
            active
              ? "eduflow:bg-gradient-to-br eduflow:from-edu-purple/40 eduflow:to-edu-purple/10 eduflow:shadow-[0_0_24px_-8px_#7C3AED] eduflow:ring-1 eduflow:ring-edu-lav/40"
              : "hover:eduflow:bg-edu-card2",
          )}
        >
          <span
            className={cn(
              "eduflow:inline-flex eduflow:size-8 eduflow:items-center eduflow:justify-center eduflow:rounded-lg",
              active
                ? "eduflow:bg-edu-lav/15 eduflow:text-edu-lav"
                : "eduflow:bg-edu-card2 eduflow:text-edu-text",
            )}
          >
            <Icon className="eduflow:size-4" />
          </span>
          <span className="eduflow:min-w-0">
            <span
              className={cn(
                "eduflow:block eduflow:text-xs eduflow:font-semibold",
                active ? "eduflow:text-white" : "eduflow:text-edu-text",
              )}
            >
              {label}
            </span>
            <span className="eduflow:block eduflow:truncate eduflow:text-[10px] eduflow:text-edu-text/80">
              {hint}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);
