import {
  Activity,
  ArrowUpFromLine,
  BicepsFlexed,
  Dumbbell,
  Footprints,
  LayoutGrid,
  Mountain,
  Shield,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ExerciseCategory } from "@/lib/exercises";
import { cn } from "@/lib/utils";

// Small presentational pieces shared by the workout card, the completed row
// and the exercise picker. Pure UI: no workout state or logic in here.
// Class strings are written out in full so Tailwind can see them.

type CategoryMeta = {
  icon: LucideIcon;
  /** Icon tile: vivid gradient fill + white icon + soft glow. */
  tile: string;
  /** Thin accent bar on the card's left edge. */
  bar: string;
  /** Start colour of the fading hairline under a category heading. */
  line: string;
  /** Soft hover wash on exercise cards. */
  wash: string;
  /** Text colour (also drives `currentColor` in SVG charts). */
  text: string;
};

const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  Krūtinė: {
    icon: Shield,
    tile: "border-white/20 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30",
    bar: "bg-gradient-to-b from-orange-400 to-rose-500",
    line: "from-orange-400/50",
    wash: "hover:from-orange-500/10",
    text: "text-orange-400",
  },
  Pečiai: {
    icon: Mountain,
    tile: "border-white/20 bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md shadow-yellow-500/30",
    bar: "bg-gradient-to-b from-yellow-300 to-amber-500",
    line: "from-yellow-300/50",
    wash: "hover:from-yellow-500/10",
    text: "text-yellow-300",
  },
  Bicepsas: {
    icon: BicepsFlexed,
    tile: "border-white/20 bg-gradient-to-br from-lime-400 to-green-500 text-white shadow-md shadow-green-500/30",
    bar: "bg-gradient-to-b from-lime-400 to-green-500",
    line: "from-lime-400/50",
    wash: "hover:from-green-500/10",
    text: "text-lime-400",
  },
  Tricepsas: {
    icon: Dumbbell,
    tile: "border-white/20 bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-md shadow-cyan-500/30",
    bar: "bg-gradient-to-b from-cyan-400 to-teal-500",
    line: "from-cyan-400/50",
    wash: "hover:from-cyan-500/10",
    text: "text-cyan-400",
  },
  Nugara: {
    icon: ArrowUpFromLine,
    tile: "border-white/20 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30",
    bar: "bg-gradient-to-b from-sky-400 to-blue-600",
    line: "from-sky-400/50",
    wash: "hover:from-blue-500/10",
    text: "text-sky-400",
  },
  Presas: {
    icon: LayoutGrid,
    tile: "border-white/20 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30",
    bar: "bg-gradient-to-b from-violet-500 to-fuchsia-500",
    line: "from-violet-500/50",
    wash: "hover:from-fuchsia-500/10",
    text: "text-violet-400",
  },
  Kojos: {
    icon: Footprints,
    tile: "border-white/20 bg-gradient-to-br from-pink-500 to-red-500 text-white shadow-md shadow-red-500/30",
    bar: "bg-gradient-to-b from-pink-500 to-red-500",
    line: "from-pink-500/50",
    wash: "hover:from-red-500/10",
    text: "text-pink-500",
  },
};

const FALLBACK_META: CategoryMeta = {
  icon: Activity,
  tile: "border-border bg-muted/40 text-muted-foreground",
  bar: "bg-border",
  line: "from-border",
  wash: "hover:from-accent/40",
  text: "text-muted-foreground",
};

/** Accent classes for a category; neutral when the category is unknown (e.g.
 * an exercise that was deleted after it was logged). */
export function categoryMeta(category: ExerciseCategory | undefined): CategoryMeta {
  return category ? CATEGORY_META[category] : FALLBACK_META;
}

/** Rounded icon tile tinted with the exercise's category colour. */
export function CategoryTile({
  category,
  className,
}: {
  category: ExerciseCategory | undefined;
  className?: string;
}) {
  const { icon: Icon, tile } = categoryMeta(category);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-none border",
        tile,
        className,
      )}
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
    </span>
  );
}

/** Tiny neutral status chip with an icon (one-handed, bodyweight, done…). */
export function StatusBadge({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge
      className={cn(
        "gap-1 border-border/60 bg-muted/40 px-2 py-0.5 text-[0.7rem] leading-4 text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      {children}
    </Badge>
  );
}
