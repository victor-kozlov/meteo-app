import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherStats, YearSummary, SunSummary } from '../types/weather';
import {
  SUN_RADIATION_THRESHOLD,
  SUN_ILLUMINANCE_THRESHOLD,
  SUN_UV_INDEX_THRESHOLD,
  SUNNY_DAY_HOURS_THRESHOLD,
} from '../constants/weather';
import { wallDay, wallHour } from '../lib/stationTime';

export function useWeatherData() {
  const [data, setData] = useState<WeatherStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearsFetched, setYearsFetched] = useState(false);
  const [yearSummary, setYearSummary] = useState<YearSummary>({ lastRainDate: null, lastRainAmountMm: 0 });
  const [sunSummary, setSunSummary] = useState<SunSummary>({ sunnyDays: 0, totalSunHours: 0, lastSunnyDayDate: null, lastSunnyDayHours: 0, sunnyDayPercentage: null });

  const fetchAvailableYears = async () => {
    // Защита от повторных вызовов
    if (!yearsLoading || yearsFetched) return;
    
    try {
      setYearsFetched(true);
      console.log('Starting to fetch available years...');
      
      // Получаем уникальные года из базы данных более эффективным способом
      // Используем SQL функцию для извлечения года из timestamp
      const { data: yearData, error: yearError } = await supabase
        .rpc('get_available_years');

      if (yearError) {
        console.log('RPC function not available, falling back to regular query');
        
        // Fallback: загружаем данные по частям для получения всех лет
        const years = new Set<number>();
        
        // Проверяем несколько возможных лет (2020-2030)
        for (let year = 2020; year <= 2030; year++) {
          const startDate = `${year}-01-01T00:00:00Z`;
          const endDate = `${year + 1}-01-01T00:00:00Z`;
          
          const { data: checkData, error: checkError } = await supabase
            .from('weather_data')
            .select('obs_timestamp')
            .not('obs_timestamp', 'is', null)
            .gte('obs_timestamp', startDate)
            .lt('obs_timestamp', endDate)
            .limit(1);
          
          if (!checkError && checkData && checkData.length > 0) {
            years.add(year);
            console.log(`Found data for year ${year}`);
          }
        }
        
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        console.log('Setting available years:', sortedYears);
        setAvailableYears(sortedYears);
        
        // Устанавливаем текущий год как выбранный по умолчанию, если он есть в данных
        const currentYear = new Date().getFullYear();
        if (sortedYears.includes(currentYear)) {
          setSelectedYear(currentYear);
          console.log('Selected current year:', currentYear);
        } else if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]); // Выбираем самый последний год
          console.log('Selected latest year:', sortedYears[0]);
        }
        
        console.log('Available years (fallback method):', sortedYears);
      } else if (yearData && yearData.length > 0) {
        const sortedYears = yearData.sort((a: number, b: number) => b - a);
        setAvailableYears(sortedYears);
        
        // Устанавливаем текущий год как выбранный по умолчанию, если он есть в данных
        const currentYear = new Date().getFullYear();
        if (sortedYears.includes(currentYear)) {
          setSelectedYear(currentYear);
        } else if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]); // Выбираем самый последний год
        }
        
        console.log('Available years (RPC method):', sortedYears);
      } else {
        // Если нет данных, устанавливаем пустой массив
        setAvailableYears([]);
        setSelectedYear(null);
        console.log('No years found in database');
      }
    } catch (err) {
      console.error('Error fetching available years:', err);
    } finally {
      setYearsLoading(false);
    }
  };

  const fetchWeatherData = async (year?: number) => {
    const targetYear = year || selectedYear;
    if (!targetYear) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`=== FETCHING DATA FOR YEAR ${targetYear} ===`);
      
      // Получаем данные по месяцам для выбранного года
      const allRawData = [];
      
      // Генерируем месяцы для загрузки для выбранного года
      const monthsToFetch = [];
      // Boundaries are plain 'YYYY-MM-DD' strings: obs_timestamp is a wall-clock value without a
      // time zone, so going through Date/toISOString() would shift them by the browser's UTC offset.
      const pad = (n: number) => String(n).padStart(2, '0');
      for (let month = 1; month <= 12; month++) {
        const nextYear = month === 12 ? targetYear + 1 : targetYear;
        const nextMonth = month === 12 ? 1 : month + 1;

        monthsToFetch.push({
          start: `${targetYear}-${pad(month)}-01`,
          end: `${nextYear}-${pad(nextMonth)}-01`,
          name: new Date(Date.UTC(targetYear, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
        });
      }

      for (const month of monthsToFetch) {
        console.log(`Fetching ${month.name} ${targetYear}...`);
        
        const { data: monthData, error: queryError } = await supabase
          .from('weather_data')
          .select('obs_timestamp, local_day_rain_accumulation, illuminance, uv, solar_radiation')
          .not('obs_timestamp', 'is', null)
          .gte('obs_timestamp', month.start + 'T00:00:00Z')
          .lt('obs_timestamp', month.end + 'T00:00:00Z')
          .order('obs_timestamp');

        if (queryError) {
          throw new Error(`Database query failed for ${month.name}: ${queryError.message}`);
        }

        if (monthData && monthData.length > 0) {
          console.log(`${month.name} ${targetYear}: ${monthData.length} records`);
          allRawData.push(...monthData);
        } else {
          console.log(`${month.name} ${targetYear}: No data`);
        }
      }

      console.log('Total raw data from database:', allRawData.length, 'records');

      if (allRawData.length === 0) {
        setData([]);
        setSunSummary({ sunnyDays: 0, totalSunHours: 0, lastSunnyDayDate: null, lastSunnyDayHours: 0, sunnyDayPercentage: null });
        return;
      }

      // Process data to calculate daily maximums
      const dailyData = new Map<string, number>();

      allRawData.forEach(row => {
        if (!row.obs_timestamp) return;
        
        const dayKey = wallDay(row.obs_timestamp); // YYYY-MM-DD
        const rainAmount = Number(row.local_day_rain_accumulation) || 0;

        // Get maximum rain accumulation per day
        if (!dailyData.has(dayKey) || dailyData.get(dayKey)! < rainAmount) {
          dailyData.set(dayKey, rainAmount);
        }
      });

      console.log('Total daily entries:', dailyData.size);

      // Compute last rain date and amount for the selected year
      let lastRainDate: string | null = null;
      let lastRainAmountMm = 0;
      dailyData.forEach((rainAmount, dayKey) => {
        if (rainAmount > 0 && (!lastRainDate || dayKey > lastRainDate)) {
          lastRainDate = dayKey;
          lastRainAmountMm = Math.round(rainAmount * 10) / 10;
        }
      });
      setYearSummary({ lastRainDate, lastRainAmountMm });

      // Compute daily sun hours from raw rows.
      // Group by unique station-local hour — an hour is "sunny" if at least one measurement in it
      // crosses the threshold. This avoids over-counting sub-hourly observations.
      const dailySunnyHourSets = new Map<string, Set<string>>();
      allRawData.forEach(row => {
        if (!row.obs_timestamp) return;
        const dayKey = wallDay(row.obs_timestamp);
        if (Number(dayKey.substring(0, 4)) !== targetYear) return;
        const hourKey = wallHour(row.obs_timestamp); // 'YYYY-MM-DDTHH'

        if (!dailySunnyHourSets.has(dayKey)) {
          dailySunnyHourSets.set(dayKey, new Set());
        }

        const solarRad = Number(row.solar_radiation) || 0;
        const illum = Number(row.illuminance) || 0;
        const uv = Number(row.uv) || 0;
        const isSunny =
          solarRad > SUN_RADIATION_THRESHOLD &&
          (illum > SUN_ILLUMINANCE_THRESHOLD || uv >= SUN_UV_INDEX_THRESHOLD);

        if (isSunny) {
          dailySunnyHourSets.get(dayKey)!.add(hourKey);
        }
      });

      // Convert to Map<dayKey, sunHoursCount>
      const dailySunHours = new Map<string, number>();
      dailySunnyHourSets.forEach((hourSet, dayKey) => {
        dailySunHours.set(dayKey, hourSet.size);
      });

      // Aggregate sun stats for the year
      let sunnyDays = 0;
      let totalSunHours = 0;
      let lastSunnyDayDate: string | null = null;
      let lastSunnyDayHours = 0;
      dailySunHours.forEach((hours, dayKey) => {
        totalSunHours += hours;
        if (hours >= SUNNY_DAY_HOURS_THRESHOLD) {
          sunnyDays++;
          if (!lastSunnyDayDate || dayKey > lastSunnyDayDate) {
            lastSunnyDayDate = dayKey;
            lastSunnyDayHours = hours;
          }
        }
      });
      // Compute total days passed in the selected year (up to yesterday, exclusive of today)
      const currentYear = new Date().getFullYear();
      let totalDaysPassedThisYear: number;
      if (targetYear < currentYear) {
        // Full year has elapsed — use actual year length
        const isLeap = new Date(targetYear, 1, 29).getMonth() === 1;
        totalDaysPassedThisYear = isLeap ? 366 : 365;
      } else if (targetYear === currentYear) {
        const jan1 = new Date(targetYear, 0, 1);
        jan1.setHours(0, 0, 0, 0);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        totalDaysPassedThisYear = Math.max(
          0,
          Math.floor((todayMidnight.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000))
        );
      } else {
        totalDaysPassedThisYear = 0;
      }
      const sunnyDayPercentage =
        totalDaysPassedThisYear > 0
          ? Math.round((sunnyDays / totalDaysPassedThisYear) * 100)
          : null;
      setSunSummary({ sunnyDays, totalSunHours, lastSunnyDayDate, lastSunnyDayHours, sunnyDayPercentage });

      // Группировка по месяцам для проверки
      const monthCounts = new Map();
      dailyData.forEach((rain, dayKey) => {
        const month = new Date(dayKey + 'T12:00:00Z').getUTCMonth() + 1;
        monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
      });
      console.log('Days per month:', Object.fromEntries(monthCounts));

      // Initialize monthly data structure - only for months that have data
      const monthlyData = new Map<number, {
        days: Set<string>;
        daysWithRain: Set<string>;
        totalRain: number;
      }>();

      // Calculate monthly statistics from daily data
      dailyData.forEach((rainAmount, dayKey) => {
        const date = new Date(dayKey + 'T12:00:00Z');
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        // Only process data for the target year
        if (year !== targetYear) {
          return;
        }

        // Initialize month data only when we have actual data for it
        if (!monthlyData.has(month)) {
          monthlyData.set(month, {
            days: new Set(),
            daysWithRain: new Set(),
            totalRain: 0
          });
        }

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
        
        // Only add months that actually have data
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
          
          console.log(`Added ${monthNames[month]} with ${totalDays} days of data`);
        } else {
          console.log(`Skipped ${monthNames[month]} - no data (${totalDays} days)`);
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

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchWeatherData(year);
  };

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchWeatherData(selectedYear);
      const interval = setInterval(() => fetchWeatherData(selectedYear), 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [selectedYear]);

  return {
    data,
    loading,
    error,
    availableYears,
    selectedYear,
    yearsLoading,
    yearSummary,
    sunSummary,
    refetch: () => fetchWeatherData(selectedYear || undefined),
    onYearChange: handleYearChange
  };
}
