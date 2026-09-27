import { Dumbbell, ListChecks, TrendingUp } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/translations";

// Labels are resolved from the translation dictionary at render time (see
// `navItems(t)` below) rather than hard-coded here, so the nav works in
// both Server Components (`Navbar`, via `getTranslations()`) and Client
// Components (`MobileNav`, via `useTranslations()`).
const NAV_ITEM_DEFS = [
  { href: "/treniruote", icon: Dumbbell, key: "todayWorkout" } as const,
  { href: "/pratimai", icon: ListChecks, key: "exercises" } as const,
  { href: "/progress", icon: TrendingUp, key: "progress" } as const,
];

export function navItems(t: Dictionary) {
  return NAV_ITEM_DEFS.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t.nav[item.key],
  }));
}
