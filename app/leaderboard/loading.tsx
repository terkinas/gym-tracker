import { PageSkeleton } from "@/components/layout/page-skeleton";

export default async function Loading() {
  return <PageSkeleton width="max-w-4xl" blocks={5} />;
}
