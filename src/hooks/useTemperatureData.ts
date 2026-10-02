import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { stationToday, addDays, wallDay } from '../lib/stationTime';
import { useRefreshOnResume } from './useRefreshOnResume';

export interface DailyTemperature {
  date: string;      // 'YYYY-MM-DD'
  min_temp: number;
  max_temp: number;
}

interface RawRow {
  obs_timestamp: string;
  air_temperature: number | null;
}

export function useTemperatureData() {
  const [data, setData] = useState<DailyTemperature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` = background refresh after the app was resumed: keep the current data on screen
  // (no spinner / scroll jump) and keep it if the refresh fails.
  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const todayStr = stationToday();
      const fromStr = addDays(todayStr, -13);

      const { data: rows, error: queryError } = await supabase
        .from('weather_data')
        .select('obs_timestamp, air_temperature')
        .not('obs_timestamp', 'is', null)
        .gte('obs_timestamp', fromStr + 'T00:00:00Z')
        .lte('obs_timestamp', todayStr + 'T23:59:59Z')
        .order('obs_timestamp', { ascending: true });

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Aggregate min/max per day client-side
      const dailyMap = new Map<string, { min: number; max: number }>();

      (rows as RawRow[]).forEach(row => {
        if (!row.obs_timestamp || row.air_temperature === null) return;
        const temp = Number(row.air_temperature);
        if (isNaN(temp)) return;
        const dayKey = wallDay(row.obs_timestamp);
        const existing = dailyMap.get(dayKey);
        if (!existing) {
          dailyMap.set(dayKey, { min: temp, max: temp });
        } else {
          if (temp < existing.min) existing.min = temp;
          if (temp > existing.max) existing.max = temp;
        }
      });

      const result: DailyTemperature[] = Array.from(dailyMap.entries())
        .map(([date, { min, max }]) => ({ date, min_temp: min, max_temp: max }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData(result);
      setError(null);
    } catch (err) {
      if (silent) {
        console.warn('Background refresh failed:', err);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch temperature data');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useRefreshOnResume(() => fetchData(true));

  return { data, loading, error };
}
