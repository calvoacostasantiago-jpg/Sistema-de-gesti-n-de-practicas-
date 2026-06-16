import { useEffect, useState, useCallback } from 'react'
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
import { sprint4Service } from '../../services/sprint4Service'
import type { TableroGerencialResponse } from '../../types'
import { Select } from '../../components/common/Select/Select'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) { setCount(0); return }
    if (target === 0) { setCount(0); return }
    let current = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(id) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(id)
  }, [target, active, duration])
  return count
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

interface KPICardProps {
  title: string
  value: number
  suffix?: string
  icon: string
  ringColor: string
  textColor: string
  bgColor: string
  loading: boolean
  animated: boolean
}

function KPICard({ title, value, suffix = '', icon, ringColor, textColor, bgColor, loading, animated }: KPICardProps) {
  const count = useCountUp(value, animated)
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${bgColor} ring-1 ${ringColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 leading-tight mb-1">{title}</p>
        {loading
          ? <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
          : <p className={`text-3xl font-bold ${textColor}`}>{count}{suffix}</p>
        }
      </div>
    </div>
  )
}

// Tooltip personalizado para recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0]?.value ?? 0}</p>
    </div>
  )
}

interface HorizontalBarProps {
  label: string
  value: number
  total: number
  pct: number
  animated: boolean
  delay: number
  colorFrom: string
  colorTo: string
}

