import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/common/Loader'

/** Redirects already-authenticated users away from login/register pages. */
export default function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Loader full />
  if (user) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
