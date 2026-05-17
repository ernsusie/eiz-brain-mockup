import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, ArrowLeftRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { auth, useAuth } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import { relativeTime, cn } from '@/lib/utils'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-brand-100 text-brand-700 ring-brand-200',
  editor: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  viewer: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export const Topbar = () => {
  const { user, setUser } = useAuth()
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)

  const handleLogout = () => {
    auth.signOut()
    setUser()
    navigate('/login', { replace: true })
  }

  const switchWorkspace = () => navigate('/workspaces')

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={switchWorkspace}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
          >
            <span className="text-lg">{ws?.icon}</span>
            <span>{ws?.nameTh}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          <span className="text-xs text-slate-500">
            อัปเดตล่าสุด {ws ? relativeTime(ws.lastUpdated) : '—'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
          <button onClick={switchWorkspace} className="btn-ghost text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            สลับ Workspace
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: user.avatarColor }}
                >
                  {user.name[0]}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">{user.name}</div>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full ring-1 font-medium uppercase',
                      ROLE_BADGE[user.role],
                    )}
                  >
                    {user.role}
                  </span>
                </div>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 card p-2 z-40">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setMenu(false)
                      switchWorkspace()
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> เปลี่ยน Workspace
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
