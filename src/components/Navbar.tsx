import { Link, useLocation } from 'react-router-dom'
import { Map, Users, Ship, PlusCircle, LayoutDashboard, LogIn, LogOut, Anchor } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',       label: 'Ontdek', icon: Anchor },
  { to: '/kaart',  label: 'Kaart',  icon: Map },
  { to: '/crew',   label: 'Crew',   icon: Users },
  { to: '/boten',  label: 'Boten',  icon: Ship },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/">
          <img src="/logo-rond.png" alt="Sail Together" className="h-9 w-9 object-cover rounded-full" />
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === to ? 'bg-ocean-50 text-ocean-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard"
                className={clsx('hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/dashboard' ? 'bg-ocean-50 text-ocean-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link to="/aanbieden"
                className="flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                <PlusCircle size={15} />
                <span className="hidden sm:inline">Aanbieden</span>
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 pl-1">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-ocean-200" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                  <p className="px-3 py-2 text-xs font-medium text-gray-500 truncate">{user.name}</p>
                  <hr className="border-gray-100" />
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <LayoutDashboard size={14} />Mijn advertenties
                  </Link>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={14} />Uitloggen
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/aanbieden"
                className="hidden sm:flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                <PlusCircle size={15} />Aanbieden
              </Link>
              <Link to="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <LogIn size={15} />Inloggen
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex z-50">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className={clsx('flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              pathname === to ? 'text-ocean-600' : 'text-gray-400')}>
            <Icon size={20} />{label}
          </Link>
        ))}
        {user ? (
          <Link to="/dashboard"
            className={clsx('flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              pathname === '/dashboard' ? 'text-ocean-600' : 'text-gray-400')}>
            <LayoutDashboard size={20} />Mijn
          </Link>
        ) : (
          <Link to="/login"
            className={clsx('flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              pathname === '/login' ? 'text-ocean-600' : 'text-gray-400')}>
            <LogIn size={20} />Login
          </Link>
        )}
      </nav>
    </header>
  )
}
