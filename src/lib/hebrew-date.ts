import { HDate } from "@hebcal/core";

/**
 * Converts a Gregorian Date to a Hebrew date string in Hebrew letters.
 * Example: new Date("2024-04-23") → "ט״ו ניסן תשפ״ד"
 */
export function toHebrewDate(date: Date | null | undefined): string {
  if (!date) return "";
  try {
    const hdate = new HDate(new Date(date));
    return hdate.renderGematriya(true);
  } catch {
    return "";
  }
}
