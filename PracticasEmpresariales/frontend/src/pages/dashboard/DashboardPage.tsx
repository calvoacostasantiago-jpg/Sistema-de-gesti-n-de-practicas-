import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { dashboardService } from '../../services/dashboardService'
import type { DashboardResponse } from '../../types'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      const data = await dashboardService.obtener()
      setDashboard(data)
    } catch {
      setError('No se pudo cargar el panel. Verifica que el servidor esté activo.')
    } finally {
      setLoading(false)
    }
  }

  const cargar = () => {
    setError(null)
    setLoading(true)
    fetchDashboard()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar() }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-32 bg-slate-100 rounded mb-4" />
              <div className="h-8 w-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium text-sm">{error}</p>
          <button
            onClick={cargar}
            className="mt-4 btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {dashboard?.titulo ?? 'Panel de Inicio'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Bienvenido/a, <span className="font-medium text-slate-700">{user?.nombre}</span>
        </p>
      </div>

      {/* Secciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard?.secciones?.map((seccion) => (
          <button
            key={seccion.id}
            onClick={() => navigate(seccion.ruta)}
            className="card text-left hover:shadow-md hover:border-indigo-100 transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-700 group-hover:text-cue-accent transition-colors truncate">
                  {seccion.titulo}
                </h3>
                <p className={`text-3xl font-bold mt-3 ${seccion.contador > 0 ? 'text-red-500' : 'text-cue-accent'}`}>
                  {seccion.contador}
                </p>
                <p className={`text-xs mt-1 ${seccion.contador > 0 ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                  {seccion.contador === 0 ? 'Sin registros' : 'Requiere atención'}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-slate-300 group-hover:text-cue-accent transition-colors shrink-0 mt-0.5 ml-3"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
