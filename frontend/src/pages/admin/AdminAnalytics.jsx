import { useEffect, useState } from 'react'
import { BarChart3, Sparkles } from 'lucide-react'
import RevenueBarChart from '../../components/charts/RevenueBarChart'
import SeasonalDemandChart from '../../components/charts/SeasonalDemandChart'
import toast from 'react-hot-toast'
import { analyticsApi } from '../../api/admin'
import { aiInsightApi } from '../../api/ai'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import { apiErrorMessage } from '../../api/axiosClient'

const INSIGHT_TYPES = ['REVENUE_FORECAST', 'DEMAND_PREDICTION', 'RETENTION', 'PACKAGE_PERFORMANCE']

export default function AdminAnalytics() {
  const [trend, setTrend] = useState([])
  const [seasonal, setSeasonal] = useState({})
  const [insights, setInsights] = useState([])
  const [generating, setGenerating] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      analyticsApi.revenueTrend(60),
      analyticsApi.seasonalDemand(),
      aiInsightApi.list().catch(() => []),
    ]).then(([t, s, i]) => {
      setTrend(t)
      setSeasonal(s.monthly_demand || {})
      setInsights(i)
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleGenerateInsight = async (type) => {
    setGenerating(type)
    try {
      await aiInsightApi.generate(type)
      toast.success('Insight generated')
      const i = await aiInsightApi.list()
      setInsights(i)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'AI insight generation failed — is Ollama running?'))
    } finally {
      setGenerating(null)
    }
  }

  const seasonalData = Object.entries(seasonal).map(([month, count]) => ({ month, count }))

  if (loading) return <Loader full />

  return (
    <div>
      <PageHeader title="Business Analytics" subtitle="Revenue trends, seasonal demand, and AI-generated business insights." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Revenue — last 60 days</h3>
          {trend.length === 0 ? <p className="text-sm text-slate py-10 text-center">No data yet.</p> : (
            <RevenueBarChart data={trend} height={240} />
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Seasonal demand</h3>
          {seasonalData.length === 0 ? <p className="text-sm text-slate py-10 text-center">No data yet.</p> : (
            <SeasonalDemandChart data={seasonalData} height={240} />
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-display text-lg text-ink flex items-center gap-2"><Sparkles size={18} className="text-gold-dark" /> AI Business Insights</h3>
          <div className="flex gap-2 flex-wrap">
            {INSIGHT_TYPES.map((t) => (
              <button key={t} onClick={() => handleGenerateInsight(t)} disabled={generating === t} className="btn-outline btn-sm">
                {generating === t ? 'Generating…' : t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-slate py-6 text-center">No insights generated yet — click a button above.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {insights.map((i) => (
              <div key={i.id} className="border border-ink/8 rounded-xl p-4">
                <span className="badge-warning mb-2 inline-block">{i.insight_type.replace(/_/g, ' ')}</span>
                <p className="text-sm text-charcoal/80 whitespace-pre-line">{i.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
