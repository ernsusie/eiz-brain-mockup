import { NavLink, Outlet } from 'react-router-dom'
import { Package, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/retention-analysis/product-analysis',        label: 'ภาพรวม', icon: Package, end: true },
  { to: '/retention-analysis/product-analysis/return', label: 'Return', icon: RefreshCcw },
]

export const ProductAnalysisLayout = () => {
  return (
    <div className="space-y-4">
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
                    ? 'bg-violet-50 text-violet-700'
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
