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

// Small presentational pieces shared by the podium cards, list rows, the
// "your position" card and the records page. Pure UI: nothing here computes
// or changes scores. Same visual language as /pratimai and /progress:
// vivid gradient tiles, soft corner glows, thin accent bars.
// Class strings are written out in full so Tailwind can see them.

type RankAccent = {
  icon: LucideIcon;
  /** Gradient icon tile for the rank. */
  tile: string;
  /** Thin accent line across the top of a podium card. */
  line: string;
  /** Vertical accent bar on a card's left edge. */
  bar: string;
  /** Soft colour blob in a card's corner. */
  glow: string;
  /** Text colour for rank labels. */
  text: string;
  /** Border + faint gradient fill for the whole card. */
  card: string;
};

const RANK_ACCENTS: Record<1 | 2 | 3, RankAccent> = {
  1: {
    icon: Crown,
    tile: "border-white/20 bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md shadow-yellow-500/30",
    line: "bg-gradient-to-r from-yellow-300 to-amber-500",
    bar: "bg-gradient-to-b from-yellow-300 to-amber-500",
    glow: "bg-yellow-400/20",
    text: "text-amber-300",
    card: "border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent",
  },
  2: {
    icon: Medal,
    tile: "border-white/20 bg-gradient-to-br from-zinc-300 to-zinc-500 text-white shadow-md shadow-zinc-400/30",
    line: "bg-gradient-to-r from-zinc-300 to-zinc-500",
    bar: "bg-gradient-to-b from-zinc-300 to-zinc-500",
    glow: "bg-zinc-300/15",
    text: "text-zinc-300",
    card: "border-zinc-400/25 bg-gradient-to-br from-zinc-400/10 to-transparent",
  },
  3: {
    icon: Medal,
    tile: "border-white/20 bg-gradient-to-br from-orange-400 to-amber-700 text-white shadow-md shadow-orange-500/30",
    line: "bg-gradient-to-r from-orange-400 to-amber-700",
    bar: "bg-gradient-to-b from-orange-400 to-amber-700",
    glow: "bg-orange-400/15",
    text: "text-orange-300",
    card: "border-orange-400/25 bg-gradient-to-br from-orange-500/10 to-transparent",
  },
};

export function rankAccent(rank: number): RankAccent | null {
  return rank >= 1 && rank <= 3 ? RANK_ACCENTS[rank as 1 | 2 | 3] : null;
}

/** Rank marker: gradient crown/medal tile for the top 3, plain number otherwise. */
export function RankMark({ rank, className }: { rank: number; className?: string }) {
  const accent = rankAccent(rank);
  const Icon = accent?.icon;

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border text-sm font-semibold tabular-nums",
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

/** Initials tile (the app has no avatar images). The signed-in user's tile
 * gets the brand gradient. */
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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-none border text-xs font-semibold tracking-wide",
        highlighted
          ? "border-white/20 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md shadow-emerald-500/30"
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
      className={cn("block h-1.5 w-full overflow-hidden rounded-none bg-muted", className)}
    >
      <span
        className="block h-full rounded-none bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-200"
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

/** Small bordered chip around a progress value (green up, red down, neutral). */
export function progressChip(pct: number | null): string {
  if (pct === null || pct === 0) return "border-border/60 bg-muted/30 text-muted-foreground";
  if (pct > 0) return "border-primary/30 bg-primary/10 text-primary";
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

export function ProgressIcon({ pct, className }: { pct: number | null; className?: string }) {
  const Icon = pct === null || pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}
