import { useEffect, useState } from 'react'
import { Laptop, Smartphone, LogOut, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/common/PageHeader'
import { timeAgo } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AccountSettings() {
  const { logout } = useAuth()
  const [sessions, setSessions] = useState([])
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authApi.sessions().then(setSessions).catch(() => {})
  }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.changePassword(passwordForm)
      toast.success('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await authApi.revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      toast.success('Session revoked')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const handleLogoutAll = async () => {
    try {
      await authApi.logoutAll()
      toast.success('Logged out from all devices')
      await logout()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Account Settings" subtitle="Manage your password and active sessions." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="font-display text-lg text-ink mb-4 flex items-center gap-2"><KeyRound size={18} /> Change password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="field-label">Current password</label>
              <input type="password" required className="input" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="field-label">New password</label>
              <input type="password" required minLength={8} className="input" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating…' : 'Update password'}</button>
          </form>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink">Active sessions</h3>
            <button onClick={handleLogoutAll} className="text-xs font-semibold text-danger flex items-center gap-1"><LogOut size={13} /> Log out everywhere</button>
          </div>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.device_info?.toLowerCase().includes('mobile') ? <Smartphone size={16} className="text-slate" /> : <Laptop size={16} className="text-slate" />}
                  <div>
                    <p className="text-xs text-charcoal truncate max-w-[220px]">{s.device_info || 'Unknown device'}</p>
                    <p className="text-xs text-slate">Active {timeAgo(s.last_active_at)}</p>
                  </div>
                </div>
                <button onClick={() => handleRevoke(s.id)} className="text-xs font-semibold text-danger">Revoke</button>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-slate">No other active sessions.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
