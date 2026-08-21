import { useEffect, useState } from 'react'
import { ScrollText, ShieldAlert } from 'lucide-react'
import { auditApi } from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { formatDateTime } from '../../utils/format'

export default function AdminAuditLogs() {
  const [tab, setTab] = useState('audit')
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  const load = (page = 1) => {
    setLoading(true)
    const fn = tab === 'audit' ? auditApi.logs : auditApi.securityLogs
    fn({ page, page_size: 20 }).then((res) => { setResult(res); setLoading(false) })
  }
  useEffect(() => load(1), [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Track sensitive actions and security events across the platform." />
      <Tabs tabs={[{ value: 'audit', label: 'Audit Logs' }, { value: 'security', label: 'Security Events' }]} active={tab} onChange={setTab} />

      {loading ? <Loader /> : result.items.length === 0 ? (
        <EmptyState icon={tab === 'audit' ? ScrollText : ShieldAlert} title="No entries found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3">{tab === 'audit' ? 'Action' : 'Event'}</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((log) => (
                  <tr key={log.id} className="border-t border-ink/6">
                    <td className="px-4 py-3">
                      <span className="badge-neutral">{tab === 'audit' ? log.action : log.event_type}</span>
                      {log.entity_type && <span className="text-xs text-slate ml-2">{log.entity_type} #{log.entity_id}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">{log.user_id ? `#${log.user_id}` : '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate">{log.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate">{formatDateTime(log.created_at)}</td>
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
