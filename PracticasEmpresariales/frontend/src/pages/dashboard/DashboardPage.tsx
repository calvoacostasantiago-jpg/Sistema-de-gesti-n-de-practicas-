import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { dashboardService } from '../../services/dashboardService'
import { sprint4Service } from '../../services/sprint4Service'
import type { DashboardResponse, TableroGerencialResponse } from '../../types'
import { useNavigate } from 'react-router-dom'
import { Select } from '../../components/common/Select/Select'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const TRIMESTRES = [
  { value: 1, label: 'T1', sublabel: 'Ene–Mar' },
  { value: 2, label: 'T2', sublabel: 'Abr–Jun' },
  { value: 3, label: 'T3', sublabel: 'Jul–Sep' },
  { value: 4, label: 'T4', sublabel: 'Oct–Dic' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0]?.value ?? 0}</p>
    </div>
  )
}

function CircularGauge({ value, animated }: { value: number; animated: boolean }) {
  const radius = 65
  const circumference = 2 * Math.PI * radius
  const dashOffset = animated
    ? circumference - (Math.min(value, 100) / 100) * circumference
    : circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="85" cy="85" r={radius}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 85 85)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        <text x="85" y="85" textAnchor="middle" dominantBaseline="central" fontSize="30" fontWeight="700" fill="#1e293b">
          {value}%
        </text>
        <text x="85" y="108" textAnchor="middle" fontSize="11" fill="#94a3b8">
          aprobación global
        </text>
      </svg>
      <p className="text-xs text-slate-500 font-medium">Tasa de Aprobación</p>
    </div>
  )
}

/* ─── Vista de Dirección ───────────────────────────────────────────────────── */

function DireccionDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQ = Math.ceil((now.getMonth() + 1) / 3)

  const [anio, setAnio] = useState(currentYear)
  const [trimestre, setTrimestre] = useState(currentQ)
  const [tablero, setTablero] = useState<TableroGerencialResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setAnimated(false)
    setError('')
    try {
      const data = await sprint4Service.tableroDireccion({ anio, trimestre })
      setTablero(data)
      setTimeout(() => setAnimated(true), 150)
    } catch {
      setError('No se pudieron cargar los indicadores. Verifica que el servidor esté activo.')
    } finally {
      setLoading(false)
    }
  }, [anio, trimestre])

  useEffect(() => { fetchData() }, [fetchData])

  const YEARS = [currentYear - 1, currentYear]
  const totalPracticas = tablero?.totalPracticasAsignadas ?? 0
  const tasaAprobacion = tablero?.tasaAprobacionGlobal ?? 0
  const empresasActivas = tablero?.empresasActivas ?? 0

  const aprobadosData = (tablero?.estudiantesAprobadosPorTrimestre ?? []).map(d => ({
    name: d.trimestre,
    value: d.cantidad,
  }))

  const BARS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc']

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Panel Gerencial</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bienvenido/a,{' '}
            <span className="font-medium text-slate-700">{user?.nombre}</span>
            {' · '}vista ejecutiva
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <Select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="w-28"
            size="sm"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>

          <div className="flex gap-1.5">
            {TRIMESTRES.map(t => (
              <button
                key={t.value}
                onClick={() => setTrimestre(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  trimestre === t.value
                    ? 'bg-cue-accent text-white shadow-sm shadow-cue-accent/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200'
                }`}
              >
                <span className="block">{t.label}</span>
                <span className="block text-[10px] font-normal opacity-75">{t.sublabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="card flex items-start gap-4 animate-pulse">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-28 bg-slate-100 rounded" />
                <div className="h-8 w-16 bg-slate-100 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-indigo-50 ring-1 ring-indigo-100">
                💼
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight mb-1">Prácticas Asignadas</p>
                <p className="text-3xl font-bold text-cue-primary">{totalPracticas}</p>
              </div>
            </div>

            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-emerald-50 ring-1 ring-emerald-100">
                ✅
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight mb-1">Tasa de Aprobación</p>
                <p className="text-3xl font-bold text-emerald-700">{tasaAprobacion}%</p>
              </div>
            </div>

            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-amber-50 ring-1 ring-amber-100">
                🏢
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight mb-1">Empresas Activas</p>
                <p className="text-3xl font-bold text-amber-700">{empresasActivas}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gauge circular: tasa de aprobación */}
        <div className="card flex flex-col items-center justify-center py-8 min-h-[16rem]">
          {loading ? (
            <div className="w-40 h-40 rounded-full bg-slate-100 animate-pulse" />
          ) : (
            <CircularGauge value={tasaAprobacion} animated={animated} />
          )}
        </div>

        {/* BarChart: aprobados por trimestre */}
        <div className="card min-h-[16rem]">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Estudiantes aprobados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Por trimestre · {anio}</p>
          </div>

          {loading ? (
            <div className="flex items-end gap-3 h-40 pt-4">
              {[55, 80, 40, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-xl animate-pulse" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : aprobadosData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl text-slate-200">📊</span>
              <p className="text-xs text-slate-400 text-center">Sin datos para este período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={aprobadosData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {aprobadosData.map((_, i) => (
                    <Cell key={i} fill={BARS[i % BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CTA: ver indicadores completos */}
      <button
        onClick={() => navigate('/indicadores')}
        className="w-full card text-left hover:shadow-md hover:border-indigo-100 transition-all duration-150 group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 group-hover:text-cue-accent transition-colors">
              Ver indicadores completos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Avance por facultad, empresas nuevas y métricas detalladas por período
            </p>
          </div>
          <svg
            className="w-5 h-5 text-slate-300 group-hover:text-cue-accent transition-colors shrink-0 ml-4"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  )
}

/* ─── Vista genérica (todos los demás roles) ───────────────────────────────── */

function GenericDashboard() {
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
          <button onClick={cargar} className="mt-4 btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {dashboard?.titulo ?? 'Panel de Inicio'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Bienvenido/a, <span className="font-medium text-slate-700">{user?.nombre}</span>
        </p>
      </div>

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

/* ─── Exportación principal ────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.rol === 'DIRECCION') {
    return <DireccionDashboard />
  }

  return <GenericDashboard />
}
