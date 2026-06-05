import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Anchor, LayoutDashboard, List, Users, MessageSquare, LogOut, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/admin',          label: 'Overzicht',     icon: LayoutDashboard, end: true },
  { to: '/admin/listings', label: 'Advertenties',  icon: List },
  { to: '/admin/users',    label: 'Gebruikers',    icon: Users },
  { to: '/admin/messages', label: 'Berichten',     icon: MessageSquare },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/') }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/logo-rond.png" alt="Sail Together" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-bold text-lg">Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => clsx(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-ocean-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-0.5 border-t border-gray-700 pt-3">
          <a href="/" target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <ExternalLink size={16} />Naar de app
          </a>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors">
            <LogOut size={16} />Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
