import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft, Building2 } from 'lucide-react'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-slate-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg mb-6">
            <ShieldX className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-slate-600 mr-2" />
            <span className="text-lg font-semibold text-slate-700">Meteo GC 7C Estate</span>
          </div>
        </div>

        {/* Access Denied Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-red-600 mb-3">
              Access Denied!
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              We're sorry, but you don't have permission to access this system. 
              Please check your credentials and try again.
            </p>
          </div>

          {/* Additional Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Authentication Failed:</strong> Invalid email or password. 
              Please contact your system administrator if you believe this is an error.
            </p>
          </div>

          {/* Back to Login Button */}
          <button
            onClick={handleBackToLogin}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Login
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>© 2025 Meteo GC 7C Estate. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}