"use client";

import { Check, Dumbbell, Flame, Layers3, Lock, Medal, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Achievement, AchievementId } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount } from "@/lib/i18n/format";

interface AchievementsProps {
  achievements: Achievement[];
}

const ICONS: Record<AchievementId, LucideIcon> = {
  firstWorkout: Dumbbell,
  firstPr: Trophy,
  workouts10: Dumbbell,
  workouts25: Dumbbell,
  workouts50: Medal,
  sets100: Layers3,
  sets500: Layers3,
  prs10: Trophy,
  prs25: Medal,
  streak7: Flame,
  streak30: Flame,
};

/** Milestones derived from saved workouts (no table). Locked ones are muted
 * and show how far along the user is, e.g. "18 / 25". */
export function Achievements({ achievements }: AchievementsProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="achievements-title">
      <div className="flex flex-col gap-0.5">
        <h2 id="achievements-title" className="text-lg font-semibold tracking-tight text-foreground">
          {t.progress.achievements.title}
        </h2>
        <p className="text-xs text-muted-foreground">{t.progress.ui.achievementsSubtitle}</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const name = t.progress.achievements.items[achievement.id];
          const percent = Math.round((achievement.progress / achievement.target) * 100);
          const Icon = ICONS[achievement.id];

          return (
            <li
              key={achievement.id}
              className={cn(
                "flex min-w-0 flex-col gap-2.5 rounded-2xl border p-4 transition-colors duration-200",
                achievement.unlocked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    achievement.unlocked
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground/70",
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {name}
                </span>
                {achievement.unlocked ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={1.75} aria-hidden="true" />
                )}
              </div>

              {achievement.unlocked ? (
                <span className="text-xs font-medium text-primary">{t.progress.achievements.unlocked}</span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatCount(achievement.progress, locale)} / {formatCount(achievement.target, locale)}
                  </span>
                  <div
                    role="progressbar"
                    aria-label={name}
                    aria-valuemin={0}
                    aria-valuemax={achievement.target}
                    aria-valuenow={achievement.progress}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-muted-foreground/50 motion-safe:transition-[width] motion-safe:duration-200"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
