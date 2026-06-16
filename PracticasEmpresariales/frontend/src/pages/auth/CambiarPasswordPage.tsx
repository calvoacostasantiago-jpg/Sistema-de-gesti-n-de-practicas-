import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

export default function CambiarPasswordPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    passwordActual: '',
    passwordNueva: '',
    passwordConfirmacion: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.passwordNueva !== form.passwordConfirmacion) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.cambiarPassword(form)
      logout()
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })
        ?.response?.data?.mensaje
      setError(msg ?? 'Error al cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const fieldLabels = {
    passwordActual: 'Contraseña temporal',
    passwordNueva: 'Nueva contraseña',
    passwordConfirmacion: 'Confirmar nueva contraseña',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-cue-primary mb-4 shadow-lg shadow-cue-primary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Cambio de contraseña</h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Hola <strong className="text-slate-700">{user?.nombre}</strong>, debes actualizar tu contraseña temporal antes de continuar.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2.5 mb-4 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(['passwordActual', 'passwordNueva', 'passwordConfirmacion'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {fieldLabels[field]}
                </label>
                <input
                  type="password"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="input-field"
                  required
                  minLength={field !== 'passwordActual' ? 8 : undefined}
                />
              </div>
            ))}

            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 mt-1">
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
