import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Shared look for the progress page: a vivid gradient icon tile, a heading and
// a hairline that fades out to the right (same language as /pratimai).
// Class strings are written out in full so Tailwind can see them.
export const TONES = {
  green: {
    tile: "border-white/20 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md shadow-emerald-500/30",
    line: "from-emerald-400/50",
    glow: "bg-emerald-400/15",
  },
  orange: {
    tile: "border-white/20 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30",
    line: "from-orange-400/50",
    glow: "bg-orange-400/15",
  },
  amber: {
    tile: "border-white/20 bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md shadow-yellow-500/30",
    line: "from-yellow-300/50",
    glow: "bg-yellow-400/15",
  },
  blue: {
    tile: "border-white/20 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30",
    line: "from-sky-400/50",
    glow: "bg-sky-400/15",
  },
  violet: {
    tile: "border-white/20 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30",
    line: "from-violet-500/50",
    glow: "bg-violet-500/15",
  },
} as const;

export type Tone = keyof typeof TONES;

export function ToneTile({
  icon: Icon,
  tone = "green",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border",
        TONES[tone].tile,
        className,
      )}
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
    </span>
  );
}

export function SectionHeading({
  icon,
  title,
  subtitle,
  tone = "green",
  id,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: Tone;
  id?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ToneTile icon={icon} tone={tone} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <span
        aria-hidden="true"
        className={cn("h-px min-w-4 flex-1 bg-gradient-to-r to-transparent", TONES[tone].line)}
      />
      {action}
    </div>
  );
}
