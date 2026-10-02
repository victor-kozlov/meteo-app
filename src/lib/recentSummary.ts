import { addDays, daysBetween, wallDay } from './stationTime';

export interface RecentRow {
  obs_timestamp: string;
  local_day_rain_accumulation: number | null;
  relative_humidity: number | null;
}

export interface RecentSummary {
  rain7dMm: number;              // total rainfall over the last 7 days (today + 6 previous), mm
  daysSinceRain: number | null;  // 0 = rain today; null = no rain on record
  avgHumidity7d: number | null;  // mean of the readings over the last 7 days, %; null = no readings
}

/**
 * KPI values for the "Last 14 days" section. `rows` must cover at least the last 7 days;
 * `lastRainDate` is the most recent day with rain on record ('YYYY-MM-DD', may be older than `rows`).
 * `local_day_rain_accumulation` resets daily, so a day's total is its maximum reading.
 */
export function summarizeRecent(
  rows: RecentRow[],
  today: string,
  lastRainDate: string | null,
): RecentSummary {
  const weekStart = addDays(today, -6);
  const dailyMaxRain = new Map<string, number>();
  let humiditySum = 0;
  let humidityCount = 0;

  for (const row of rows) {
    if (!row.obs_timestamp) continue;
    const day = wallDay(row.obs_timestamp);
    if (day < weekStart || day > today) continue;

    const rain = Number(row.local_day_rain_accumulation) || 0;
    if (rain > (dailyMaxRain.get(day) ?? 0)) dailyMaxRain.set(day, rain);

    if (row.relative_humidity !== null && row.relative_humidity !== undefined) {
      const humidity = Number(row.relative_humidity);
      if (!isNaN(humidity)) {
        humiditySum += humidity;
        humidityCount++;
      }
    }
  }

  let rainTotal = 0;
  dailyMaxRain.forEach(rain => { rainTotal += rain; });

  return {
    rain7dMm: Math.round(rainTotal * 10) / 10,
    daysSinceRain: lastRainDate ? Math.max(0, daysBetween(lastRainDate, today)) : null,
    avgHumidity7d: humidityCount > 0 ? humiditySum / humidityCount : null,
  };
}
