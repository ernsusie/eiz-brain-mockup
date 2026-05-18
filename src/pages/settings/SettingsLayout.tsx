import { NavLink, Outlet } from 'react-router-dom'
import { Bell, Building2, Lock, Package, Upload, UserCircle, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

/* Sub-tab nav for /settings/*. Team tab is admin-only; Upload &
 * Replenishment are editor+ since they mutate workspace data. */
interface Tab {
  to:         string
  label:      string
  icon:       typeof UserCircle
  adminOnly?: boolean
  editorOnly?: boolean
}

const TABS: Tab[] = [
  { to: '/settings/account',         label: 'บัญชี',                        icon: UserCircle },
  { to: '/settings/team',            label: 'ทีม & สิทธิ์',                  icon: Users,    adminOnly: true },
  { to: '/settings/workspace',       label: 'Workspace',                    icon: Building2 },
  { to: '/settings/upload',          label: 'นำเข้าข้อมูล',                  icon: Upload,   editorOnly: true },
  { to: '/settings/replenishment',   label: 'Product Follow-up & Replenishment', icon: Package,  editorOnly: true },
  { to: '/settings/notifications',   label: 'แจ้งเตือน & ภาษา',              icon: Bell },
]

export const SettingsLayout = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'admin' || user?.role === 'editor'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ตั้งค่า</h1>
          <p className="text-xs text-slate-500">โปรไฟล์ · สมาชิกในทีม · workspace · การแจ้งเตือน</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
        {TABS.filter((t) => {
          if (t.adminOnly && !isAdmin) return false
          if (t.editorOnly && !isEditor) return false
          return true
        }).map((tab) => {
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
