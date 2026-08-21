import { Link } from 'react-router-dom'
import { Plane, Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
              <Plane size={16} className="text-ink" />
            </div>
            <p className="font-display font-semibold text-white">TravelMate Pro</p>
          </div>
          <p className="text-sm max-w-xs">Discover destinations, book with confidence, and plan every detail — powered by AI, built for travelers.</p>
          <div className="flex gap-3 mt-4">
            <Facebook size={17} className="hover:text-gold-light cursor-pointer transition-colors" />
            <Instagram size={17} className="hover:text-gold-light cursor-pointer transition-colors" />
            <Twitter size={17} className="hover:text-gold-light cursor-pointer transition-colors" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-light mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link></li>
            <li><Link to="/tours" className="hover:text-white transition-colors">Tours</Link></li>
            <li><Link to="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-light mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/register?role=TOUR_OPERATOR" className="hover:text-white transition-colors">Become an Operator</Link></li>
            <li><Link to="/register?role=HOTEL_MANAGER" className="hover:text-white transition-colors">List Your Hotel</Link></li>
            <li><Link to="/register?role=TRAVEL_AGENT" className="hover:text-white transition-colors">Join as Agent</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-light mb-3">Support</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} TravelMate Pro. All rights reserved.
      </div>
    </footer>
  )
}
