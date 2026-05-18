import { useNavigate } from 'react-router-dom'
import { Users, Database, Calendar, ArrowRight } from 'lucide-react'
import { useAuth, auth } from '@/lib/auth'
import { workspaces, WORKSPACES } from '@/lib/workspaces'
import { relativeTime, cn } from '@/lib/utils'

export const Workspaces = () => {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  const enter = (id: string) => {
    workspaces.setCurrent(id)
    /* Dashboard is the default landing for every account (per
     *  2026-05-18 feedback). The Brief page sits at position #2 in
     *  the sidebar but is no longer the post-login destination. */
    navigate('/dashboard', { replace: true })
  }

  const handleLogout = () => {
    auth.signOut()
    setUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/30 to-coral-50/30">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white font-bold shadow-sm">
              E
            </div>
            <span className="font-bold text-lg text-slate-900">
              Eiz<span className="gradient-text">Brain</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold">{user.name}</div>
              <div className="text-[10px] text-slate-500 uppercase">{user.role}</div>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-xs">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            เลือก <span className="gradient-text">Workspace</span> ของคุณ
          </h1>
          <p className="text-base text-slate-500 mt-3 max-w-xl mx-auto">
            แต่ละ workspace เชื่อมต่อข้อมูลคนละแหล่ง · สลับได้ตลอดเวลา
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKSPACES.map((w) => (
            <button
              key={w.id}
              onClick={() => enter(w.id)}
              className="card card-hover text-left p-5 group relative overflow-hidden"
            >
              <div
                className={cn(
                  'absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15 blur-2xl bg-gradient-to-br',
                  w.color,
                )}
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br',
                      w.color,
                    )}
                  >
                    {w.icon}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4">
                  <div className="font-semibold text-slate-900">{w.nameTh}</div>
                  <div className="text-xs text-slate-500">{w.name}</div>
                </div>
                <div className="text-xs text-slate-600 mt-2 line-clamp-2">{w.description}</div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px]">
                  <div>
                    <div className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> สมาชิก
                    </div>
                    <div className="font-semibold mt-0.5">{w.members}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 flex items-center gap-1">
                      <Database className="w-3 h-3" /> Source
                    </div>
                    <div className="font-semibold mt-0.5 truncate">{w.dataSource}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> อัปเดต
                    </div>
                    <div className="font-semibold mt-0.5">{relativeTime(w.lastUpdated)}</div>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <div className="card border-2 border-dashed border-slate-200 p-5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 cursor-not-allowed">
            <div className="text-center text-sm">
              <div className="text-2xl">+</div>
              สร้าง Workspace ใหม่
              <div className="text-[10px] mt-1">(Coming soon)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
