import React from 'react';
import { Thermometer } from 'lucide-react';
import { useTemperatureData } from '../hooks/useTemperatureData';
import { TemperatureChart } from './TemperatureChart';

export function TemperatureSection() {
  const { data, loading, error } = useTemperatureData();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-rose-50 to-blue-50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center">
            <Thermometer className="h-6 w-6 text-rose-500 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Last 14 days rolling temperature graph
              </h3>
              <p className="text-sm text-slate-600">
                Daily min &amp; max air temperature · Rolling 14-day window
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">Max Temp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Min Temp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            Loading temperature data…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <TemperatureChart data={data} />
        )}
      </div>
    </div>
  );
}
