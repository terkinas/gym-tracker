import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "@/lib/i18n/get-translations";

/** Instant placeholder shown by `loading.tsx` while a page's server data
 * loads. It is part of the prefetched route shell, so navigating feels
 * immediate even when the host/database is slow. */
export async function PageSkeleton({
  width = "max-w-5xl",
  blocks = 3,
}: {
  /** Same max-width class as the real page so nothing jumps on load. */
  width?: string;
  blocks?: number;
}) {
  const { t } = await getTranslations();

  return (
    <div
      role="status"
      aria-busy="true"
      className={`mx-auto w-full ${width} flex-1 px-5 py-10 lg:px-8 lg:py-14`}
    >
      <span className="sr-only">{t.common.loading}</span>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: blocks }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
