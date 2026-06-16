import {
  Children,
  isValidElement,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

interface SelectChangeEvent {
  target: { value: string }
}

interface SelectProps {
  value: string | number | null | undefined
  onChange: (e: SelectChangeEvent) => void
  children: ReactNode
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
}

interface ParsedOption {
  value: string
  label: ReactNode
  disabled: boolean
}

function parseOptions(children: ReactNode): ParsedOption[] {
  return Children.toArray(children)
    .filter((child): child is ReactElement<any> => isValidElement(child))
    .map(child => ({
      value: String(child.props.value ?? ''),
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
    }))
}

export function Select({
  value,
  onChange,
  children,
  className = '',
  size = 'md',
  disabled = false,
  required = false,
  name,
  id,
}: SelectProps) {
  const options = useMemo(() => parseOptions(children), [children])
  const stringValue = String(value ?? '')
  const selected = options.find(o => o.value === stringValue)

  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width })
  }

  const openPanel = () => {
    if (disabled) return
    updateCoords()
    setHighlighted(Math.max(0, options.findIndex(o => o.value === stringValue)))
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

  const selectOption = (opt: ParsedOption) => {
    if (opt.disabled) return
    onChange({ target: { value: opt.value } })
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      openPanel()
      return
    }
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted(h => Math.min(options.length - 1, h + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted(h => Math.max(0, h - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const opt = options[highlighted]
        if (opt) selectOption(opt)
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
        className={`glass-trigger w-full ${size === 'sm' ? 'glass-trigger-sm' : ''}`}
      >
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? selected.label : ' '}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {required && (
        <select
          tabIndex={-1}
          aria-hidden="true"
          required
          disabled={disabled}
          name={name}
          value={stringValue}
          onChange={() => {}}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {typeof o.label === 'string' ? o.label : o.value}
            </option>
          ))}
        </select>
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
            className="glass-panel max-h-64 overflow-y-auto p-1.5"
          >
            {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Sin opciones</p>}
            {options.map((opt, i) => (
              <div
                key={opt.value + '-' + i}
                role="option"
                aria-selected={opt.value === stringValue}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => selectOption(opt)}
                className={`glass-option ${opt.value === stringValue ? 'glass-option-selected' : ''} ${
                  highlighted === i && opt.value !== stringValue ? 'bg-slate-100/80' : ''
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === stringValue && (
                  <svg className="h-4 w-4 text-cue-accent shrink-0" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10.5l3 3 7-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
