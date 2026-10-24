import { IconFlame, IconStar, IconTrophy } from "@tabler/icons-react";
import { ProgressBar, type Member } from "./ui";

export const StreakCard = ({ member }: { member: Member }) => {
  const level = Math.floor(member.points / 150) + 1;
  const levelProgress = member.points % 150;
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    return day <= Math.min(member.streak, 7);
  });

  return (
    <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-2xl eduflow:border eduflow:border-edu-lav/25 eduflow:bg-gradient-to-br eduflow:from-edu-purple/30 eduflow:via-edu-card eduflow:to-edu-card eduflow:p-5">
      <div
        aria-hidden
        className="eduflow:pointer-events-none eduflow:absolute eduflow:-right-10 eduflow:-top-12 eduflow:size-44 eduflow:rounded-full eduflow:bg-edu-purple/30 eduflow:blur-3xl"
      />
      <div className="eduflow:relative eduflow:flex eduflow:flex-wrap eduflow:items-center eduflow:justify-between eduflow:gap-5">
        <div className="eduflow:flex eduflow:items-center eduflow:gap-4">
          <div className="eduflow:relative eduflow:flex eduflow:size-20 eduflow:items-center eduflow:justify-center eduflow:rounded-2xl eduflow:bg-edu-bg/50 eduflow:ring-1 eduflow:ring-edu-lav/30">
            <IconFlame className="eduflow:size-10 eduflow:text-edu-lav eduflow:drop-shadow-[0_0_12px_#7C3AED]" />
            <span className="eduflow:absolute -bottom-2 eduflow:rounded-full eduflow:border eduflow:border-edu-lav/30 eduflow:bg-edu-bg eduflow:px-2 eduflow:py-0.5 eduflow:text-[10px] eduflow:font-semibold eduflow:text-edu-lav">
              {member.streak} day{member.streak === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            <p className="eduflow:text-[11px] eduflow:font-medium eduflow:uppercase eduflow:tracking-widest eduflow:text-edu-text">
              Current streak
            </p>
            <h2 className="eduflow:mt-1 eduflow:text-2xl eduflow:font-semibold eduflow:text-white">
              {member.name}, keep it alive!
            </h2>
            <p className="eduflow:mt-1 eduflow:text-xs eduflow:text-edu-text">
              Longest streak {member.longestStreak} days · {member.points} XP
            </p>
          </div>
        </div>

        <div className="eduflow:flex eduflow:items-center eduflow:gap-2">
          {week.map((filled, index) => (
            <span
              key={index}
              className={
                filled
                  ? "eduflow:flex eduflow:size-7 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-edu-lav/20 eduflow:text-edu-lav eduflow:ring-1 eduflow:ring-edu-lav/30"
                  : "eduflow:flex eduflow:size-7 eduflow:items-center eduflow:justify-center eduflow:rounded-full eduflow:bg-edu-card2 eduflow:text-edu-text/50 eduflow:ring-1 eduflow:ring-edu-border"
              }
            >
              <IconStar className="eduflow:size-3.5" />
            </span>
          ))}
        </div>
      </div>

      <div className="eduflow:relative eduflow:mt-5 eduflow:grid eduflow:gap-4 eduflow:sm:grid-cols-[1fr_auto] eduflow:sm:items-end">
        <div>
          <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:text-[11px] eduflow:text-edu-text">
            <span className="eduflow:flex eduflow:items-center eduflow:gap-1.5">
              <IconTrophy className="eduflow:size-3.5 eduflow:text-edu-cyan" />
              Level {level}
            </span>
            <span>{levelProgress}/150 XP to level {level + 1}</span>
          </div>
          <ProgressBar value={levelProgress} max={150} className="eduflow:mt-1.5" />
        </div>
        <div className="eduflow:rounded-xl eduflow:border eduflow:border-edu-cyan/20 eduflow:bg-edu-cyan/5 eduflow:px-3 eduflow:py-2 eduflow:text-[11px] eduflow:text-edu-cyan">
          Finish today’s homework to extend the streak
        </div>
      </div>
    </section>
  );
};
