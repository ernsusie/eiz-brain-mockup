import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Workspaces } from './pages/Workspaces'
import { IntelligenceBrief } from './pages/IntelligenceBrief'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { SalePerformance } from './pages/dashboard/SalePerformance'
import { Growth } from './pages/dashboard/Growth'
import { Geography } from './pages/dashboard/Geography'
import { Products } from './pages/dashboard/Products'
import { Retention } from './pages/dashboard/Retention'
import { SegmentsLayout } from './pages/segments/SegmentsLayout'
import { SegmentList } from './pages/segments/SegmentList'
import { RfmAnalysis } from './pages/segments/RfmAnalysis'
import { Customers } from './pages/Customers'
import { CustomerDetail } from './pages/CustomerDetail'
import { Enrollment } from './pages/Enrollment'
import { SalesTeam } from './pages/SalesTeam'
import { Replenishment } from './pages/Replenishment'
import { Upload } from './pages/Upload'
import { SettingsLayout } from './pages/settings/SettingsLayout'
import { Account as SettingsAccount } from './pages/settings/Account'
import { Team as SettingsTeam } from './pages/settings/Team'
import { WorkspaceSettings } from './pages/settings/WorkspaceSettings'
import { Notifications as SettingsNotifications } from './pages/settings/Notifications'

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/workspaces" element={<Workspaces />} />

    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/brief" replace />} />

      <Route path="/brief" element={<IntelligenceBrief />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<SalePerformance />} />
        <Route path="growth" element={<Growth />} />
        <Route path="geography" element={<Geography />} />
        <Route path="products" element={<Products />} />
        <Route path="retention" element={<Retention />} />
      </Route>

      <Route path="/segments" element={<SegmentsLayout />}>
        <Route index element={<SegmentList kind="marketing" />} />
        <Route path="telesale" element={<SegmentList kind="telesale" />} />
        <Route path="ads" element={<SegmentList kind="ads" />} />
        <Route path="rfm" element={<RfmAnalysis />} />
      </Route>

      <Route path="/customers" element={<Customers />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />

      <Route path="/enrollment" element={<Enrollment />} />
      <Route path="/replenishment" element={<Replenishment />} />
      <Route path="/sales" element={<SalesTeam />} />

      <Route path="/upload" element={<Upload />} />

      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="/settings/account" replace />} />
        <Route path="account" element={<SettingsAccount />} />
        <Route path="team" element={<SettingsTeam />} />
        <Route path="workspace" element={<WorkspaceSettings />} />
        <Route path="notifications" element={<SettingsNotifications />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/brief" replace />} />
  </Routes>
)

export default App
