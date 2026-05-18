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
import { ProductAnalysis } from './pages/dashboard/ProductAnalysis'
import { SegmentAnalysis } from './pages/dashboard/SegmentAnalysis'
import { Frequency } from './pages/dashboard/Frequency'
import { Returns } from './pages/dashboard/Returns'
import { SegmentList } from './pages/segments/SegmentList'
import { RfmAnalysis } from './pages/segments/RfmAnalysis'
import { Customers } from './pages/Customers'
import { CustomerDetail } from './pages/CustomerDetail'
import { Enrollment } from './pages/Enrollment'
import { SalesTeam } from './pages/SalesTeam'
import { Replenishment } from './pages/Replenishment'
import { Upload } from './pages/Upload'
import { CustomerCenterLayout } from './pages/customer-center/CustomerCenterLayout'
import { CustomerCenterSegments } from './pages/customer-center/CustomerCenterSegments'
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
        <Route path="segment-analysis" element={<SegmentAnalysis />} />
        <Route path="frequency" element={<Frequency />} />
        <Route path="geography" element={<Geography />} />
        <Route path="products" element={<Products />} />
        <Route path="product-analysis" element={<ProductAnalysis />} />
        <Route path="returns" element={<Returns />} />
        {/* Legacy /retention path → redirect to the merged Returns page */}
        <Route path="retention" element={<Navigate to="/dashboard/returns" replace />} />
      </Route>

      {/* Customer Center — wraps the old /segments + /customers tabs */}
      <Route path="/customer-center" element={<CustomerCenterLayout />}>
        <Route index element={<Navigate to="/customer-center/segments" replace />} />
        <Route path="segments"          element={<CustomerCenterSegments />} />
        <Route path="customers"         element={<Customers />} />
        <Route path="customers/:id"     element={<CustomerDetail />} />
        <Route path="segments/rfm"      element={<RfmAnalysis />} />
        <Route path="segments/list"     element={<SegmentList kind="marketing" />} />
        <Route path="segments/telesale" element={<SegmentList kind="telesale" />} />
        <Route path="segments/ads"      element={<SegmentList kind="ads" />} />
      </Route>

      {/* Legacy redirects — keep old URLs working after the Customer
       *  Center menu refactor (commit 2026-05-18). */}
      <Route path="/segments"           element={<Navigate to="/customer-center/segments" replace />} />
      <Route path="/segments/rfm"       element={<Navigate to="/customer-center/segments/rfm" replace />} />
      <Route path="/segments/telesale"  element={<Navigate to="/customer-center/segments/telesale" replace />} />
      <Route path="/segments/ads"       element={<Navigate to="/customer-center/segments/ads" replace />} />
      <Route path="/customers"          element={<Navigate to="/customer-center/customers" replace />} />
      <Route path="/customers/:id"      element={<CustomerDetail />} />

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
