import { useEffect, useState } from 'react'
import { ShieldCheck, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { hotelApi } from '../../api/hotels'
import { operatorApi } from '../../api/tours'
import { agentApi } from '../../api/business'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Verifications() {
  const [tab, setTab] = useState('hotels')
  const [hotels, setHotels] = useState([])
  const [operators, setOperators] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      hotelApi.list({ verification_status: 'PENDING', page_size: 50 }),
      operatorApi.list({ verification_status: 'PENDING', page_size: 50 }),
      agentApi.list({ verification_status: 'PENDING', page_size: 50 }),
    ]).then(([h, o, a]) => {
      setHotels(h.items)
      setOperators(o.items)
      setAgents(a.items)
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleVerify = async (type, id, status) => {
    try {
      if (type === 'hotel') await hotelApi.verify(id, status)
      if (type === 'operator') await operatorApi.verify(id, status)
      if (type === 'agent') await agentApi.verify(id, status)
      toast.success(`${status === 'APPROVED' ? 'Approved' : 'Rejected'}`)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const tabs = [
    { value: 'hotels', label: 'Hotels', count: hotels.length },
    { value: 'operators', label: 'Tour Operators', count: operators.length },
    { value: 'agents', label: 'Travel Agents', count: agents.length },
  ]

  const renderRow = (type, item, name, sub) => (
    <div key={item.id} className="card p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-sm text-charcoal">{name}</p>
        <p className="text-xs text-slate">{sub}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => handleVerify(type, item.id, 'REJECTED')} className="btn-outline btn-sm text-danger border-danger/20"><X size={13} /> Reject</button>
        <button onClick={() => handleVerify(type, item.id, 'APPROVED')} className="btn-gold btn-sm"><Check size={13} /> Approve</button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Verifications" subtitle="Approve or reject pending hotel, operator, and agent applications." />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {loading ? <Loader /> : (
        <div className="space-y-3">
          {tab === 'hotels' && (hotels.length === 0 ? <EmptyState icon={ShieldCheck} title="No pending hotels" /> :
            hotels.map((h) => renderRow('hotel', h, h.name, `${h.city}, ${h.country}`)))}
          {tab === 'operators' && (operators.length === 0 ? <EmptyState icon={ShieldCheck} title="No pending operators" /> :
            operators.map((o) => renderRow('operator', o, o.company_name, o.license_number || 'No license number provided')))}
          {tab === 'agents' && (agents.length === 0 ? <EmptyState icon={ShieldCheck} title="No pending agents" /> :
            agents.map((a) => renderRow('agent', a, a.agency_name || 'Unnamed agency', `${a.commission_rate_percent}% commission rate`)))}
        </div>
      )}
    </div>
  )
}
