import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, User as UserIcon, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import Avatar from '../common/Avatar'

const ROLE_LABEL = {
  CUSTOMER: 'Customer',
  HOTEL_MANAGER: 'Hotel Manager',
  TOUR_OPERATOR: 'Tour Operator',
  TRAVEL_AGENT: 'Travel Agent',
  ADMIN: 'Administrator',
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink/8">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
        <button className="lg:hidden text-ink" onClick={onMenuClick}>
          <Menu size={22} />
        </button>

        <div className="hidden lg:block">
          <p className="text-sm text-slate">
            {ROLE_LABEL[user?.role] || ''} workspace
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/app/notifications')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-ink hover:bg-ink/5 transition-colors"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-ink/5 transition-colors"
            >
              <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} src={user?.profile_picture_url} size={32} />
              <span className="hidden sm:block text-sm font-medium text-charcoal">{user?.first_name}</span>
              <ChevronDown size={14} className="text-slate" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lifted border border-ink/8 py-1.5 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); navigate('/app/profile') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-sand transition-colors"
                >
                  <UserIcon size={16} /> My Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/app/settings') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-sand transition-colors"
                >
                  <Settings size={16} /> Account Settings
                </button>
                <div className="border-t border-ink/8 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
