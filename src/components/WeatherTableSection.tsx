import React from 'react';
import { CalendarDays, CalendarClock, CloudRain, Droplets } from 'lucide-react';
import { useWeatherTableData } from '../hooks/useWeatherTableData';
import { stationToday } from '../lib/stationTime';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDaysSince(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Today';
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function StatTile({ icon, iconBg, label, value }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mr-3`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function WeatherTableSection() {
  const { data, summary, loading, error } = useWeatherTableData();
  const today = stationToday();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center mb-1">
        <CalendarDays className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
        <h2 className="text-xl font-bold text-slate-800">Last 14 days weather summary</h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">Daily aggregates · Rolling 14-day window</p>

      {loading && (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      )}

      {error && (
        <div className="text-red-500 text-sm py-4">{error}</div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-slate-400 text-sm py-8 text-center">
          No data available for the last 14 days
        </div>
      )}

      {!loading && !error && data.length > 0 && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-4 mb-5 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/50">
          <StatTile
            icon={<CloudRain className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Rainfall, Last 7 Days"
            value={`${summary.rain7dMm.toFixed(1)} mm`}
          />
          <StatTile
            icon={<CalendarClock className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100"
            label="Days Since Last Rain"
            value={formatDaysSince(summary.daysSinceRain)}
          />
          <StatTile
            icon={<Droplets className="h-5 w-5 text-cyan-600" />}
            iconBg="bg-cyan-100"
            label="Avg Humidity, Last 7 Days"
            value={summary.avgHumidity7d === null ? '—' : `${Math.round(summary.avgHumidity7d)}%`}
          />
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-200/90 to-slate-150 border-b-2 border-slate-300">
                <th className="text-left py-3 px-3 font-semibold text-slate-700 rounded-tl-lg">Date</th>
                <th className="text-center py-3 px-3 font-semibold text-blue-700">Min Temp</th>
                <th className="text-center py-3 px-3 font-semibold text-red-600">Max Temp</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700">Rainfall</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700 rounded-tr-lg">Sun Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isToday = row.date === today;
                return (
                  <tr
                    key={row.date}
                    className={`border-b border-slate-100 ${
                      isToday
                        ? 'bg-blue-50/60'
                        : i % 2 === 1
                        ? 'bg-gray-50/50'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-left font-medium text-slate-700">
                      {formatDate(row.date)}
                      {isToday && (
                        <span className="ml-2 text-xs text-blue-500 font-normal">today</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-blue-600 font-medium">
                      {row.min_temp.toFixed(1)}°C
                    </td>
                    <td className="py-2 px-3 text-center text-red-500 font-medium">
                      {row.max_temp.toFixed(1)}°C
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {row.rainfall_mm === 0 ? '—' : `${row.rainfall_mm} mm`}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {row.sun_hours === 0 ? '—' : `${row.sun_hours} h`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
