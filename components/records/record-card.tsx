import { ArrowLeftRight, Dumbbell, Repeat, Trophy, type LucideIcon } from "lucide-react";

import { rankAccent } from "@/components/leaderboard/leaderboard-ui";
import { TONES, type Tone } from "@/components/progress/section-heading";
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
// Visual language matches /pratimai and /progress: category accent bar, soft
// hover wash, gradient icon tiles, corner glow on the headline stat.

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  date,
  highlight = false,
  muted = false,
  className,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  date: string | null;
  /** Headline stat: amber-tinted card with a corner glow. */
  highlight?: boolean;
  /** No data: grey the icon tile out. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-none border px-3.5 py-3",
        highlight
          ? "border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent"
          : "border-border/60 bg-muted/20",
        className,
      )}
    >
      {highlight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 bg-amber-400/15 blur-2xl"
        />
      )}
      <span className="relative flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-none border",
            muted ? "border-border bg-muted/30 text-muted-foreground" : TONES[tone].tile,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span
        className={cn(
          "relative text-lg leading-tight font-bold break-words tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
      {date && <span className="relative text-xs text-muted-foreground">{date}</span>}
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
  const { bar, wash } = categoryMeta(exercise.category);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      className={cn(
        "relative overflow-hidden rounded-none border border-border bg-card bg-gradient-to-r from-transparent to-transparent py-4 pr-4 pl-5 transition-[background-color,border-color] duration-200 hover:border-foreground/20 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:fill-mode-backwards sm:py-5 sm:pr-5",
        wash,
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bar)} />

      <div className="flex min-w-0 items-center gap-3.5">
        <CategoryTile category={exercise.category} className="h-12 w-12" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold break-words text-foreground">{exercise.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {translateCategory(exercise.category, t)}
            </span>
            {exercise.isOneHanded && (
              <StatusBadge icon={ArrowLeftRight}>{t.workout.oneHandedBadge}</StatusBadge>
            )}
          </div>
        </div>
        {hasWeight && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-none border border-white/20 bg-gradient-to-br from-yellow-300 to-amber-500 px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-950 shadow-md shadow-yellow-500/20">
            <Trophy className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {t.records.record}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat
          icon={Dumbbell}
          tone="amber"
          label={t.records.bestWeight}
          highlight={hasWeight}
          muted={!hasWeight}
          value={hasWeight ? `${num(record.bestWeight)} ${kg}` : t.records.noData}
          date={hasWeight ? formatDate(record.bestWeightDate, locale) : null}
        />
        <Stat
          icon={Repeat}
          tone="blue"
          label={t.records.bestReps}
          value={`${num(record.bestReps)} ${t.records.units.reps}`}
          date={formatDate(record.bestRepsDate, locale)}
        />
        <Stat
          icon={Trophy}
          tone="violet"
          label={t.records.bestSet}
          muted={!hasVolume}
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

/** Highlight card for the "heaviest lifts" strip at the top of the page:
 * gold / silver / bronze accent by rank, big weight on the right. */
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
  const accent = rankAccent(rank);
  const RankIcon = accent?.icon;

  return (
    <li
      className={cn(
        "relative flex min-w-0 items-center gap-3 overflow-hidden rounded-none border bg-card py-4 pr-4 pl-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
        accent?.card ?? "border-border",
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accent?.bar)} />
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute -top-10 -right-10 h-28 w-28 blur-2xl", accent?.glow)}
      />

      <CategoryTile category={exercise.category} className="relative h-12 w-12" />
      <div className="relative flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("flex items-center gap-1 text-xs font-semibold", accent?.text)}>
          {RankIcon && <RankIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
          TOP {rank}
        </span>
        <span className="truncate text-sm font-semibold text-foreground">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatDate(record.bestWeightDate, locale)}
        </span>
      </div>
      <span className="relative shrink-0 text-right">
        <span className="block text-3xl leading-none font-bold text-foreground tabular-nums">
          {num(record.bestWeight)}
        </span>
        <span className="text-xs text-muted-foreground">{t.records.units.kg}</span>
      </span>
    </li>
  );
}
