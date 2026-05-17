import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useAuth, can } from '@/lib/auth'
import type { Role } from '@/types'

interface Props {
  required: 'view' | 'edit' | 'admin'
  fallback?: ReactNode
  children: ReactNode
}

export const RoleGuard = ({ required, fallback, children }: Props) => {
  const { user } = useAuth()
  if (can(user?.role, required)) return <>{children}</>
  if (fallback !== undefined) return <>{fallback}</>
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
        <Lock className="w-6 h-6" />
      </div>
      <div className="font-semibold text-slate-900 mb-1">เข้าถึงไม่ได้</div>
      <div className="text-sm text-slate-500">
        ฟีเจอร์นี้สำหรับ {required === 'admin' ? 'Admin' : 'Editor หรือ Admin'} เท่านั้น<br />
        คุณกำลังใช้ในฐานะ <span className="font-semibold">{user?.role ?? 'guest'}</span>
      </div>
    </div>
  )
}

export const RoleHint = ({ role }: { role: Role }) => {
  const colors: Record<Role, string> = {
    admin: 'text-brand-700 bg-brand-50',
    editor: 'text-emerald-600 bg-emerald-50',
    viewer: 'text-slate-600 bg-slate-100',
  }
  return (
    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colors[role]}`}>
      {role}
    </span>
  )
}
