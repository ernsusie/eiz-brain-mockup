import { NavLink, Outlet } from 'react-router-dom'
import { Users, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/customer-center/segments',  label: 'Segment Customer', icon: Users },
  { to: '/customer-center/customers', label: 'Customer Master',  icon: UserCircle },
]

export const CustomerCenterLayout = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Center
          </h1>
          <p className="muted">
            Segment + ลูกค้าทั้งหมด · จัดการดูแลลูกค้าตามกลุ่มและรายชื่อ
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
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
