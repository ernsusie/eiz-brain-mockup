import { useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { auth, useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b',
]

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-brand-100 text-brand-700 ring-brand-200',
  editor: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  viewer: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export const Account = () => {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [color, setColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0])
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const dirty = name.trim() !== user.name || color !== user.avatarColor

  const handleSave = () => {
    auth.updateProfile({ name: name.trim() || user.name, avatarColor: color })
    setUser()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-6 lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">ข้อมูลโปรไฟล์</h2>
          <p className="text-xs text-slate-500 mt-0.5">แก้ชื่อและสีของ avatar ที่จะแสดงทุกหน้า</p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
            style={{ background: color }}
          >
            {(name || user.name)[0]}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{name || user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
            <span
              className={cn(
                'inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ring-1 font-medium uppercase',
                ROLE_BADGE[user.role],
              )}
            >
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">ชื่อแสดงผล</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 text-sm"
            placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">สี avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-9 h-9 rounded-xl ring-2 transition-transform',
                  c === color ? 'ring-slate-900 scale-110' : 'ring-transparent hover:ring-slate-300',
                )}
                style={{ background: c }}
                aria-label={`Pick color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              dirty
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            <Save className="w-4 h-4" /> บันทึก
          </button>
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> บันทึกแล้ว
            </span>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-3 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900">รหัสผ่าน</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Mockup นี้ใช้ login รหัสผ่านอะไรก็ได้ (เพื่อ demo)
          ในเวอร์ชันจริงจะมีหน้าเปลี่ยนรหัสผ่าน + 2FA ตรงนี้
        </p>
        <button
          disabled
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-400 text-xs font-semibold cursor-not-allowed"
        >
          เปลี่ยนรหัสผ่าน (เร็ว ๆ นี้)
        </button>
      </div>
    </div>
  )
}
