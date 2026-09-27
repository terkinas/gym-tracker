import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getLocale } from "@/lib/i18n/get-locale";
import { getTranslations } from "@/lib/i18n/get-translations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: "GymTracker",
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LocaleProvider locale={locale}>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
