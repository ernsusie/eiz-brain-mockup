import { useEffect, useState } from 'react'
import type { Role, User } from '@/types'
import { storage } from './storage'

const KEY = 'auth.user'

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

export const auth = {
  currentUser(): User | null {
    return storage.get<User | null>(KEY, null)
  },
  signIn(email: string, _password: string, role?: Role): User {
    const preset =
      PRESET_USERS.find((u) => u.email === email) ??
      PRESET_USERS.find((u) => u.role === (role ?? 'viewer'))!
    storage.set(KEY, preset)
    return preset
  },
  signOut() {
    storage.remove(KEY)
    storage.remove('workspace.current')
  },
  switchRole(role: Role): User {
    const user = PRESET_USERS.find((u) => u.role === role)!
    storage.set(KEY, user)
    return user
  },
  presets: PRESET_USERS,
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
