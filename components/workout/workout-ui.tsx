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
  /** Icon tile: tinted background + border + icon colour (dark UI). */
  tile: string;
  /** Thin accent bar on the card's left edge. */
  bar: string;
};

const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  Krūtinė: {
    icon: Shield,
    tile: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    bar: "bg-orange-400/60",
  },
  Pečiai: {
    icon: Mountain,
    tile: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
    bar: "bg-yellow-400/60",
  },
  Bicepsas: {
    icon: BicepsFlexed,
    tile: "border-green-500/25 bg-green-500/10 text-green-300",
    bar: "bg-green-400/60",
  },
  Tricepsas: {
    icon: Dumbbell,
    tile: "border-teal-500/25 bg-teal-500/10 text-teal-300",
    bar: "bg-teal-400/60",
  },
  Nugara: {
    icon: ArrowUpFromLine,
    tile: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    bar: "bg-blue-400/60",
  },
  Presas: {
    icon: LayoutGrid,
    tile: "border-purple-500/25 bg-purple-500/10 text-purple-300",
    bar: "bg-purple-400/60",
  },
  Kojos: {
    icon: Footprints,
    tile: "border-red-500/25 bg-red-500/10 text-red-300",
    bar: "bg-red-400/60",
  },
};

const FALLBACK_META: CategoryMeta = {
  icon: Activity,
  tile: "border-border bg-muted/40 text-muted-foreground",
  bar: "bg-border",
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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
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
