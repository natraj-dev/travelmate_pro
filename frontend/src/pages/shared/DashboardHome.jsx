import { useAuth } from '../../context/AuthContext'
import CustomerDashboard from '../customer/CustomerDashboard'
import HotelManagerDashboard from '../hotelmanager/HotelManagerDashboard'
import TourOperatorDashboard from '../touroperator/TourOperatorDashboard'
import AgentDashboard from '../agent/AgentDashboard'
import AdminDashboard from '../admin/AdminDashboard'

const MAP = {
  CUSTOMER: CustomerDashboard,
  HOTEL_MANAGER: HotelManagerDashboard,
  TOUR_OPERATOR: TourOperatorDashboard,
  TRAVEL_AGENT: AgentDashboard,
  ADMIN: AdminDashboard,
}

export default function DashboardHome() {
  const { user } = useAuth()
  const Component = MAP[user?.role] || CustomerDashboard
  return <Component />
}
