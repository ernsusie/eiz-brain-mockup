import { NavLink, Outlet } from 'react-router-dom'
import { Globe, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/retention-analysis/channel-analysis',        label: 'ภาพรวม', icon: Globe, end: true },
  { to: '/retention-analysis/channel-analysis/return', label: 'Return', icon: RefreshCcw },
]

export const ChannelAnalysisLayout = () => {
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
                    ? 'bg-cyan-50 text-cyan-700'
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
