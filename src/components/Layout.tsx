import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AIPanels } from './AIPanels'
import { useAuth } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import { PageContextProvider } from '@/lib/page-context'

export const Layout = () => {
  const { user } = useAuth()
  const ws = workspaces.current()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
    else if (!ws) navigate('/workspaces', { replace: true })
  }, [user, ws, navigate])

  if (!user || !ws) return null

  return (
    <PageContextProvider>
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-x-hidden">
            <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
        <AIPanels />
      </div>
    </PageContextProvider>
  )
}
