import { Dumbbell, History, ListChecks, Medal, TrendingUp, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/translations";

type NavItemDef = {
  href: string;
  icon: LucideIcon;
  key: keyof Dictionary["nav"]["short"];
};

// Labels are resolved from the translation dictionary at render time (see
// `navItems(t)` below) rather than hard-coded here, so the nav works in
// both Server Components (`Navbar`, via `getTranslations()`) and Client
// Components (`MobileBottomNav`, also a Server Component).
const NAV_ITEM_DEFS: readonly NavItemDef[] = [
  { href: "/treniruote", icon: Dumbbell, key: "todayWorkout" },
  { href: "/istorija", icon: History, key: "history" },
  { href: "/pratimai", icon: ListChecks, key: "exercises" },
  { href: "/progress", icon: TrendingUp, key: "progress" },
];

// Extra desktop-only item: the mobile bottom bar deliberately stays at 4
// items, so Personal Records is reached from the desktop nav and from the
// mobile profile menu (see MobileUserMenu) instead.
const RECORDS_ITEM_DEF: NavItemDef = { href: "/rekordai", icon: Trophy, key: "records" };

// Also desktop-only (and in the mobile profile menu): the bottom bar stays at
// exactly 4 items.
const LEADERBOARD_ITEM_DEF: NavItemDef = { href: "/leaderboard", icon: Medal, key: "leaderboard" };

function build(defs: readonly NavItemDef[], t: Dictionary) {
  return defs.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t.nav[item.key],
    shortLabel: t.nav.short[item.key],
  }));
}

/** The 4 items shown in the mobile bottom navigation. */
export function navItems(t: Dictionary) {
  return build(NAV_ITEM_DEFS, t);
}

/** Desktop navigation: the 4 main items plus Personal Records and Leaderboard. */
export function desktopNavItems(t: Dictionary) {
  return build([...NAV_ITEM_DEFS, RECORDS_ITEM_DEF, LEADERBOARD_ITEM_DEF], t);
}
