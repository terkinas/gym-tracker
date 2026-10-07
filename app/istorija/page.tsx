import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HistoryCalendar } from "@/components/history/history-calendar";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getTranslations } from "@/lib/i18n/get-translations";
import { getWorkoutDaysForMonth } from "@/lib/storage/workouts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.history.pageTitle} · GymTracker` };
}

/** `?month=YYYY-MM`; anything invalid or in the future falls back to the
 * current month. */
function parseMonth(value: string | string[] | undefined, currentMonth: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return currentMonth;
  return raw > currentMonth ? currentMonth : raw;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  // The proxy already protects this route; never rely on that alone.
  if (!user) redirect("/login");

  const [{ t, locale }, params] = await Promise.all([getTranslations(), searchParams]);
  const today = getTodayDateString();
  const month = parseMonth(params.month, today.slice(0, 7));

  // userId always comes from the server session, never from the client.
  const days = await getWorkoutDaysForMonth(user.id, month);
  const workoutByDate = new Map(days.map((day) => [day.date, day.id]));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t.history.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.history.pageSubtitle}</p>
      </div>

      <HistoryCalendar
        month={month}
        today={today}
        workoutByDate={workoutByDate}
        t={t}
        locale={locale}
      />
    </div>
  );
}
