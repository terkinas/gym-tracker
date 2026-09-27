import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.auth.login.title} · GymTracker` };
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <LoginForm />
    </div>
  );
}
