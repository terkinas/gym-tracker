"use client";

import * as React from "react";
import Link from "next/link";
import { CircleUser, LogOut, Medal, Trophy } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/auth/actions";
import { useTranslations } from "@/lib/i18n/locale-context";

interface MobileUserMenuProps {
  name: string;
  username: string;
}

/** Profile button + dropdown for the mobile top bar. Logout reuses the
 * existing `logoutAction` exactly as the desktop navbar does (a form
 * submitting the server action); the dropdown item just submits that form. */
export function MobileUserMenu({ name, username }: MobileUserMenuProps) {
  const t = useTranslations();
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={logoutAction} className="hidden" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t.nav.profileMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
          >
            <CircleUser className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 max-w-[calc(100vw-1.5rem)]">
          <DropdownMenuLabel className="flex min-w-0 flex-col gap-0.5 font-normal">
            <span className="truncate font-medium text-foreground">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              @{username}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="min-h-11">
            <Link href="/rekordai">
              <Trophy className="h-4 w-4" strokeWidth={1.75} />
              {t.nav.records}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11">
            <Link href="/leaderboard">
              <Medal className="h-4 w-4" strokeWidth={1.75} />
              {t.nav.leaderboard}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => formRef.current?.requestSubmit()}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t.nav.logOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
