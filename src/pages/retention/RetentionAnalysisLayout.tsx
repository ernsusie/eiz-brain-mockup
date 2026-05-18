import { NavLink, Outlet } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/retention-analysis', label: 'Cohort', end: true },
]

/**
 * Top-level "Retention Analysis" menu. Today it only carries the
 * Cohort page, but the menu exists so future retention-deep-dive
 * pages (LTV curves, churn predictions, …) have a stable home.
 */
export const RetentionAnalysisLayout = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Retention Analysis</h1>
            <p className="muted">วิเคราะห์การกลับมาซื้อซ้ำของลูกค้า · cohort + repeat purchase</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm w-fit">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-pink-50 text-pink-700'
                  : 'text-slate-600 hover:bg-slate-50',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
