import { Outlet, useNavigate } from 'react-router-dom'
import { SubTabs } from '@/components/SubTabs'
import { workspaces } from '@/lib/workspaces'

export const SegmentsLayout = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  if (!ws) return null
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Segments</h1>
        <p className="muted">
          แบ่งกลุ่มลูกค้าตามมุมมอง — แต่ละ tab ใช้ logic ต่างกัน · กดเข้าไปได้เพื่อ drill-down
        </p>
      </div>

      <SubTabs
        items={[
          { to: '/segments', label: '💌 Marketing', end: true },
          { to: '/segments/telesale', label: '📞 Telesale' },
          { to: '/segments/ads', label: '🎯 Ads / Lookalike' },
          { to: '/segments/rfm', label: '📊 RFM Analysis' },
        ]}
      />

      <Outlet context={{ navigate }} />
    </div>
  )
}
