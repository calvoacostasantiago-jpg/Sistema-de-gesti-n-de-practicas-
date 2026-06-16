import { ReactNode } from 'react'
import { Button } from '../Button/Button'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  size?: keyof typeof SIZES
}

export function Modal({ title, subtitle, onClose, children, size = 'md' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-xl w-full ${SIZES[size]} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-50 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-500 transition-colors ml-4 text-xl leading-none mt-0.5 hover:bg-slate-50 rounded-lg w-7 h-7 flex items-center justify-center"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── ConfirmModal ─────────────────────────────────────────────────────────── */

export interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex justify-center mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${
          variant === 'danger' ? 'bg-red-50' : 'bg-blue-50'
        }`}>
          {variant === 'danger' ? '⚠️' : '❓'}
        </div>
      </div>
      <p className="text-slate-600 text-sm text-center mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
