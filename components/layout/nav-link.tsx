"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = React.ComponentPropsWithoutRef<typeof Link>;

/**
 * A Link that knows whether it points at the currently active route and
 * exposes that as `data-active`, so consumers can style the active state
 * with `data-[active=true]:...` (and `group-data-[active=true]:...` for
 * nested elements) without any extra prop plumbing.
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ href, ...props }, ref) {
    const pathname = usePathname();
    const hrefStr = href.toString();
    const isActive =
      hrefStr === "/"
        ? pathname === "/"
        : pathname === hrefStr || pathname.startsWith(`${hrefStr}/`);

    return (
      <Link
        ref={ref}
        href={href}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive || undefined}
        {...props}
      />
    );
  },
);
