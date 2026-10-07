import { Dumbbell, Repeat, Trophy } from "lucide-react";

import { categoryColorClass } from "@/lib/category-colors";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Exercise } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import type { Locale } from "@/lib/i18n/config";
import { formatCount, formatDate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";
import type { PersonalRecord } from "@/lib/progress/analytics";

function Stat({
  icon: Icon,
  label,
  value,
  date,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  date: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {label}
      </span>
      <span className="text-sm font-semibold break-words text-foreground tabular-nums">
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
}: {
  exercise: Exercise;
  record: PersonalRecord;
  t: Dictionary;
  locale: Locale;
}) {
  const kg = t.records.units.kg;
  const num = (n: number) => formatCount(n, locale);

  // A weight of 0 (bodyweight/unweighted sets) isn't a meaningful weight or
  // volume record, so show "No data" rather than "0 kg".
  const hasWeight = record.bestWeight > 0;
  const hasVolume = record.bestSet.volume > 0;

  return (
    <Card className="gap-4 p-5">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-base font-semibold break-words text-foreground">{exercise.name}</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={categoryColorClass(exercise.category)}>
            {translateCategory(exercise.category, t)}
          </Badge>
          {exercise.isOneHanded && (
            <Badge className="bg-transparent text-muted-foreground">
              {t.workout.oneHandedBadge}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={Dumbbell}
          label={t.records.bestWeight}
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
          value={
            hasVolume
              ? `${num(record.bestSet.weight)} ${kg} × ${num(record.bestSet.reps)} = ${num(record.bestSet.volume)} ${kg}`
              : t.records.noData
          }
          date={hasVolume ? formatDate(record.bestSet.date, locale) : null}
        />
      </div>
    </Card>
  );
}
