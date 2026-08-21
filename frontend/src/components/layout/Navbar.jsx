import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Plane } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/hotels', label: 'Hotels' },
  { to: '/tours', label: 'Tours' },
  { to: '/destinations', label: 'Destinations' },
]

export default function Navbar({ transparent = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className={transparent ? 'absolute top-0 left-0 right-0 z-40' : 'sticky top-0 z-40 bg-white border-b border-ink/8'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Plane size={18} className="text-ink" />
          </div>
          <div className="leading-tight">
            <p className={`font-display font-semibold ${transparent ? 'text-white' : 'text-ink'}`}>TravelMate</p>
            <p className="text-[10px] text-gold tracking-widest uppercase -mt-0.5">Pro</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${
                transparent ? 'text-white/85 hover:text-white' : 'text-charcoal hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button className="btn-gold btn-sm" onClick={() => navigate('/app/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium ${transparent ? 'text-white' : 'text-charcoal'}`}>
                Log in
              </Link>
              <Link to="/register" className="btn-gold btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className={`md:hidden ${transparent ? 'text-white' : 'text-ink'}`} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-ink/8 px-4 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium text-charcoal py-1.5">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ink/8 flex flex-col gap-2">
            {user ? (
              <button className="btn-gold" onClick={() => { setOpen(false); navigate('/app/dashboard') }}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline text-center">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-gold text-center">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
