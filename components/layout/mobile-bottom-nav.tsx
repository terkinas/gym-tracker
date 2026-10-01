import { navItems } from "@/components/layout/nav-items";
import { NavLink } from "@/components/layout/nav-link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTranslations } from "@/lib/i18n/get-translations";

/** Mobile-only (< md) fixed bottom navigation for the four main pages.
 *
 * Layout contract: the row container is `flex flex-row flex-nowrap` (never
 * column, never wrapping) and each link is `flex-1 basis-0 min-w-0`, so the
 * four items always share the width equally on ONE line. Only each link
 * itself is `flex-col` (icon above label). The row's layout-critical
 * properties are also set inline so no stray/global CSS can stack the items.
 *
 * Rendered only for signed-in users. The spacer in normal flow keeps the
 * footer/last content from being hidden behind the fixed bar. */
export async function MobileBottomNav() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);

  if (!user) return null;

  const items = navItems(t);

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom))] w-full shrink-0 md:hidden"
      />

      <nav
        aria-label={t.nav.mainNavigation}
        className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-border bg-background/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85 md:hidden"
      >
        <div
          className="flex h-16 w-full flex-row flex-nowrap items-stretch"
          style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap" }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="group relative flex min-h-11 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent/60 data-[active=true]:text-primary"
              >
                <span className="pointer-events-none absolute top-0 h-0.5 w-8 scale-x-0 rounded-full bg-primary transition-transform duration-200 group-data-[active=true]:scale-x-100" />
                <Icon
                  className="h-5 w-5 shrink-0 transition-transform duration-150 group-active:scale-95 group-data-[active=true]:[stroke-width:2.25]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="block w-full truncate text-center text-[0.7rem] leading-none font-medium">
                  {item.shortLabel}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
