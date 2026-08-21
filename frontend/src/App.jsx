import { Routes, Route } from 'react-router-dom'

import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import GuestRoute from './routes/GuestRoute'

// Public pages
import Home from './pages/public/Home'
import HotelSearchPage from './pages/public/HotelSearchPage'
import HotelDetailsPage from './pages/public/HotelDetailsPage'
import TourSearchPage from './pages/public/TourSearchPage'
import TourDetailsPage from './pages/public/TourDetailsPage'
import DestinationsPage from './pages/public/DestinationsPage'
import DestinationDetailsPage from './pages/public/DestinationDetailsPage'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

// Shared (all authenticated roles)
import DashboardHome from './pages/shared/DashboardHome'
import Profile from './pages/shared/Profile'
import AccountSettings from './pages/shared/AccountSettings'
import Notifications from './pages/shared/Notifications'
import Messages from './pages/shared/Messages'
import Support from './pages/shared/Support'

// Customer
import BookHotelPage from './pages/customer/BookHotelPage'
import BookTourPage from './pages/customer/BookTourPage'
import PaymentSuccess from './pages/customer/PaymentSuccess'
import PaymentCancel from './pages/customer/PaymentCancel'
import MyBookings from './pages/customer/MyBookings'
import Wishlist from './pages/customer/Wishlist'
import Itineraries from './pages/customer/Itineraries'
import ItineraryDetail from './pages/customer/ItineraryDetail'
import AIAssistant from './pages/customer/AIAssistant'
import Membership from './pages/customer/Membership'
import MembershipConfirm from './pages/customer/MembershipConfirm'

// Hotel manager
import MyHotels from './pages/hotelmanager/MyHotels'
import HotelBookings from './pages/hotelmanager/HotelBookings'

// Tour operator
import MyPackages from './pages/touroperator/MyPackages'
import TourBookings from './pages/touroperator/TourBookings'
import Guides from './pages/touroperator/Guides'

// Travel agent
import Leads from './pages/agent/Leads'
import AgentCustomers from './pages/agent/AgentCustomers'

// Admin
import Users from './pages/admin/Users'
import Verifications from './pages/admin/Verifications'
import AdminDestinations from './pages/admin/AdminDestinations'
import AdminBookings from './pages/admin/AdminBookings'
import AdminPayments from './pages/admin/AdminPayments'
import AdminRefunds from './pages/admin/AdminRefunds'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminReports from './pages/admin/AdminReports'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminSettings from './pages/admin/AdminSettings'
import AdminSupport from './pages/admin/AdminSupport'


function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-6xl text-ink/15 mb-2">404</p>
      <p className="text-slate">This page doesn't exist.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public marketing / browse pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<HotelSearchPage />} />
        <Route path="/hotels/:id" element={<HotelDetailsPage />} />
        <Route path="/tours" element={<TourSearchPage />} />
        <Route path="/tours/:id" element={<TourDetailsPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:id" element={<DestinationDetailsPage />} />
      </Route>

      {/* Auth (guest-only) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Standalone protected flows (checkout, payment results) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/book/hotel/:id" element={<BookHotelPage />} />
        <Route path="/book/tour/:id" element={<BookTourPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/membership/confirm" element={<MembershipConfirm />} />
      </Route>

      {/* Authenticated dashboard workspace */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="support" element={<Support />} />

          {/* Customer */}
          <Route path="bookings" element={<MyBookings />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="itineraries" element={<Itineraries />} />
          <Route path="itineraries/:id" element={<ItineraryDetail />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="membership" element={<Membership />} />

          {/* Hotel manager */}
          <Route element={<ProtectedRoute allowedRoles={['HOTEL_MANAGER', 'ADMIN']} />}>
            <Route path="my-hotels" element={<MyHotels />} />
            <Route path="hotel-bookings" element={<HotelBookings />} />
          </Route>

          {/* Tour operator */}
          <Route element={<ProtectedRoute allowedRoles={['TOUR_OPERATOR', 'ADMIN']} />}>
            <Route path="my-packages" element={<MyPackages />} />
            <Route path="tour-bookings" element={<TourBookings />} />
            <Route path="guides" element={<Guides />} />
          </Route>

          {/* Travel agent */}
          <Route element={<ProtectedRoute allowedRoles={['TRAVEL_AGENT', 'ADMIN']} />}>
            <Route path="leads" element={<Leads />} />
            <Route path="agent-customers" element={<AgentCustomers />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="admin/users" element={<Users />} />
            <Route path="admin/verifications" element={<Verifications />} />
            <Route path="admin/destinations" element={<AdminDestinations />} />
            <Route path="admin/bookings" element={<AdminBookings />} />
            <Route path="admin/payments" element={<AdminPayments />} />
            <Route path="admin/refunds" element={<AdminRefunds />} />
            <Route path="admin/coupons" element={<AdminCoupons />} />
            <Route path="admin/reports" element={<AdminReports />} />
            <Route path="admin/analytics" element={<AdminAnalytics />} />
            <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/support" element={<AdminSupport />} />

          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
