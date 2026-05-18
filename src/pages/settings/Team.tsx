import { useState } from 'react'
import { Mail, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import type { Role, User } from '@/types'
import { auth, useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-brand-100 text-brand-700 ring-brand-200',
  editor: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  viewer: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin (เข้าถึงทุกอย่าง)',
  editor: 'Editor (แก้ไขข้อมูล)',
  viewer: 'Viewer (ดูอย่างเดียว)',
}

export const Team = () => {
  const { user, setUser } = useAuth()
  const [team, setTeam] = useState<User[]>(auth.listTeam())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  if (!user || user.role !== 'admin') {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        🔒 หน้านี้สำหรับ Admin เท่านั้น
      </div>
    )
  }

  const refresh = () => setTeam(auth.listTeam())

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOkMsg(null)
    if (!name.trim() || !email.trim()) {
      setError('กรอกชื่อและอีเมล')
      return
    }
    try {
      auth.inviteUser({ name: name.trim(), email: email.trim().toLowerCase(), role })
      setName('')
      setEmail('')
      setRole('viewer')
      setOkMsg('เพิ่มสมาชิกเรียบร้อย')
      refresh()
      setTimeout(() => setOkMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRoleChange = (id: string, next: Role) => {
    auth.updateRole(id, next)
    refresh()
    setUser()
  }

  const handleRemove = (id: string) => {
    if (id === user.id) {
      setError('ไม่สามารถลบบัญชีของตัวเองออกได้')
      return
    }
    if (!confirm('ลบสมาชิกคนนี้ออกจากทีม?')) return
    auth.removeUser(id)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900">เชิญสมาชิกใหม่</h2>
        </div>
        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ"
            className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="viewer">{ROLE_LABEL.viewer}</option>
            <option value="editor">{ROLE_LABEL.editor}</option>
            <option value="admin">{ROLE_LABEL.admin}</option>
          </select>
          <button
            type="submit"
            className="md:col-span-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            ส่งคำเชิญ
          </button>
          {error && (
            <p className="md:col-span-12 text-xs text-rose-600 mt-1">❌ {error}</p>
          )}
          {okMsg && (
            <p className="md:col-span-12 text-xs text-emerald-600 mt-1">✓ {okMsg}</p>
          )}
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">สมาชิกในทีม ({team.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="text-left px-5 py-2 font-semibold">ชื่อ</th>
              <th className="text-left px-5 py-2 font-semibold">อีเมล</th>
              <th className="text-left px-5 py-2 font-semibold">สิทธิ์</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ background: u.avatarColor }}
                    >
                      {u.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {u.name}
                        {u.id === user.id && (
                          <span className="ml-2 text-[10px] text-brand-600 font-medium">(คุณ)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 font-mono">{u.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className={cn(
                      'text-[11px] px-2 py-1 rounded-full ring-1 font-semibold uppercase border-0 bg-transparent',
                      ROLE_BADGE[u.role],
                    )}
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleRemove(u.id)}
                    disabled={u.id === user.id}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      u.id === user.id
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
                    )}
                    aria-label="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
