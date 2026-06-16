import { createContext, useContext, useState, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export const useToast = () => useContext(ToastContext)

const STYLES: Record<ToastType, string> = {
  success: 'bg-white border border-emerald-100 text-slate-800',
  error:   'bg-white border border-red-100 text-slate-800',
  warning: 'bg-white border border-amber-100 text-slate-800',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  error:   'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-72 max-w-sm ${STYLES[toast.type]}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <p className="text-[13px] flex-1 leading-snug text-slate-700">{toast.message}</p>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 text-lg leading-none mt-0.5">
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
