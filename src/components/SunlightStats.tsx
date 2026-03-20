import React from 'react';
import { Sun, TrendingUp, Clock, Calendar, Sunrise } from 'lucide-react';
import { SunSummary } from '../types/weather';

interface SunlightStatsProps {
  sunSummary: SunSummary;
  selectedYear: number | null;
  loading: boolean;
}

function formatSunDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
  });
}

export function SunlightStats({ sunSummary, selectedYear, loading }: SunlightStatsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center">
          <Sun className="h-6 w-6 text-amber-500 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Sunlight Exposure Stats {loading ? 'Loading...' : selectedYear ?? ''}
            </h3>
            <p className="text-sm text-slate-600">Solar data from Meteo GC 7C Estate</p>
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-50/60 to-yellow-50/60">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
              <Sun className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Sunny Days</p>
              <p className="text-lg font-bold text-slate-800">
                {sunSummary.sunnyDays > 0 ? sunSummary.sunnyDays : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Sunny Day %</p>
              <p className="text-lg font-bold text-slate-800">
                {sunSummary.sunnyDayPercentage !== null ? `${sunSummary.sunnyDayPercentage}%` : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Sun Exposure</p>
              <p className="text-lg font-bold text-slate-800">{sunSummary.totalSunHours} h</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Last Sunny Day</p>
              <p className="text-lg font-bold text-slate-800">
                {sunSummary.lastSunnyDayDate ? formatSunDate(sunSummary.lastSunnyDayDate) : 'No sun yet'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
              <Sunrise className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Exposure on Last Day</p>
              <p className="text-lg font-bold text-slate-800">
                {sunSummary.lastSunnyDayDate ? `${sunSummary.lastSunnyDayHours} h` : '0 h'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