function HorizontalBar({ label, value, total, pct, animated, delay, colorFrom, colorTo }: HorizontalBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-700 truncate pr-4 max-w-xs">{label}</span>
        <span className="text-sm font-semibold text-slate-900 shrink-0">
          {value}
          <span className="text-xs text-slate-400 font-normal"> / {total}</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorFrom} ${colorTo}`}
          style={{
            width: animated ? `${Math.min(pct, 100)}%` : '0%',
            transition: `width 1000ms ease-out ${delay}ms`,
            background: `linear-gradient(90deg, #4f46e5, #818cf8)`,
          }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-0.5 text-right">{pct}% en curso</p>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-32 flex flex-col items-center justify-center gap-2">
      <span className="text-3xl text-slate-200">📊</span>
      <p className="text-xs text-slate-400 text-center">{message}</p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {[55, 80, 40, 65].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-100 rounded-t-xl animate-pulse" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

const TRIMESTRES = [
  { value: 1, label: 'T1', sublabel: 'Ene – Mar' },
  { value: 2, label: 'T2', sublabel: 'Abr – Jun' },
  { value: 3, label: 'T3', sublabel: 'Jul – Sep' },
  { value: 4, label: 'T4', sublabel: 'Oct – Dic' },
]

const ITEMS_POR_PAGINA = 3

export default function IndicadoresPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQ = Math.ceil((now.getMonth() + 1) / 3)

  const [anio, setAnio] = useState(currentYear)
  const [trimestre, setTrimestre] = useState(currentQ)
  const [tablero, setTablero] = useState<TableroGerencialResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animated, setAnimated] = useState(false)
  const [pagFacultad, setPagFacultad] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setAnimated(false)
    setError('')
    setPagFacultad(0)
    try {
      const data = await sprint4Service.tableroDireccion({ anio, trimestre })
      setTablero(data)
      setTimeout(() => setAnimated(true), 120)
    } catch {
      setError('No se pudieron cargar los indicadores. Verifica que el servidor esté activo.')
    } finally {
      setLoading(false)
    }
  }, [anio, trimestre])

  useEffect(() => { fetchData() }, [fetchData])

  // KPIs
  const totalPracticas  = tablero?.totalPracticasAsignadas ?? 0
  const tasaAprobacion  = tablero?.tasaAprobacionGlobal   ?? 0
  const empresasActivas = tablero?.empresasActivas         ?? 0

  // Gráfica 1: estudiantes aprobados por trimestre
  const aprobadosData = (tablero?.estudiantesAprobadosPorTrimestre ?? []).map(d => ({
    name: d.trimestre,
    value: d.cantidad,
  }))

  // Gráfica 2: empresas nuevas por trimestre
  const empresasNuevasData = (tablero?.empresasNuevasPorTrimestre ?? []).map(d => ({
    name: d.trimestre,
    value: d.cantidad,
  }))

  // Gráfica 3: avance por facultad (preferido) o por programa (fallback)
  const avanceFacultad = tablero?.avancePorFacultad ?? []
  const porPrograma    = Object.entries(tablero?.practicantesEnCursoPorPrograma ?? {})
  const maxPrograma    = porPrograma.reduce((m, [, v]) => Math.max(m, v), 1)

  const hasAvanceFacultad = avanceFacultad.length > 0

  // Datos paginados para la sección de facultad / programa
  const listaCompleta = hasAvanceFacultad
    ? avanceFacultad.map((f, i) => ({ key: f.facultad, label: f.facultad, value: f.enCurso, total: f.total, pct: f.porcentaje, idx: i }))
    : porPrograma.map(([prog, cant], i) => ({ key: prog, label: prog, value: cant, total: maxPrograma, pct: Math.round((cant / maxPrograma) * 100), idx: i }))

  const totalPaginas  = Math.ceil(listaCompleta.length / ITEMS_POR_PAGINA)
  const listaPagina   = listaCompleta.slice(pagFacultad * ITEMS_POR_PAGINA, (pagFacultad + 1) * ITEMS_POR_PAGINA)

  const YEARS = [currentYear - 1, currentYear]

  // Colores para las barras de recharts
  const INDIGO_BARS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc']
  const EMERALD_BARS = ['#059669', '#10b981', '#34d399', '#6ee7b7']

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tablero Gerencial</h1>
          <p className="text-sm text-slate-500 mt-0.5">Indicadores agregados · Filtra el período que necesites</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          {/* Selector de año */}
          <Select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="w-28"
            size="sm"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>

          {/* Selector de trimestre */}
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
        <KPICard
          title="Total de Prácticas Asignadas"
          value={totalPracticas}
          icon="💼"
          bgColor="bg-indigo-50"
          ringColor="ring-indigo-100"
          textColor="text-cue-primary"
          loading={loading}
          animated={animated}
        />
        <KPICard
          title="Tasa de Aprobación Global"
          value={tasaAprobacion}
          suffix="%"
          icon="✅"
          bgColor="bg-emerald-50"
          ringColor="ring-emerald-100"
          textColor="text-emerald-700"
          loading={loading}
          animated={animated}
        />
        <KPICard
          title="Empresas Activas"
          value={empresasActivas}
          icon="🏢"
          bgColor="bg-amber-50"
          ringColor="ring-amber-100"
          textColor="text-amber-700"
          loading={loading}
          animated={animated}
        />
      </div>

      {/* Gráficas de barras: fila de 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Estudiantes aprobados por trimestre */}
        <div className="card">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Estudiantes aprobados</h3>
              <p className="text-xs text-slate-400 mt-0.5">Por trimestre · {anio}</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
              T{trimestre} seleccionado
            </span>
          </div>

          {loading ? <ChartSkeleton /> : aprobadosData.length === 0 ? (
            <EmptyChart message="Sin datos de aprobados para este período" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={aprobadosData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out">
                  {aprobadosData.map((_, i) => (
                    <Cell key={i} fill={INDIGO_BARS[i % INDIGO_BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Empresas nuevas por trimestre */}
        <div className="card">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Empresas nuevas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Por trimestre · {anio}</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
              T{trimestre} seleccionado
            </span>
          </div>

          {loading ? <ChartSkeleton /> : empresasNuevasData.length === 0 ? (
            <EmptyChart message="Sin datos de empresas nuevas para este período" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={empresasNuevasData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out">
                  {empresasNuevasData.map((_, i) => (
                    <Cell key={i} fill={EMERALD_BARS[i % EMERALD_BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Avance de práctica por facultad / programa — con paginador */}
      <div className="card">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Avance de práctica por {hasAvanceFacultad ? 'facultad' : 'programa'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Practicantes en curso — actualización en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cue-accent inline-block" />
            En curso
          </div>
        </div>

        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-10 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : listaCompleta.length === 0 ? (
          <EmptyChart message="Sin datos de avance disponibles" />
        ) : (
          <>
            <div className="space-y-5 min-h-[13rem]">
              {listaPagina.map((item) => (
                <HorizontalBar
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  total={item.total}
                  pct={item.pct}
                  animated={animated}
                  delay={item.idx * 130}
                  colorFrom="from-cue-accent"
                  colorTo="to-indigo-400"
                />
              ))}
            </div>

            {/* Paginador */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-500">
                  Mostrando{' '}
                  <span className="font-medium text-slate-700">
                    {pagFacultad * ITEMS_POR_PAGINA + 1}–{Math.min((pagFacultad + 1) * ITEMS_POR_PAGINA, listaCompleta.length)}
                  </span>{' '}
                  de <span className="font-medium text-slate-700">{listaCompleta.length}</span>{' '}
                  {hasAvanceFacultad ? 'facultades' : 'programas'}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setPagFacultad(p => p - 1); setAnimated(false); setTimeout(() => setAnimated(true), 80) }}
                    disabled={pagFacultad === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    ← Anterior
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setPagFacultad(i); setAnimated(false); setTimeout(() => setAnimated(true), 80) }}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-150 ${
                        pagFacultad === i
                          ? 'bg-cue-accent text-white shadow-sm'
                          : 'border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => { setPagFacultad(p => p + 1); setAnimated(false); setTimeout(() => setAnimated(true), 80) }}
                    disabled={pagFacultad === totalPaginas - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
