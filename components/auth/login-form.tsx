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
import { loginAction } from "@/lib/auth/actions";
import { useTranslations } from "@/lib/i18n/locale-context";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const t = useTranslations();
  const errorMessage = state?.error
    ? (t.auth.errors as Record<string, string>)[state.error] ?? t.auth.errors.GENERIC
    : null;

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>{t.auth.login.title}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">{t.auth.login.usernameLabel}</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.auth.login.passwordLabel}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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
          <Button type="submit" className="w-full" loading={pending}>
            {pending ? t.auth.login.submitPending : t.auth.login.submit}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.login.noAccount}{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t.auth.login.registerLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
