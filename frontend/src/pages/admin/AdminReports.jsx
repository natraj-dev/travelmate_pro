import { useEffect, useState } from 'react'
import { FileBarChart, Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportApi } from '../../api/admin'
import { apiClient } from '../../api/axiosClient'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { formatDateTime } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

const REPORT_TYPES = ['BOOKING', 'REVENUE', 'HOTEL', 'TOUR', 'CUSTOMER', 'AGENT']
const FORMAT_ICONS = { PDF: File, CSV: FileText, EXCEL: FileSpreadsheet }
const FORMAT_EXT = { PDF: 'pdf', CSV: 'csv', EXCEL: 'xlsx' }

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('BOOKING')
  const [format, setFormat] = useState('PDF')
  const [generating, setGenerating] = useState(false)

  const load = () => {
    setLoading(true)
    reportApi.list().then((r) => { setReports(r); setLoading(false) })
  }
  useEffect(load, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await reportApi.generate({ report_type: reportType, format })
      toast.success('Report generated')
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (report) => {
    try {
      const res = await apiClient.get(`/reports/${report.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.report_type.toLowerCase()}_report.${FORMAT_EXT[report.format] || 'dat'}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      toast.error('Could not download report')
    }
  }

  return (
    <div>
      <PageHeader title="Reports & Export" subtitle="Generate downloadable reports in PDF, CSV, or Excel." />

      <div className="card p-5 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1">
          <label className="field-label">Report type</label>
          <select className="select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="field-label">Format</label>
          <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
            {['PDF', 'CSV', 'EXCEL'].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-gold shrink-0">
          <FileBarChart size={16} /> {generating ? 'Generating…' : 'Generate report'}
        </button>
      </div>

      {loading ? <Loader /> : reports.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No reports generated yet" />
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const Icon = FORMAT_ICONS[r.format] || File
            return (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ink/5 flex items-center justify-center text-ink"><Icon size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{r.report_type} report</p>
                    <p className="text-xs text-slate">{r.format} · {formatDateTime(r.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => handleDownload(r)} className="btn-outline btn-sm"><Download size={13} /> Download</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
