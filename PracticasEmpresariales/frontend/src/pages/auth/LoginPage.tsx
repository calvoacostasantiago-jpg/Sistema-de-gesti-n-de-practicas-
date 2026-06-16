import { useState, FormEvent, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type Paso = 'credenciales' | 'verificacion'

export default function LoginPage() {
  const { iniciarLogin, verificarCodigo, loading } = useAuth()
  const navigate = useNavigate()

  const [paso, setPaso] = useState<Paso>('credenciales')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [correoConfirmado, setCorreoConfirmado] = useState('')
  const [digitos, setDigitos] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState(600)
  const [contadorIniciado, setContadorIniciado] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const iniciarContador = (segundos: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const total = segundos > 0 ? segundos : 600
    setTiempoRestante(total)
    setContadorIniciado(true)
    intervalRef.current = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60)
    const seg = s % 60
    return `${m}:${seg.toString().padStart(2, '0')}`
  }

  const handleCredenciales = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await iniciarLogin(correo, password)
      setCorreoConfirmado(res.correo)
      setDigitos(['', '', '', '', '', ''])
      iniciarContador(res.expiresInSeconds)
      setPaso('verificacion')
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })
        ?.response?.data?.mensaje
      setError(msg ?? 'Credenciales incorrectas o cuenta inactiva.')
    }
  }

  const handleDigitoChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const nuevo = [...digitos]
    nuevo[index] = value
    setDigitos(nuevo)
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleDigitoKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const texto = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!texto) return
    const nuevo = [...digitos]
    for (let i = 0; i < 6; i++) nuevo[i] = texto[i] ?? ''
    setDigitos(nuevo)
    const siguienteVacio = Math.min(texto.length, 5)
    inputsRef.current[siguienteVacio]?.focus()
  }

  const handleVerificacion = async (e: FormEvent) => {
    e.preventDefault()
    const codigo = digitos.join('')
    if (codigo.length < 6) {
      setError('Ingresa los 6 dígitos del código.')
      return
    }
    setError('')
    try {
      await verificarCodigo(correoConfirmado, codigo)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })
        ?.response?.data?.mensaje
      setError(msg ?? 'Código incorrecto o expirado.')
      setDigitos(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
  }

  const volverACredenciales = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setContadorIniciado(false)
    setPaso('credenciales')
    setError('')
    setDigitos(['', '', '', '', '', ''])
  }

  const reenviarCodigo = async () => {
    setError('')
    try {
      const res = await iniciarLogin(correo, password)
      setDigitos(['', '', '', '', '', ''])
      iniciarContador(res.expiresInSeconds)
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } catch {
      setError('No se pudo reenviar el código. Vuelve a iniciar sesión.')
    }
  }

  const codigoExpirado = contadorIniciado && tiempoRestante === 0

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-cue-primary mb-4 shadow-lg shadow-cue-primary/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Sistema de Prácticas</h1>
          <p className="text-sm text-slate-500 mt-1">Universidad Alexander Von Humboldt</p>
        </div>

        {/* Card con hover glow indigo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6
                        transition-shadow duration-500
                        hover:shadow-[0_0_50px_-8px_rgba(99,102,241,0.45)]">

          {/* ── PASO 1: Credenciales ── */}
          {paso === 'credenciales' && (
            <>
              <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Iniciar sesión</h2>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2.5 mb-4 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleCredenciales} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    className="input-field"
                    placeholder="usuario@cue.edu.co"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 flex items-center justify-center mt-1"
                >
                  {loading
                    ? <><span className="animate-spin mr-2">⟳</span>Verificando...</>
                    : 'Continuar'}
                </button>
              </form>

              <p className="text-xs text-slate-400 mt-5 text-center leading-relaxed">
                ¿Olvidaste tu contraseña?<br />Contacta al Administrador DTI.
              </p>
            </>
          )}

          {/* ── PASO 2: Verificación 2FA ── */}
          {paso === 'verificacion' && (
            <>
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 mb-3">
                  <svg style={{ width: '18px', height: '18px' }} className="text-cue-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-semibold text-slate-900">Verificación</h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Código enviado a{' '}
                  <span className="font-medium text-slate-700 break-all">{correoConfirmado}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2.5 mb-4 text-xs text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerificacion}>
                <div className="flex justify-center gap-2 mb-5">
                  {digitos.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputsRef.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitoChange(i, e.target.value)}
                      onKeyDown={e => handleDigitoKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      onFocus={e => e.target.select()}
                      className={`
                        w-10 h-12 text-center text-lg font-semibold
                        border-2 rounded-xl outline-none transition-all duration-150
                        ${d
                          ? 'border-cue-accent bg-indigo-50 text-cue-accent'
                          : 'border-slate-200 bg-slate-50 text-slate-900'}
                        focus:border-cue-accent focus:bg-white focus:shadow-sm
                      `}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || digitos.join('').length < 6 || codigoExpirado}
                  className="w-full btn-primary py-2.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><span className="animate-spin mr-2">⟳</span>Verificando...</>
                    : 'Confirmar acceso'}
                </button>
              </form>

              <div className="mt-4 text-center">
                {contadorIniciado && (
                  codigoExpirado
                    ? <p className="text-xs text-red-500 font-medium">El código ha expirado.</p>
                    : <p className="text-xs text-slate-500">
                        Expira en{' '}
                        <span className="font-semibold text-slate-700">{formatTiempo(tiempoRestante)}</span>
                      </p>
                )}

                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={reenviarCodigo}
                    disabled={loading}
                    className="text-xs text-cue-accent hover:underline font-medium disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    type="button"
                    onClick={volverACredenciales}
                    className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    ← Volver
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
