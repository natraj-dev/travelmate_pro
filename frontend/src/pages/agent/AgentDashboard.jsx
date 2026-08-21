import { useEffect, useState } from 'react'
import { Briefcase, ClipboardList, Users, DollarSign } from 'lucide-react'
import { dashboardApi } from '../../api/business'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency } from '../../utils/format'

export default function AgentDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    dashboardApi.agent().then(setData).catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="card p-10 text-center">
        <Briefcase className="mx-auto text-ink/20 mb-3" size={32} />
        <p className="text-slate text-sm">Register as a travel agent first to see your dashboard.</p>
      </div>
    )
  }

  if (!data) return <Loader full />

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Travel Agent Dashboard</h1>
        <p className="text-slate text-sm mt-1">Track your leads, customers, and commissions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total leads" value={data.total_leads} icon={ClipboardList} accent="ink" />
        <StatCard label="Open leads" value={data.open_leads} icon={Users} accent="gold" />
        <StatCard label="Converted" value={data.converted_customers} icon={Briefcase} accent="success" />
        <StatCard label="Commission earned" value={formatCurrency(data.total_commission_earned)} icon={DollarSign} accent="info" />
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg text-ink mb-4">Recent leads</h3>
        {data.recent_leads.length === 0 ? (
          <p className="text-sm text-slate">No leads yet.</p>
        ) : (
          <div className="space-y-3">
            {data.recent_leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b border-ink/8 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-charcoal">{l.name}</p>
                  <p className="text-xs text-slate">{l.destination || 'No destination set'}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
