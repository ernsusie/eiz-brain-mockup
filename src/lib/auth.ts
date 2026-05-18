import { useEffect, useState } from 'react'
import type { Role, User } from '@/types'
import { storage } from './storage'

const KEY = 'auth.user'
const TEAM_KEY = 'auth.team'

const PRESET_USERS: User[] = [
  {
    id: 'u-admin-01',
    name: 'อ.อาธิป (Admin)',
    email: 'admin@eizbrain.io',
    role: 'admin',
    avatarColor: '#6366f1',
  },
  {
    id: 'u-editor-01',
    name: 'คุณนัท (Editor)',
    email: 'editor@eizbrain.io',
    role: 'editor',
    avatarColor: '#10b981',
  },
  {
    id: 'u-viewer-01',
    name: 'คุณมุก (Viewer)',
    email: 'viewer@eizbrain.io',
    role: 'viewer',
    avatarColor: '#f59e0b',
  },
]

/* Notify listeners so the topbar avatar & sidebar role-gates refresh
 * immediately after an edit (without waiting for a re-mount). */
const broadcast = () => window.dispatchEvent(new Event('eiz-auth-changed'))

/* The "team" is the working roster — starts with the 3 presets and
 *  grows when an admin invites someone via Settings → Team. Lives
 *  entirely in localStorage so the demo is self-contained. */
const readTeam = (): User[] => {
  const stored = storage.get<User[] | null>(TEAM_KEY, null)
  if (stored && stored.length > 0) return stored
  /* Seed from presets on first run. */
  storage.set(TEAM_KEY, PRESET_USERS)
  return PRESET_USERS
}

const writeTeam = (team: User[]) => {
  storage.set(TEAM_KEY, team)
  broadcast()
}

export const auth = {
  currentUser(): User | null {
    return storage.get<User | null>(KEY, null)
  },
  signIn(email: string, _password: string, role?: Role): User {
    const team = readTeam()
    const match =
      team.find((u) => u.email === email) ??
      team.find((u) => u.role === (role ?? 'viewer'))!
    storage.set(KEY, match)
    broadcast()
    return match
  },
  signOut() {
    storage.remove(KEY)
    storage.remove('workspace.current')
    broadcast()
  },
  switchRole(role: Role): User {
    const team = readTeam()
    const user = team.find((u) => u.role === role) ?? PRESET_USERS.find((u) => u.role === role)!
    storage.set(KEY, user)
    broadcast()
    return user
  },
  presets: PRESET_USERS,

  /* ── Team management (Settings → Team) ────────────────────────── */

  listTeam(): User[] {
    return readTeam()
  },

  inviteUser(input: { name: string; email: string; role: Role; avatarColor?: string }): User {
    const team = readTeam()
    if (team.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('อีเมลนี้มีในทีมแล้ว')
    }
    const u: User = {
      id: `u-${input.role}-${Date.now().toString(36)}`,
      name: input.name,
      email: input.email,
      role: input.role,
      avatarColor: input.avatarColor ?? '#64748b',
    }
    writeTeam([...team, u])
    return u
  },

  updateRole(userId: string, role: Role): void {
    const team = readTeam()
    const next = team.map((u) => (u.id === userId ? { ...u, role } : u))
    writeTeam(next)
    /* If the edited user is the currently logged-in one, mirror the
     *  change into the auth.user slot so UI updates instantly. */
    const me = auth.currentUser()
    if (me && me.id === userId) storage.set(KEY, { ...me, role })
  },

  removeUser(userId: string): void {
    const team = readTeam()
    writeTeam(team.filter((u) => u.id !== userId))
  },

  /* ── Profile edits (Settings → Account) ───────────────────────── */

  updateProfile(patch: Partial<Pick<User, 'name' | 'avatarColor'>>): User | null {
    const me = auth.currentUser()
    if (!me) return null
    const next: User = { ...me, ...patch }
    storage.set(KEY, next)
    /* Mirror back into the team list so /settings/team stays in sync. */
    const team = readTeam()
    writeTeam(team.map((u) => (u.id === me.id ? next : u)))
    return next
  },
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser())

  useEffect(() => {
    const handler = () => setUser(auth.currentUser())
    window.addEventListener('storage', handler)
    window.addEventListener('eiz-auth-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('eiz-auth-changed', handler)
    }
  }, [])

  const refresh = () => {
    setUser(auth.currentUser())
    window.dispatchEvent(new Event('eiz-auth-changed'))
  }

  return { user, setUser: refresh }
}

export const can = (role: Role | undefined, action: 'view' | 'edit' | 'admin'): boolean => {
  if (!role) return false
  if (action === 'view') return true
  if (action === 'edit') return role === 'admin' || role === 'editor'
  if (action === 'admin') return role === 'admin'
  return false
}
