import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { MENUS_POR_ROL } from '../../../constants/menus'
import { ROL_LABELS } from '../../../constants/roles'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  if (!user) return null

  const menuItems = MENUS_POR_ROL[user.rol] ?? []

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 w-60 bg-cue-dark flex flex-col
        transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto lg:shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-indigo-900/50">
        <div>
          <h1 className="text-[13px] font-semibold text-white leading-snug tracking-wide">
            Prácticas Empresariales
          </h1>
          <p className="text-[11px] text-indigo-400 mt-0.5">Univ. Alexander Von Humboldt</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-indigo-400 hover:text-white transition-colors p-1"
          aria-label="Cerrar menú"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User info */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-900/40 border border-indigo-800/40">
          <div className="w-7 h-7 rounded-lg bg-cue-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white truncate leading-tight">{user.nombre}</p>
            <p className="text-[11px] text-indigo-400 truncate mt-0.5">{ROL_LABELS[user.rol]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.ruta}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 ${
                  isActive
                    ? 'bg-cue-accent text-white font-medium shadow-sm shadow-cue-accent/30'
                    : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                }`
              }
            >
              <span className="text-[15px] leading-none">{item.icono}</span>
              <span className="leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-indigo-900/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-indigo-400 hover:bg-indigo-900/40 hover:text-white transition-all duration-150"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
