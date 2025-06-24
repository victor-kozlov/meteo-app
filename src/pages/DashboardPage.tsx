import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, LogOut, User, Droplets } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { WeatherTable } from '../components/WeatherTable'
import { useWeatherData } from '../hooks/useWeatherData'

export function DashboardPage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { data, loading, error, refetch } = useWeatherData()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md mr-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Meteo GC 7C Estate</h1>
                <p className="text-sm text-slate-600">Weather Monitoring System</p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center text-sm text-slate-600">
                <User className="h-4 w-4 mr-2" />
                {user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-4">
              <Droplets className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-4xl font-bold text-slate-800">Weather Dashboard</h2>
                <p className="text-slate-600 text-lg mt-2">
                  Monitor rainfall patterns and weather statistics for Meteo GC 7C Estate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Data Table */}
        <WeatherTable 
          data={data}
          loading={loading}
          error={error}
          onRefresh={refetch}
        />
      </main>
    </div>
  )
}