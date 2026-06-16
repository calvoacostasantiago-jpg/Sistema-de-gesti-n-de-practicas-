import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NoAutorizadoPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-3xl mb-5">
          🚫
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Acceso no autorizado</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          No tienes permiso para acceder a este módulo.
          Esta acción ha sido registrada en la bitácora de auditoría.
        </p>
        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          className="btn-primary"
        >
          {isAuthenticated ? 'Volver al panel' : 'Ir al login'}
        </button>
      </div>
    </div>
  )
}
