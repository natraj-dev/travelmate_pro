import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Compass, Hotel, MapPinned, CalendarCheck, Heart, Route,
  Sparkles, MessageSquare, LifeBuoy, Crown, BedDouble, Users, ClipboardList,
  UserCog, ShieldCheck, ReceiptText, TicketPercent, FileBarChart, BarChart3,
  ScrollText, SlidersHorizontal, Compass as CompassIcon, Briefcase, Plane,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_BY_ROLE = {
  CUSTOMER: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/destinations', label: 'Explore', icon: Compass },
    { to: '/app/bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/app/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/app/itineraries', label: 'Itineraries', icon: Route },
    { to: '/app/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/support', label: 'Support', icon: LifeBuoy },
    { to: '/app/membership', label: 'Membership', icon: Crown },
  ],
  HOTEL_MANAGER: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/my-hotels', label: 'My Hotels', icon: Hotel },
    { to: '/app/hotel-bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/support', label: 'Support', icon: LifeBuoy },
  ],
  TOUR_OPERATOR: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/my-packages', label: 'My Packages', icon: MapPinned },
    { to: '/app/tour-bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/app/guides', label: 'Guides', icon: Users },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/support', label: 'Support', icon: LifeBuoy },
  ],
  TRAVEL_AGENT: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/leads', label: 'Leads', icon: ClipboardList },
    { to: '/app/agent-customers', label: 'Customers', icon: Users },
    { to: '/app/itineraries', label: 'Itineraries', icon: Route },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/support', label: 'Support', icon: LifeBuoy },
  ],
  ADMIN: [
    { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/admin/users', label: 'Users', icon: UserCog },
    { to: '/app/admin/verifications', label: 'Verifications', icon: ShieldCheck },
    { to: '/app/admin/destinations', label: 'Destinations', icon: CompassIcon },
    { to: '/app/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/app/admin/payments', label: 'Payments', icon: ReceiptText },
    { to: '/app/admin/refunds', label: 'Refunds', icon: Briefcase },
    { to: '/app/admin/coupons', label: 'Coupons', icon: TicketPercent },
    { to: '/app/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/app/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/app/admin/settings', label: 'Settings', icon: SlidersHorizontal },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare },
    { to: '/app/support', label: 'Support', icon: LifeBuoy },
  ],
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth()
  const items = NAV_BY_ROLE[user?.role] || []

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-ink/40 z-40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-ink-gradient text-white flex flex-col z-50
          transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 py-6 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Plane size={18} className="text-ink" />
          </div>
          <div>
            <p className="font-display font-semibold text-white leading-tight">TravelMate</p>
            <p className="text-[11px] text-gold-light tracking-widest uppercase">Pro</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/40">
          © {new Date().getFullYear()} TravelMate Pro
        </div>
      </aside>
    </>
  )
}
