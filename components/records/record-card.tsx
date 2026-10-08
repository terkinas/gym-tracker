import { Dumbbell, Hand, Medal, Repeat, Trophy, type LucideIcon } from "lucide-react";

import { CategoryTile, StatusBadge, categoryMeta } from "@/components/workout/workout-ui";
import type { Exercise } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import type { Locale } from "@/lib/i18n/config";
import { formatCount, formatDate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";
import type { PersonalRecord } from "@/lib/progress/analytics";
import { cn } from "@/lib/utils";

// Presentation only: every number and date comes straight from the existing
// `PersonalRecord` (calculatePersonalRecords). Nothing is recomputed here.

function Stat({
  icon: Icon,
  label,
  value,
  date,
  highlight = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  date: string | null;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-xl border px-3.5 py-3",
        highlight ? "border-primary/30 bg-primary/10" : "border-border/60 bg-muted/20",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          highlight ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span className="text-base font-semibold break-words text-foreground tabular-nums">
        {value}
      </span>
      {date && <span className="text-xs text-muted-foreground">{date}</span>}
    </div>
  );
}

export function RecordCard({
  exercise,
  record,
  t,
  locale,
  index = 0,
}: {
  exercise: Exercise;
  record: PersonalRecord;
  t: Dictionary;
  locale: Locale;
  /** Only used to stagger the entrance a little. */
  index?: number;
}) {
  const kg = t.records.units.kg;
  const num = (n: number) => formatCount(n, locale);

  // A weight of 0 (bodyweight/unweighted sets) isn't a meaningful weight or
  // volume record, so show "No data" rather than "0 kg".
  const hasWeight = record.bestWeight > 0;
  const hasVolume = record.bestSet.volume > 0;
  const { bar } = categoryMeta(exercise.category);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors duration-200 hover:bg-accent/20 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:fill-mode-backwards sm:p-5"
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bar)} />

      <div className="flex min-w-0 items-center gap-3">
        <CategoryTile category={exercise.category} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold break-words text-foreground">{exercise.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {translateCategory(exercise.category, t)}
            </span>
            {exercise.isOneHanded && (
              <StatusBadge icon={Hand}>{t.workout.oneHandedBadge}</StatusBadge>
            )}
          </div>
        </div>
        {hasWeight && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
            <Trophy className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {t.records.record}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat
          icon={Dumbbell}
          label={t.records.bestWeight}
          highlight={hasWeight}
          value={hasWeight ? `${num(record.bestWeight)} ${kg}` : t.records.noData}
          date={hasWeight ? formatDate(record.bestWeightDate, locale) : null}
        />
        <Stat
          icon={Repeat}
          label={t.records.bestReps}
          value={`${num(record.bestReps)} ${t.records.units.reps}`}
          date={formatDate(record.bestRepsDate, locale)}
        />
        <Stat
          icon={Trophy}
          label={t.records.bestSet}
          className="col-span-2 sm:col-span-1"
          value={
            hasVolume
              ? `${num(record.bestSet.weight)} ${kg} × ${num(record.bestSet.reps)} = ${num(record.bestSet.volume)} ${kg}`
              : t.records.noData
          }
          date={hasVolume ? formatDate(record.bestSet.date, locale) : null}
        />
      </div>
    </article>
  );
}

/** Compact highlight card for the "top lifts" strip at the top of the page. */
export function TopRecordCard({
  exercise,
  record,
  rank,
  t,
  locale,
}: {
  exercise: Exercise;
  record: PersonalRecord;
  rank: number;
  t: Dictionary;
  locale: Locale;
}) {
  const num = (n: number) => formatCount(n, locale);
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <CategoryTile category={exercise.category} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          <Medal className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          TOP {rank}
        </span>
        <span className="truncate text-sm font-semibold text-foreground">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatDate(record.bestWeightDate, locale)}
        </span>
      </div>
      <span className="shrink-0 text-right">
        <span className="block text-xl leading-none font-semibold text-foreground tabular-nums">
          {num(record.bestWeight)}
        </span>
        <span className="text-xs text-muted-foreground">{t.records.units.kg}</span>
      </span>
    </li>
  );
}
