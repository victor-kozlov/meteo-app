import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherStats } from '../types/weather';

export function useWeatherData() {
  const [data, setData] = useState<WeatherStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearsFetched, setYearsFetched] = useState(false);

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
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(targetYear, month - 1, 1);
        const endDate = new Date(targetYear, month, 1);
        
        monthsToFetch.push({
          start: startDate.toISOString().substring(0, 10),
          end: endDate.toISOString().substring(0, 10),
          name: startDate.toLocaleString('en-US', { month: 'long' })
        });
      }

      for (const month of monthsToFetch) {
        console.log(`Fetching ${month.name} ${targetYear}...`);
        
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
          console.log(`${month.name} ${targetYear}: ${monthData.length} records`);
          allRawData.push(...monthData);
        } else {
          console.log(`${month.name} ${targetYear}: No data`);
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
    refetch: () => fetchWeatherData(selectedYear || undefined),
    onYearChange: handleYearChange
  };
}
