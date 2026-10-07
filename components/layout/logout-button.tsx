"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

/** Submit button for the logout <form>; spins while the action is running. */
export function LogoutButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      {children}
    </Button>
  );
}
