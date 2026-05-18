import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Globe, Package, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/retention-analysis',                  label: 'Retention',         icon: Repeat,   end: true },
  { to: '/retention-analysis/product-analysis', label: 'Product Analysis',  icon: Package },
  { to: '/retention-analysis/channel-analysis', label: 'Channel Analysis',  icon: Globe },
]

/**
 * Top-level "Retention Analysis" menu.
 *
 * Product Analysis + Channel Analysis nested here as sub-pages per
 * the user's 2026-05-18 round-N feedback — they share the same
 * customer-lens (how do they keep buying with us) and now live in
 * one menu so the sidebar stays manageable.
 */
export const RetentionAnalysisLayout = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Retention Analysis</h1>
            <p className="muted">Cohort · Product journey · Channel journey — กลับมาซื้อซ้ำเป็นยังไง</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
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
              <Icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
