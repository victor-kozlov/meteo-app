export interface WeatherData {
  month_number: number;
  month_name: string;
  total_days_with_data: number;
  days_with_rain: number;
  total_monthly_rain_mm: number;
}

export interface WeatherStats extends WeatherData {
  rain_percentage: number;
}

export interface YearSummary {
  lastRainDate: string | null;  // 'YYYY-MM-DD', or null if no rain this year
  lastRainAmountMm: number;
}

export interface SunSummary {
  sunnyDays: number;
  totalSunHours: number;
  lastSunnyDayDate: string | null;  // 'YYYY-MM-DD', or null if no sunny days
  lastSunnyDayHours: number;
}