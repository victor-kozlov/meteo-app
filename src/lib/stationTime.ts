// `obs_timestamp` is the station's wall-clock time (Europe/Berlin) stored WITHOUT a time zone,
// e.g. '2026-09-18T22:59:55'. Never run it through `new Date()`: the browser would read it as its
// own local time and `toISOString()` would shift the date by the UTC offset (days run 02:00–01:59).
// Take the date/hour straight from the string instead.
export const STATION_TZ = 'Europe/Berlin';

export const wallDay = (ts: string): string => ts.substring(0, 10);   // 'YYYY-MM-DD'
export const wallHour = (ts: string): string => ts.substring(0, 13);  // 'YYYY-MM-DDTHH'

/** Today's date at the station ('YYYY-MM-DD'), regardless of the browser's time zone. */
export function stationToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STATION_TZ }).format(new Date());
}

/** Calendar arithmetic on a 'YYYY-MM-DD' string (no time zone involved). */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().substring(0, 10);
}
