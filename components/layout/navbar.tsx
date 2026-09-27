import Link from "next/link";

import { navItems } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function Navbar() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);
  const items = navItems(t);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 lg:h-20 lg:px-8">
        <Logo />

        {user ? (
          <>
            {/* Desktop navigation */}
            <ul className="hidden items-center gap-9 md:flex">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    className="group relative inline-flex py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground data-[active=true]:text-foreground"
                  >
                    {item.label}
                    <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[active=true]:scale-x-100" />
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-4 md:flex">
              <LanguageSwitcher />
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  {t.nav.logOut}
                </Button>
              </form>
            </div>

            {/* Mobile navigation trigger + sheet */}
            <div className="md:hidden">
              <MobileNav userName={user.name} />
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
