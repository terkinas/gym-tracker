import Link from "next/link";
import { Dumbbell } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-[1.05rem] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-none bg-primary/15 text-primary">
        <Dumbbell className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      GymTracker
    </Link>
  );
}
