import { useEffect, useState } from 'react'
import { UserCog, Search, Ban, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import Avatar from '../../components/common/Avatar'
import Pagination from '../../components/common/Pagination'
import { formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

const ROLES = ['', 'CUSTOMER', 'HOTEL_MANAGER', 'TOUR_OPERATOR', 'TRAVEL_AGENT', 'ADMIN']

export default function Users() {
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')

  const load = (page = 1) => {
    setLoading(true)
    const params = { page, page_size: 15 }
    if (q) params.q = q
    if (role) params.role = role
    adminApi.users(params).then((res) => { setResult(res); setLoading(false) })
  }
  useEffect(() => load(1), []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) await adminApi.deactivateUser(user.id)
      else await adminApi.activateUser(user.id)
      load(result.page)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage all platform accounts." />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input className="input pl-10" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(1)} />
        </div>
        <select className="select w-full sm:w-56" value={role} onChange={(e) => { setRole(e.target.value); }}>
          {ROLES.map((r) => <option key={r} value={r}>{r || 'All roles'}</option>)}
        </select>
        <button onClick={() => load(1)} className="btn-primary shrink-0">Filter</button>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((u) => (
                  <tr key={u.id} className="border-t border-ink/6">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${u.first_name} ${u.last_name}`} src={u.profile_picture_url} size={30} />
                        <div>
                          <p className="font-semibold text-charcoal">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-slate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge-neutral">{u.role.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-slate">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={u.is_active ? 'badge-success' : 'badge-danger'}>{u.is_active ? 'Active' : 'Deactivated'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleToggleActive(u)} className="text-xs font-semibold text-ink hover:text-gold-dark flex items-center gap-1 ml-auto">
                        {u.is_active ? <><Ban size={13} /> Deactivate</> : <><CheckCircle2 size={13} /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={load} />
        </>
      )}
    </div>
  )
}
