export type Role = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarColor: string
}

export interface Workspace {
  id: string
  name: string
  nameTh: string
  industry: string
  description: string
  color: string
  icon: string
  members: number
  dataSource: string
  lastUpdated: string
}

export type CustomerStatus =
  | 'champion'
  | 'loyal'
  | 'potential'
  | 'new'
  | 'at_risk'
  | 'lost'
  | 'ghost'

export interface Customer {
  id: string
  name: string
  phone: string
  province: string
  channel: string
  segmentMarketing: string
  segmentTelesale: string
  segmentAds: string
  status: CustomerStatus
  orders: number
  totalSpend: number
  lastBuy: string
  firstBuy: string
  avgBasket: number
  returnRate: number
  riskScore: number
  enrolled: boolean
  enrolledBy?: string
  enrolledAt?: string
  assignedSale?: string
  highAov?: boolean
  tags: string[]
}

export interface Sale {
  id: string
  name: string
  type: 'main' | 'telesale'
  channel: string
  avatar: string
  active: boolean
  kpiMonthly: number
  achievedMonthly: number
  customersAssigned: number
  customersEnrolled: number
  returnRate: number
  joinedAt: string
}

export interface KpiConfig {
  workspaceId: string
  monthlyRevenueTarget: number
  monthlyOrdersTarget: number
  enrollmentTargetPerSale: number
  returnRateMax: number
  updatedBy: string
  updatedAt: string
}

export interface EnrollmentRecord {
  id: string
  customerId: string
  customerName: string
  saleId: string
  saleName: string
  enrolledAt: string
  enrolledByAdmin: string
  conditions: string[]
  note?: string
}

export interface ChannelStat {
  channel: string
  orders: number
  customers: number
  revenue: number
  cancelRate: number
  share: number
  color: string
}

export interface ProductStat {
  id: string
  name: string
  revenue: number
  units: number
  customers: number
  avgFreq: number
  asp: number
  returnRate: number
  returns: number
}
