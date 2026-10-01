"use client";

import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Achievement } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount } from "@/lib/i18n/format";

interface AchievementsProps {
  achievements: Achievement[];
}

/** Milestones derived from saved workouts (no table). Locked ones are muted
 * and show how far along the user is, e.g. "18 / 25". */
export function Achievements({ achievements }: AchievementsProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-4" aria-labelledby="achievements-title">
      <h2 id="achievements-title" className="text-lg font-semibold tracking-tight text-foreground">
        {t.progress.achievements.title}
      </h2>
      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const name = t.progress.achievements.items[achievement.id];
          const percent = Math.round((achievement.progress / achievement.target) * 100);

          return (
            <li
              key={achievement.id}
              className={cn(
                "flex min-w-0 flex-col gap-2 rounded-lg border p-4",
                achievement.unlocked
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    achievement.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {achievement.unlocked ? (
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-foreground">{name}</span>
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
                    <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${percent}%` }} />
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
