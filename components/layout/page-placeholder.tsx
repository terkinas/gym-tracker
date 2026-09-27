import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center lg:px-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}
