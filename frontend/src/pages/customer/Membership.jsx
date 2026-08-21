import { useEffect, useState } from 'react'
import { Crown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { membershipApi } from '../../api/payments'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Membership() {
  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cycle, setCycle] = useState('MONTHLY')
  const [subscribing, setSubscribing] = useState(null)

  useEffect(() => {
    Promise.all([membershipApi.plans(), membershipApi.mine().catch(() => null)])
      .then(([p, m]) => { setPlans(p); setCurrent(m); setLoading(false) })
  }, [])

  const handleSubscribe = async (planId) => {
    setSubscribing(planId)
    try {
      const res = await membershipApi.subscribe({ plan_id: planId, billing_cycle: cycle })
      if (res.checkout_url) window.location.href = res.checkout_url
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) return <Loader full />

  return (
    <div>
      <PageHeader title="Membership" subtitle="Unlock perks like priority support and booking discounts." />

      {current && (
        <div className="ticket p-5 mb-8 flex items-center gap-4">
          <Crown className="text-gold" size={28} />
          <div>
            <p className="font-semibold text-charcoal">You're on the {current.plan?.name} plan</p>
            <p className="text-xs text-slate">Renews {current.renews_at ? new Date(current.renews_at).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="bg-white border border-ink/10 rounded-full p-1 flex">
          {['MONTHLY', 'YEARLY'].map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${cycle === c ? 'bg-ink text-white' : 'text-slate'}`}
            >
              {c === 'MONTHLY' ? 'Monthly' : 'Yearly (save more)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {plans.map((plan) => {
          let benefits = []
          try { benefits = plan.benefits ? JSON.parse(plan.benefits) : [] } catch { /* ignore */ }
          const price = cycle === 'YEARLY' ? plan.price_yearly : plan.price_monthly
          const isCurrent = current?.plan_id === plan.id
          const featured = plan.tier === 'PREMIUM'

          return (
            <div key={plan.id} className={`card p-6 ${featured ? 'ring-2 ring-gold' : ''}`}>
              {featured && <span className="badge-warning mb-3 inline-block">Most popular</span>}
              <h3 className="font-display text-xl text-ink mb-1">{plan.name}</h3>
              <p className="font-mono text-3xl font-semibold text-ink mb-1">{formatCurrency(price)}</p>
              <p className="text-xs text-slate mb-5">per {cycle === 'YEARLY' ? 'year' : 'month'}</p>
              <ul className="space-y-2.5 mb-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-charcoal/80"><Check size={15} className="text-success shrink-0 mt-0.5" /> {b}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || subscribing === plan.id || price === 0}
                className={featured ? 'btn-gold w-full' : 'btn-outline w-full'}
              >
                {isCurrent ? 'Current plan' : price === 0 ? 'Included' : subscribing === plan.id ? 'Redirecting…' : 'Subscribe'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
