"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/auth/actions";
import { useTranslations } from "@/lib/i18n/locale-context";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const t = useTranslations();
  const errorMessage = state?.error
    ? (t.auth.errors as Record<string, string>)[state.error] ?? t.auth.errors.GENERIC
    : null;

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>{t.auth.register.title}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t.auth.register.nameLabel}</Label>
            <Input id="name" name="name" type="text" autoComplete="name" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">{t.auth.register.usernameLabel}</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              minLength={3}
              maxLength={32}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.auth.register.passwordLabel}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">
              {t.auth.register.confirmPasswordLabel}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.auth.register.submitPending : t.auth.register.submit}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.register.haveAccount}{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t.auth.register.loginLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
