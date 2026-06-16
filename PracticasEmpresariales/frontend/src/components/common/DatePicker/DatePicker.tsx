import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DateChangeEvent {
  target: { value: string }
}

interface DatePickerProps {
  value: string | null | undefined
  onChange: (e: DateChangeEvent) => void
  min?: string
  max?: string
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  required?: boolean
  placeholder?: string
  name?: string
  id?: string
}

interface YMD {
  y: number
  m: number
  d: number
}

const PANEL_HEIGHT = 300

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function parseISODate(s?: string | null): YMD | null {
  if (!s) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

function toISODate({ y, m, d }: YMD) {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function toComparable({ y, m, d }: YMD) {
  return y * 10000 + m * 100 + d
}

function getToday(): YMD {
  const t = new Date()
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

function formatDisplay({ y, m, d }: YMD) {
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildGrid(viewY: number, viewM: number) {
  const firstWeekday = (new Date(viewY, viewM - 1, 1).getDay() + 6) % 7
  const totalDays = daysInMonth(viewY, viewM)
  const cells: (YMD & { outside: boolean })[] = []

  for (let i = 0; i < firstWeekday; i++) {
    const dayOffset = firstWeekday - i
    const date = new Date(viewY, viewM - 1, 1 - dayOffset)
    cells.push({ y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), outside: true })
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ y: viewY, m: viewM, d, outside: false })
  }
  let trailing = 1
  while (cells.length < 42) {
    const date = new Date(viewY, viewM, trailing)
    cells.push({ y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), outside: true })
    trailing++
  }
  return cells
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  className = '',
  size = 'md',
  disabled = false,
  required = false,
  placeholder = 'Seleccionar fecha',
  name,
  id,
}: DatePickerProps) {
  const parsedValue = parseISODate(value)
  const today = getToday()
  const minYmd = parseISODate(min)
  const maxYmd = parseISODate(max)

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<{ y: number; m: number }>(
    parsedValue ? { y: parsedValue.y, m: parsedValue.m } : { y: today.y, m: today.m },
  )
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.max(rect.width, 240)
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const spaceBelow = viewportH - rect.bottom
    const openUpward = spaceBelow < PANEL_HEIGHT + 8 && rect.top > PANEL_HEIGHT + 8
    const top = openUpward ? rect.top - PANEL_HEIGHT - 6 : rect.bottom + 6
    let left = rect.left
    if (left + width > viewportW - 8) left = viewportW - width - 8
    if (left < 8) left = 8
    setCoords({ top: Math.max(8, top), left, width })
  }

  const openPanel = () => {
    if (disabled) return
    updateCoords()
    setView(parsedValue ? { y: parsedValue.y, m: parsedValue.m } : { y: today.y, m: today.m })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    updateCoords()
    const onScrollResize = () => updateCoords()
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      openPanel()
    }
  }

  const isDisabledDay = (ymd: YMD) => {
    const c = toComparable(ymd)
    if (minYmd && c < toComparable(minYmd)) return true
    if (maxYmd && c > toComparable(maxYmd)) return true
    return false
  }

  const pickDay = (ymd: YMD) => {
    if (isDisabledDay(ymd)) return
    onChange({ target: { value: toISODate(ymd) } })
    setOpen(false)
    triggerRef.current?.focus()
  }

  const goToday = () => {
    if (isDisabledDay(today)) return
    onChange({ target: { value: toISODate(today) } })
    setOpen(false)
  }

  const changeMonth = (delta: number) => {
    setView(v => {
      let m = v.m + delta
      let y = v.y
      if (m > 12) { m = 1; y++ }
      if (m < 1) { m = 12; y-- }
      return { y, m }
    })
  }

  const cells = buildGrid(view.y, view.m)

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
        className={`glass-trigger w-full ${size === 'sm' ? 'glass-trigger-sm' : ''}`}
      >
        <span className={`truncate ${parsedValue ? 'text-slate-900' : 'text-slate-400'}`}>
          {parsedValue ? formatDisplay(parsedValue) : placeholder}
        </span>
        <svg className="h-4 w-4 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {required && (
        <input
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          required
          disabled={disabled}
          name={name}
          value={value ?? ''}
          onChange={() => {}}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
            className="glass-panel p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-cue-accent/10 hover:text-cue-accent transition-colors"
                aria-label="Mes anterior"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                  <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-xs font-medium text-slate-800 capitalize">
                {MONTHS[view.m - 1]} {view.y}
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-cue-accent/10 hover:text-cue-accent transition-colors"
                aria-label="Mes siguiente"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                  <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 mb-0.5">
              {WEEKDAYS.map(w => (
                <span key={w} className="h-5 flex items-center justify-center text-[10px] font-medium uppercase text-slate-400">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell, i) => {
                const isSelected = !!parsedValue && cell.y === parsedValue.y && cell.m === parsedValue.m && cell.d === parsedValue.d
                const isToday = cell.y === today.y && cell.m === today.m && cell.d === today.d
                const disabledDay = isDisabledDay(cell)
                return (
                  <div key={i} className="flex justify-center">
                    <button
                      type="button"
                      disabled={disabledDay}
                      onClick={() => pickDay(cell)}
                      className={`glass-day ${cell.outside ? 'glass-day-outside' : ''} ${isToday && !isSelected ? 'glass-day-today' : ''} ${
                        isSelected ? 'glass-day-selected' : ''
                      } ${disabledDay ? 'glass-day-disabled' : ''}`}
                    >
                      {cell.d}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={goToday}
                className="text-[11px] font-medium text-cue-accent hover:text-cue-secondary transition-colors"
              >
                Hoy
              </button>
              {!required && value && (
                <button
                  type="button"
                  onClick={() => { onChange({ target: { value: '' } }); setOpen(false) }}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
