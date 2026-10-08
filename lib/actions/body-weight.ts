"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import { setUserBodyWeight } from "@/lib/storage/users";
import { isValidBodyWeight } from "@/lib/workout/body-weight";

/** Saves the authenticated user's current body weight (kg). `null` clears it.
 * Independent of any workout: the user id always comes from the session and
 * the value is validated (20–300 kg, at most one decimal) before it is
 * written. Returns the stored value. */
export async function saveBodyWeightAction(value: number | null): Promise<number | null> {
  const user = await requireUser();

  if (value !== null && !isValidBodyWeight(value)) {
    throw new Error("INVALID_BODY_WEIGHT");
  }

  await setUserBodyWeight(user.id, value);
  revalidatePath("/treniruote");
  return value;
}
