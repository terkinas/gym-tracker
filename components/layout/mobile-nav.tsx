"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { navItems } from "@/components/layout/nav-items";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { useTranslations } from "@/lib/i18n/locale-context";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavProps {
  userName: string;
}

export function MobileNav({ userName }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations();
  const items = navItems(t);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t.nav.openMenu}
          className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </SheetTrigger>

      <SheetContent className="flex w-4/5 flex-col gap-0 p-0 sm:max-w-xs">
        <SheetHeader className="border-b border-border pb-5">
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t.nav.mobileMenuDescription}
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-1 flex-col justify-center gap-1 px-4 py-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SheetClose key={item.href} asChild>
                <NavLink
                  href={item.href}
                  className="group flex items-center gap-3.5 rounded-md px-3 py-3.5 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-accent data-[active=true]:text-foreground"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-[active=true]:text-primary"
                    strokeWidth={1.75}
                  />
                  {item.label}
                </NavLink>
              </SheetClose>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{t.languageSwitcher.label}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium text-foreground">{userName}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                {t.nav.logOut}
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
