import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getVerifiedUser } from "@/lib/auth/dal";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.auth.login.title} · GymTracker` };
}

export default async function LoginPage() {
  if (await getVerifiedUser()) redirect("/treniruote");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <LoginForm />
    </div>
  );
}
