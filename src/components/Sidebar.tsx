import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth, can } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { workspaces } from '@/lib/workspaces'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'ภาพรวมยอดขาย' },
  {
    to: '/brief',
    label: 'สรุปอัจฉริยะ',
    icon: Sparkles,
    hint: 'AI-summary',
    featured: true,
  },
  {
    to: '/customer-center',
    label: 'Customer Center',
    icon: Users,
    hint: 'Segment + ลูกค้าทั้งหมด',
  },
  {
    to: '/product-analysis',
    label: 'Product Analysis',
    icon: Package,
    hint: 'Co-purchase · top 20 · returns',
  },
  {
    to: '/enrollment',
    label: 'Enrollment',
    icon: ClipboardList,
    hint: 'จ่ายลูกค้าให้ Sale',
    minRole: 'view' as const,
  },
  {
    to: '/sales',
    label: 'Sales Team',
    icon: Trophy,
    hint: 'Performance + KPI',
    minRole: 'admin' as const,
  },
  {
    to: '/settings',
    label: 'ตั้งค่า',
    icon: Settings,
    hint: 'บัญชี · ทีม · upload · replenishment',
  },
]

export const Sidebar = () => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const loc = useLocation()
  const ws = workspaces.current()

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white font-bold shadow-sm">
            E
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">
                Eiz<span className="gradient-text">Brain</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">Customer Intelligence</div>
            </div>
          )}
        </div>
        {!collapsed && ws && (
          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="text-lg">{ws.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {ws.nameTh}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{ws.dataSource}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          if (item.minRole === 'admin' && !can(user?.role, 'admin')) return null
          const Icon = item.icon
          const active = loc.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.hint}</div>
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="m-3 p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
