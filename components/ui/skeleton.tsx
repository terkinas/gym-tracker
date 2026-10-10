import { cn } from "@/lib/utils";

/** Pulsing placeholder block used by the per-route loading screens. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-none bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
