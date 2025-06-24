import React, { useState } from 'react';
import { ChevronUp, ChevronDown, RefreshCw, AlertCircle, Droplets, Calendar, TrendingUp } from 'lucide-react';
import { WeatherStats } from '../types/weather';
import { LoadingSpinner } from './LoadingSpinner';

interface WeatherTableProps {
  data: WeatherStats[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

type SortField = 'month_number' | 'total_days_with_data' | 'days_with_rain' | 'total_monthly_rain_mm' | 'rain_percentage';
type SortDirection = 'asc' | 'desc';

export function WeatherTable({ data, loading, error, onRefresh }: WeatherTableProps) {
  const [sortField, setSortField] = useState<SortField>('month_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    const numA = Number(aValue);
    const numB = Number(bValue);
    
    return sortDirection === 'asc' ? numA - numB : numB - numA;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const totalRainfall = data.reduce((sum, row) => sum + row.total_monthly_rain_mm, 0);
  const totalDaysWithRain = data.reduce((sum, row) => sum + row.days_with_rain, 0);
  const totalDaysWithData = data.reduce((sum, row) => sum + row.total_days_with_data, 0);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 text-lg">Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Data</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Droplets className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Weather Data</h3>
            <p className="text-slate-600">No weather data available for 2025.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Droplets className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Monthly Rainfall Statistics 2025</h3>
              <p className="text-sm text-slate-600">Weather data from Meteo GC 7C Estate</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg font-medium transition-colors duration-200 border border-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Rainfall</p>
              <p className="text-lg font-bold text-slate-800">{totalRainfall.toFixed(1)} mm</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Rainy Days</p>
              <p className="text-lg font-bold text-slate-800">{totalDaysWithRain}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Rain Frequency</p>
              <p className="text-lg font-bold text-slate-800">
                {totalDaysWithData > 0 ? ((totalDaysWithRain / totalDaysWithData) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100/80 sticky top-0 z-10">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors duration-200"
                onClick={() => handleSort('month_number')}
              >
                <div className="flex items-center">
                  Month
                  <SortIcon field="month_number" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors duration-200"
                onClick={() => handleSort('total_days_with_data')}
              >
                <div className="flex items-center justify-end">
                  Days with Data
                  <SortIcon field="total_days_with_data" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors duration-200"
                onClick={() => handleSort('days_with_rain')}
              >
                <div className="flex items-center justify-end">
                  Rainy Days
                  <SortIcon field="days_with_rain" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors duration-200"
                onClick={() => handleSort('total_monthly_rain_mm')}
              >
                <div className="flex items-center justify-end">
                  Total Rainfall (mm)
                  <SortIcon field="total_monthly_rain_mm" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors duration-200"
                onClick={() => handleSort('rain_percentage')}
              >
                <div className="flex items-center justify-end">
                  Rain Percentage
                  <SortIcon field="rain_percentage" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50">
            {sortedData.map((row, index) => (
              <tr 
                key={row.month_number}
                className={`hover:bg-slate-50/50 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                }`}
              >
                <td className="px-6 py-4 text-sm font-medium text-slate-800">
                  {row.month_name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right font-mono">
                  {row.total_days_with_data}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right font-mono">
                  {row.days_with_rain}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right font-mono">
                  {row.total_monthly_rain_mm.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right font-mono">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-2 bg-blue-200 rounded-full mr-2 overflow-hidden"
                      >
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(row.rain_percentage, 100)}%` }}
                        />
                      </div>
                      {row.rain_percentage.toFixed(1)}%
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-200/50">
        <p className="text-xs text-slate-500 text-center">
          Data automatically refreshes every 60 minutes • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}