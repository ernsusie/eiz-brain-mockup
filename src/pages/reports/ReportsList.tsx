import { Link } from 'react-router-dom'
import { Calendar, FileText, Plus } from 'lucide-react'
import { PageInsight } from '@/components/PageInsight'

/* Mock recent reports — would come from a backend in production. */
const RECENT = [
  { id: 'apr-monthly',   title: 'Sabuy Skincare — Monthly Performance Review', date: '2026-04', status: 'Sent to client' },
  { id: 'mar-monthly',   title: 'Sabuy Skincare — Monthly Performance Review', date: '2026-03', status: 'Sent to client' },
  { id: 'q1-summary',    title: 'Sabuy Skincare — Q1 2026 Summary',            date: '2026-04', status: 'Draft' },
]

/**
 * Reports menu landing — picks an existing report or creates a new
 * one. The actual builder lives at /reports/new (and /reports/:id).
 */
export const ReportsList = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="muted">สร้างรายงานเองด้วย drag &amp; drop · ส่งให้ลูกค้าเป็น PDF / link / email</p>
          </div>
        </div>
        <Link
          to="/reports/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> สร้าง Report ใหม่
        </Link>
      </div>

      <PageInsight
        kind="info"
        title="AI สรุป Reports"
        items={[
          <>มีรายงาน <strong>{RECENT.filter((r) => r.status === 'Sent to client').length}</strong> ฉบับส่งให้ลูกค้าแล้ว · <strong>{RECENT.filter((r) => r.status === 'Draft').length}</strong> ฉบับ draft</>,
          <>ใช้ปุ่ม <strong>สร้าง Report ใหม่</strong> เพื่อเปิด builder — ลากบล็อกจาก library มาวาง + เลือก theme + delivery</>,
        ]}
      />

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">รายงานล่าสุด</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {RECENT.map((r) => (
            <li key={r.id}>
              <Link to={`/reports/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.date}</div>
                </div>
                <span className={r.status === 'Draft' ? 'chip bg-slate-100 text-slate-700' : 'chip bg-emerald-100 text-emerald-700'}>
                  {r.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
