import { CategoryProgressCard } from "@/components/progress/category-progress-card";
import type { CategoryProgress } from "@/lib/progress/analytics";

interface CategoryProgressListProps {
  categories: CategoryProgress[];
}

export function CategoryProgressList({ categories }: CategoryProgressListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((category) => (
        <CategoryProgressCard key={category.category} data={category} />
      ))}
    </div>
  );
}
