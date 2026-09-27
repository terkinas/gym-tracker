import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.auth.register.title} · GymTracker` };
}

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <RegisterForm />
    </div>
  );
}
