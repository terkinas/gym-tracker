import Link from "next/link";

import { desktopNavItems } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { LogoutButton } from "@/components/layout/logout-button";
import { MobileUserMenu } from "@/components/layout/mobile-user-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function Navbar() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);
  const items = desktopNavItems(t);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 lg:h-20 lg:px-8">
        <Logo />

        {user ? (
          <>
            {/* Desktop navigation */}
            <ul className="hidden items-center gap-4 md:flex lg:gap-7">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    className="group relative inline-flex py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground data-[active=true]:text-foreground"
                  >
                    {/* Short labels keep five items on one line within the
                        max-w-5xl navbar; the full label stays as the tooltip. */}
                    <span title={item.label}>{item.shortLabel}</span>
                    <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[active=true]:scale-x-100" />
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-4 md:flex">
              <LanguageSwitcher />
              <span className="hidden text-sm text-muted-foreground lg:inline">{user.name}</span>
              <form action={logoutAction}>
                <LogoutButton>{t.nav.logOut}</LogoutButton>
              </form>
            </div>

            {/* Mobile: language switcher + profile menu. Page navigation
                lives in the fixed bottom bar (MobileBottomNav). */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              <MobileUserMenu name={user.name} username={user.username} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button asChild size="sm">
              <Link href="/login">{t.nav.logIn}</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
