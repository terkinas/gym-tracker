import {
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  Medal,
  Minus,
  type LucideIcon,
} from "lucide-react";

import { MAX_SCORE } from "@/lib/progress/analytics";
import { cn } from "@/lib/utils";

// Small presentational pieces shared by the podium cards, list rows and the
// "your position" card. Pure UI: nothing here computes or changes scores.
// Class strings are written out in full so Tailwind can see them.

type RankAccent = {
  icon: LucideIcon;
  /** Icon tile for the rank: tinted bg + border + icon colour. */
  tile: string;
  /** Thin top accent line on a podium card. */
  line: string;
};

const RANK_ACCENTS: Record<1 | 2 | 3, RankAccent> = {
  1: {
    icon: Crown,
    tile: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    line: "bg-amber-400/60",
  },
  2: {
    icon: Medal,
    tile: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    line: "bg-zinc-400/50",
  },
  3: {
    icon: Medal,
    tile: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    line: "bg-orange-400/50",
  },
};

export function rankAccent(rank: number): RankAccent | null {
  return rank >= 1 && rank <= 3 ? RANK_ACCENTS[rank as 1 | 2 | 3] : null;
}

/** Rank marker: medal/crown tile for the top 3, plain number otherwise. */
export function RankMark({ rank, className }: { rank: number; className?: string }) {
  const accent = rankAccent(rank);
  const Icon = accent?.icon;

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums",
        accent ? accent.tile : "border-border/60 bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {Icon ? (
        <>
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{rank}</span>
        </>
      ) : (
        rank
      )}
    </span>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? [...parts[0]].slice(0, 2) : [[...parts[0]][0], [...parts[parts.length - 1]][0]];
  return letters.join("").toUpperCase();
}

/** Initials circle (the app has no avatar images). */
export function UserAvatar({
  name,
  highlighted = false,
  className,
}: {
  name: string;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tracking-wide",
        highlighted
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Thin bar showing the score on its fixed 0–MAX_SCORE scale. */
export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (score / MAX_SCORE) * 100));
  return (
    <span
      aria-hidden="true"
      className={cn("block h-1 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <span
        className="block h-full rounded-full bg-primary/70 transition-[width] duration-200"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

export function progressTone(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct > 0) return "text-primary";
  if (pct < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function ProgressIcon({ pct, className }: { pct: number | null; className?: string }) {
  const Icon = pct === null || pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}
