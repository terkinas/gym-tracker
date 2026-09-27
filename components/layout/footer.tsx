import { getTranslations } from "@/lib/i18n/get-translations";

export async function Footer() {
  const { t } = await getTranslations();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-6 text-center text-sm text-muted-foreground lg:px-8">
        {t.footer.copyright(2026)}
      </div>
    </footer>
  );
}
