import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherStats } from '../types/weather';

export function useWeatherData() {
  const [data, setData] = useState<WeatherStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FETCHING DATA BY MONTHS ===');
      
      // Получаем данные по месяцам (чтобы обойти лимит 1000 записей)
      const allRawData = [];
      
      // Месяцы для загрузки (январь-июнь 2025)
      const monthsToFetch = [
        { start: '2025-01-01', end: '2025-02-01', name: 'January' },
        { start: '2025-02-01', end: '2025-03-01', name: 'February' },
        { start: '2025-03-01', end: '2025-04-01', name: 'March' },
        { start: '2025-04-01', end: '2025-05-01', name: 'April' },
        { start: '2025-05-01', end: '2025-06-01', name: 'May' },
        { start: '2025-06-01', end: '2025-07-01', name: 'June' }
      ];

      for (const month of monthsToFetch) {
        console.log(`Fetching ${month.name}...`);
        
        const { data: monthData, error: queryError } = await supabase
          .from('weather_data')
          .select('obs_timestamp, local_day_rain_accumulation')
          .not('obs_timestamp', 'is', null)
          .gte('obs_timestamp', month.start + 'T00:00:00Z')
          .lt('obs_timestamp', month.end + 'T00:00:00Z')
          .order('obs_timestamp');

        if (queryError) {
          throw new Error(`Database query failed for ${month.name}: ${queryError.message}`);
        }

        if (monthData && monthData.length > 0) {
          console.log(`${month.name}: ${monthData.length} records`);
          allRawData.push(...monthData);
        } else {
          console.log(`${month.name}: No data`);
        }
      }

      console.log('Total raw data from database:', allRawData.length, 'records');

      if (allRawData.length === 0) {
        setData([]);
        return;
      }

      // Process data to calculate daily maximums
      const dailyData = new Map<string, number>();

      allRawData.forEach(row => {
        if (!row.obs_timestamp) return;
        
        const date = new Date(row.obs_timestamp);
        const dayKey = date.toISOString().substring(0, 10); // YYYY-MM-DD
        const rainAmount = Number(row.local_day_rain_accumulation) || 0;

        // Get maximum rain accumulation per day
        if (!dailyData.has(dayKey) || dailyData.get(dayKey)! < rainAmount) {
          dailyData.set(dayKey, rainAmount);
        }
      });

      console.log('Total daily entries:', dailyData.size);

      // Группировка по месяцам для проверки
      const monthCounts = new Map();
      dailyData.forEach((rain, dayKey) => {
        const month = new Date(dayKey + 'T12:00:00Z').getUTCMonth() + 1;
        monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
      });
      console.log('Days per month:', Object.fromEntries(monthCounts));

      // Initialize monthly data structure
      const monthlyData = new Map<number, {
        days: Set<string>;
        daysWithRain: Set<string>;
        totalRain: number;
      }>();

      // Initialize months 1-12
      for (let month = 1; month <= 12; month++) {
        monthlyData.set(month, {
          days: new Set(),
          daysWithRain: new Set(),
          totalRain: 0
        });
      }

      // Calculate monthly statistics from daily data
      dailyData.forEach((rainAmount, dayKey) => {
        const date = new Date(dayKey + 'T12:00:00Z');
        const month = date.getUTCMonth() + 1;

        const monthData = monthlyData.get(month)!;
        monthData.days.add(dayKey);
        
        if (rainAmount > 0) {
          monthData.daysWithRain.add(dayKey);
        }
        
        monthData.totalRain += rainAmount;
      });

      // English month names
      const monthNames = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const formattedData: WeatherStats[] = [];
      
      monthlyData.forEach((monthData, month) => {
        const totalDays = monthData.days.size;
        
        if (totalDays > 0) {
          const daysWithRain = monthData.daysWithRain.size;
          const rainPercentage = totalDays > 0 ? Math.round((daysWithRain / totalDays) * 100 * 10) / 10 : 0;
          
          formattedData.push({
            month_number: month,
            month_name: monthNames[month],
            total_days_with_data: totalDays,
            days_with_rain: daysWithRain,
            total_monthly_rain_mm: Math.round(monthData.totalRain * 10) / 10,
            rain_percentage: rainPercentage
          });
        }
      });

      formattedData.sort((a, b) => a.month_number - b.month_number);

      console.log('Final formatted data:', formattedData);
      setData(formattedData);

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchWeatherData };
}