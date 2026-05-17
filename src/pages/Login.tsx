import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { auth, useAuth } from '@/lib/auth'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'
import { Mascot } from '@/components/Mascot'

export const Login = () => {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('admin@eizbrain.io')
  const [password, setPassword] = useState('demo1234')
  const [role, setRole] = useState<Role>('admin')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      auth.signIn(email, password, role)
      setUser()
      navigate('/workspaces', { replace: true })
    }, 600)
  }

  const pickPreset = (r: Role) => {
    const preset = auth.presets.find((p) => p.role === r)!
    setEmail(preset.email)
    setRole(r)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/30 to-coral-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              E
            </div>
            <div className="font-bold text-2xl text-slate-900">
              Eiz<span className="gradient-text">Brain</span>
            </div>
          </div>
          <div className="relative inline-block">
            <Mascot size={88} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            ยินดีต้อนรับกลับ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ลงชื่อเข้าใช้เพื่อเข้าสู่ workspace
          </p>
        </div>

        {/* Login card */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-brand-200/30 to-coral-200/30 blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Demo · เลือกบทบาทเพื่อทดลอง
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {(['admin', 'editor', 'viewer'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => pickPreset(r)}
                  className={cn(
                    'px-3 py-2.5 rounded-2xl text-xs font-semibold capitalize border-2 transition-all',
                    role === r
                      ? r === 'admin'
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : r === 'editor'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-slate-50 border-slate-400 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">อีเมล</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-10"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">รหัสผ่าน</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-10"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center text-base py-3"
              >
                {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-4 text-[11px] text-slate-400 text-center">
              admin@ / editor@ / viewer@eizbrain.io · รหัสอะไรก็ได้
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 mt-6">
          © 2026 EizBrain · Mock-up build
        </div>
      </div>
    </div>
  )
}
