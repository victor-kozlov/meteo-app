import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  SUN_RADIATION_THRESHOLD,
  SUN_ILLUMINANCE_THRESHOLD,
  SUN_UV_INDEX_THRESHOLD,
} from '../constants/weather';
import { stationToday, addDays, wallDay, wallHour } from '../lib/stationTime';
import { summarizeRecent, RecentSummary } from '../lib/recentSummary';

export interface DailyWeatherRow {
  date: string;         // 'YYYY-MM-DD'
  min_temp: number;     // °C
  max_temp: number;     // °C
  rainfall_mm: number;  // mm
  sun_hours: number;    // integer count of sunny hours
}

interface RawRow {
  obs_timestamp: string;
  air_temperature: number | null;
  local_day_rain_accumulation: number | null;
  relative_humidity: number | null;
  solar_radiation: number | null;
  illuminance: number | null;
  uv: number | null;
}

export function useWeatherTableData() {
  const [data, setData] = useState<DailyWeatherRow[]>([]);
  const [summary, setSummary] = useState<RecentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const todayStr = stationToday();
      const fromStr = addDays(todayStr, -13);

      const [
        { data: rows, error: queryError },
        { data: lastRainRows, error: lastRainError },
      ] = await Promise.all([
        supabase
          .from('weather_data')
          .select('obs_timestamp, air_temperature, local_day_rain_accumulation, relative_humidity, solar_radiation, illuminance, uv')
          .not('obs_timestamp', 'is', null)
          .gte('obs_timestamp', fromStr + 'T00:00:00Z')
          .lte('obs_timestamp', todayStr + 'T23:59:59Z')
          .order('obs_timestamp', { ascending: true }),
        // Latest reading with rain on record — may be older than the 14-day window.
        supabase
          .from('weather_data')
          .select('obs_timestamp')
          .not('obs_timestamp', 'is', null)
          .gt('local_day_rain_accumulation', 0)
          .order('obs_timestamp', { ascending: false })
          .limit(1),
      ]);

      if (queryError) throw new Error(queryError.message);
      if (lastRainError) throw new Error(lastRainError.message);

      const lastRainTs: string | undefined = lastRainRows?.[0]?.obs_timestamp;
      const lastRainDate = lastRainTs ? wallDay(lastRainTs) : null;

      type DayEntry = {
        min_temp: number;
        max_temp: number;
        max_rain: number;
        sunnyHours: Set<string>;
      };

      const dailyMap = new Map<string, DayEntry>();

      (rows as RawRow[]).forEach(row => {
        if (!row.obs_timestamp) return;

        const dayKey = wallDay(row.obs_timestamp);
        const hourKey = wallHour(row.obs_timestamp); // 'YYYY-MM-DDTHH'

        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            min_temp: Infinity,
            max_temp: -Infinity,
            max_rain: 0,
            sunnyHours: new Set(),
          });
        }

        const entry = dailyMap.get(dayKey)!;

        if (row.air_temperature !== null) {
          const temp = Number(row.air_temperature);
          if (!isNaN(temp)) {
            if (temp < entry.min_temp) entry.min_temp = temp;
            if (temp > entry.max_temp) entry.max_temp = temp;
          }
        }

        const rain = Number(row.local_day_rain_accumulation) || 0;
        if (rain > entry.max_rain) entry.max_rain = rain;

        const solarRad = Number(row.solar_radiation) || 0;
        const illum = Number(row.illuminance) || 0;
        const uv = Number(row.uv) || 0;
        if (
          solarRad > SUN_RADIATION_THRESHOLD &&
          (illum > SUN_ILLUMINANCE_THRESHOLD || uv >= SUN_UV_INDEX_THRESHOLD)
        ) {
          entry.sunnyHours.add(hourKey);
        }
      });

      const result: DailyWeatherRow[] = Array.from(dailyMap.entries())
        .filter(([, e]) => e.min_temp !== Infinity) // exclude days with no temperature readings
        .map(([date, e]) => ({
          date,
          min_temp: Math.round(e.min_temp * 10) / 10,
          max_temp: Math.round(e.max_temp * 10) / 10,
          rainfall_mm: Math.round(e.max_rain * 10) / 10,
          sun_hours: e.sunnyHours.size,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)); // descending — today first

      setData(result);
      setSummary(summarizeRecent(rows as RawRow[], todayStr, lastRainDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, summary, loading, error };
}
