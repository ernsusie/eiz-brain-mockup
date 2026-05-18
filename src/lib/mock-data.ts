import type {
  ChannelStat,
  Customer,
  CustomerStatus,
  KpiConfig,
  ProductStat,
  Sale,
} from '@/types'
import { pick, range, seededRandom } from './utils'

const CHANNELS: { name: string; color: string; weight: number }[] = [
  { name: 'Facebook', color: '#6366f1', weight: 0.67 },
  { name: 'Line', color: '#8b5cf6', weight: 0.19 },
  { name: 'Shopee', color: '#f97316', weight: 0.046 },
  { name: 'Telesale', color: '#ec4899', weight: 0.044 },
  { name: 'TikTok', color: '#06b6d4', weight: 0.042 },
  { name: 'CRM', color: '#10b981', weight: 0.005 },
  { name: 'Lazada', color: '#f59e0b', weight: 0.002 },
  { name: 'Other', color: '#94a3b8', weight: 0.001 },
]

const PROVINCES = [
  'กรุงเทพมหานคร',
  'ชลบุรี',
  'นนทบุรี',
  'สมุทรปราการ',
  'ปทุมธานี',
  'เชียงใหม่',
  'นครราชสีมา',
  'สงขลา',
  'ขอนแก่น',
  'นครปฐม',
  'ภูเก็ต',
  'อุดรธานี',
  'ระยอง',
]

const STATUSES: { v: CustomerStatus; w: number }[] = [
  { v: 'champion', w: 0.05 },
  { v: 'loyal', w: 0.08 },
  { v: 'potential', w: 0.12 },
  { v: 'new', w: 0.18 },
  { v: 'at_risk', w: 0.22 },
  { v: 'lost', w: 0.27 },
  { v: 'ghost', w: 0.08 },
]

const SEGMENT_MARKETING = [
  'VIP กำลังจะหลุด',
  'ลูกค้าเสี่ยงหลุด',
  'ดาวรุ่ง',
  'ลูกค้าใหม่รอ Follow-up',
  'Re-activation',
  'Win-back',
  'Newsletter',
]

const SEGMENT_TELESALE = [
  'ลูกค้าซื้อแล้ว 60-120 วัน',
  'มีศักยภาพยังไม่ซื้อ',
  'ขั้นเยี่ยมที่ยังอยู่กับเรา',
  'ลูกค้าขั้นดีกำลังจะหายไป',
  'ลูกค้าใหม่ยังไม่กลับมา',
]

const SEGMENT_ADS = [
  'Lookalike VIP',
  'Retarget cart abandon',
  'Retarget viewed product',
  'High AOV interest',
  'Re-engage 90d',
  'Cold traffic',
]

const FIRST_NAMES_TH = [
  'ปรียา', 'นภัสนันท์', 'อรอุมา', 'ชนิดา', 'ศิริพร', 'จิราภรณ์', 'พิมพ์ใจ',
  'ณัฐนรี', 'อรวรรณ', 'สุนิสา', 'ปาริชาติ', 'กนกวรรณ', 'ธัญลักษณ์', 'รัตนา',
  'ปุณยนุช', 'อรษา', 'มัลลิกา', 'จันทร์เพ็ญ', 'อภิญญา', 'พัชรา', 'สมพร',
  'เกษม', 'วราภรณ์', 'นันทพร', 'พิชญา', 'รุ่งทิวา', 'อังคณา', 'มยุรี',
]
const LAST_NAMES_TH = [
  'จันทร์ดี', 'ศิริ', 'สุขใจ', 'รัตนกุล', 'พรหมศรี', 'นิ่มนวล', 'ทองดี',
  'ใจดี', 'มงคล', 'บัวศรี', 'สวยงาม', 'อินทรกำแหง', 'เจริญพร', 'แสงทอง',
  'ดวงดี', 'เพ็ชรนิล', 'พุ่มไพร', 'วงศ์ทอง', 'ไพศาล', 'ชัยศรี', 'ขจรเสรี',
]
const PREFIXES = ['คุณ', 'K.', 'P.', 'พี่', '', '', '']

const PRODUCTS = [
  { id: 'p01', name: 'Zenia ผงผัก 100 กรัม 1 กระปุก + แก้ว + คูปองลด 5%', basePrice: 990 },
  { id: 'p02', name: 'ZENA น้ำมันกระเทียม', basePrice: 490 },
  { id: 'p03', name: 'น้ำมันกระเทียม B9', basePrice: 2370 },
  { id: 'p04', name: 'Zenia ผงผัก 30 กรัม 1 กระปุก + คูปองลด 5%', basePrice: 510 },
  { id: 'p05', name: 'Zenia ผงผัก 100 กรัม 1 กระปุก + คูปองลด 5%', basePrice: 950 },
  { id: 'p06', name: 'Zenia ผงผัก 100 กรัม 3 กระปุก + ผงผัก 30g 1', basePrice: 2600 },
  { id: 'p07', name: 'Zenia ผงผัก 100 กรัม 1 กระปุก + แก้วเชค 1 ใบ', basePrice: 990 },
  { id: 'p08', name: 'โปรเตเลเซล ซีน้ำมันกระเทียม 12 เม็ด', basePrice: 190 },
  { id: 'p09', name: 'ผงผัก 30 กรัม', basePrice: 535 },
  { id: 'p10', name: 'โซยอน วิตามินแก้วง่วง (รสส้ม) ชงดื่ม', basePrice: 446 },
  { id: 'p11', name: 'B9 mini', basePrice: 320 },
  { id: 'p12', name: 'B9 Green', basePrice: 880 },
  { id: 'p13', name: 'B9 Green mini', basePrice: 290 },
  { id: 'p14', name: 'Zenia น้ำมันกระเทียม mini', basePrice: 220 },
  { id: 'p15', name: 'บัตรสมาชิก', basePrice: 590 },
]

const SALES_NAMES = [
  { name: 'จีน', type: 'telesale' as const },
  { name: 'อุ้ย', type: 'telesale' as const },
  { name: 'อีฟ', type: 'telesale' as const },
  { name: 'แก้ว', type: 'telesale' as const },
  { name: 'จูนJune', type: 'telesale' as const },
  { name: 'Nuu', type: 'telesale' as const },
  { name: 'ปุ๋ย', type: 'telesale' as const },
  { name: 'อ้อ', type: 'telesale' as const },
  { name: 'แอดมินคอม', type: 'telesale' as const },
  { name: 'B.Sukarat (Mind)', type: 'telesale' as const },
  { name: 'ทราย', type: 'telesale' as const },
  { name: 'Pakamon T./FRAME', type: 'main' as const },
  { name: 'อภิญญา F.', type: 'main' as const },
  { name: 'รัฐนนท์ S.', type: 'main' as const },
  { name: 'นิภาวรรณ R.', type: 'main' as const },
]

// ----- Generators (deterministic per workspace) -----

const seedFromWorkspace = (workspaceId: string) => {
  let h = 5381
  for (const c of workspaceId) h = (h * 33) ^ c.charCodeAt(0)
  return h >>> 0
}

const weightedPick = <T,>(items: { v: T; w: number }[], rand: () => number): T => {
  const total = items.reduce((s, it) => s + it.w, 0)
  let r = rand() * total
  for (const it of items) {
    r -= it.w
    if (r <= 0) return it.v
  }
  return items[items.length - 1].v
}

export const generateCustomers = (workspaceId: string, count = 400): Customer[] => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 1)
  return range(count).map((i) => {
    const status = weightedPick(STATUSES, rand)
    const channel = weightedPick(
      CHANNELS.map((c) => ({ v: c.name, w: c.weight })),
      rand,
    )
    const orders =
      status === 'champion'
        ? Math.floor(rand() * 30) + 12
        : status === 'loyal'
          ? Math.floor(rand() * 8) + 5
          : status === 'potential'
            ? Math.floor(rand() * 4) + 2
            : status === 'new'
              ? 1
              : Math.floor(rand() * 3) + 1
    const avgBasket =
      status === 'champion' || status === 'loyal'
        ? 800 + Math.floor(rand() * 1800)
        : 300 + Math.floor(rand() * 1200)
    const totalSpend = orders * avgBasket
    const daysSinceFirst = Math.floor(rand() * 720) + 30
    const daysSinceLast =
      status === 'lost' || status === 'ghost'
        ? Math.floor(rand() * 365) + 180
        : status === 'at_risk'
          ? Math.floor(rand() * 90) + 90
          : Math.floor(rand() * 60)
    const firstBuy = new Date(Date.now() - daysSinceFirst * 86400_000).toISOString()
    const lastBuy = new Date(Date.now() - daysSinceLast * 86400_000).toISOString()
    const prefix = pick(PREFIXES, rand)
    const fname = pick(FIRST_NAMES_TH, rand)
    const lname = pick(LAST_NAMES_TH, rand)
    const enrolled = (status === 'champion' || status === 'loyal') && rand() > 0.4
    const sale = pick(SALES_NAMES, rand)
    const highAov = avgBasket > 2790
    const riskScore =
      status === 'lost' || status === 'ghost'
        ? 70 + Math.floor(rand() * 30)
        : status === 'at_risk'
          ? 50 + Math.floor(rand() * 25)
          : Math.floor(rand() * 40)
    const tags: string[] = []
    if (status === 'new') tags.push('first_buy_warming')
    if (status === 'at_risk') tags.push('almost_lost')
    if (status === 'lost') tags.push('lost_customer')
    if (status === 'champion') tags.push('loyal_vip')
    if (highAov) tags.push('high_aov')

    return {
      id: `${workspaceId}-c-${i.toString().padStart(5, '0')}`,
      name: `${prefix}${fname} ${lname}`.trim(),
      phone: `0${Math.floor(rand() * 9) + 1}${Math.floor(rand() * 99999999)
        .toString()
        .padStart(8, '0')}`.slice(0, 10),
      province: pick(PROVINCES, rand),
      channel,
      segmentMarketing: pick(SEGMENT_MARKETING, rand),
      segmentTelesale: pick(SEGMENT_TELESALE, rand),
      segmentAds: pick(SEGMENT_ADS, rand),
      status,
      orders,
      totalSpend,
      lastBuy,
      firstBuy,
      avgBasket,
      returnRate: Math.round(rand() * 8 * 10) / 10,
      riskScore,
      enrolled,
      enrolledBy: enrolled ? 'อ.อาธิป (Admin)' : undefined,
      enrolledAt: enrolled
        ? new Date(Date.now() - Math.floor(rand() * 60) * 86400_000).toISOString()
        : undefined,
      assignedSale: enrolled ? sale.name : undefined,
      highAov,
      tags,
    }
  })
}

export const generateSales = (workspaceId: string): Sale[] => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 2)
  return SALES_NAMES.map((s, i) => {
    const kpi = s.type === 'main' ? 1_200_000 : 450_000
    const achievement = 0.4 + rand() * 0.8
    return {
      id: `${workspaceId}-s-${i.toString().padStart(2, '0')}`,
      name: s.name,
      type: s.type,
      channel: s.type === 'main' ? pick(['Facebook', 'Line', 'Shopee'], rand) : 'Telesale',
      avatar: '#' + Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0'),
      active: rand() > 0.15,
      kpiMonthly: kpi,
      achievedMonthly: Math.floor(kpi * achievement),
      customersAssigned: Math.floor(rand() * 200) + 80,
      customersEnrolled: Math.floor(rand() * 60) + 20,
      returnRate: Math.round(rand() * 5 * 10) / 10,
      joinedAt: new Date(Date.now() - Math.floor(rand() * 900) * 86400_000).toISOString(),
    }
  })
}

export const generateProducts = (workspaceId: string): ProductStat[] => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 3)
  return PRODUCTS.map((p, i) => {
    const customers = Math.floor(rand() * 14000) + 500
    const units = Math.floor(customers * (1 + rand() * 0.6))
    const revenue = units * p.basePrice * (0.85 + rand() * 0.3)
    return {
      id: p.id,
      name: p.name,
      revenue: Math.round(revenue),
      units,
      customers,
      avgFreq: Math.round((1 + rand() * 1.5) * 100) / 100,
      asp: Math.round(p.basePrice * (0.9 + rand() * 0.2)),
      returnRate: Math.round((1 + rand() * 6) * 10) / 10,
      returns: Math.floor(units * (0.01 + rand() * 0.06)),
    }
  }).sort((a, b) => b.revenue - a.revenue)
}

export const generateChannelStats = (workspaceId: string): ChannelStat[] => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 4)
  const totalOrders = 111_263 + Math.floor(rand() * 5000)
  return CHANNELS.map((c) => {
    const orders = Math.floor(totalOrders * c.weight * (0.9 + rand() * 0.2))
    const customers = Math.floor(orders * (0.6 + rand() * 0.3))
    const aov = 500 + rand() * 1200
    return {
      channel: c.name,
      orders,
      customers,
      revenue: Math.round(orders * aov),
      cancelRate: Math.round(rand() * 25) / 10,
      share: c.weight * 100,
      color: c.color,
    }
  })
}

export const generateMonthlyRevenue = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 5)
  const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
  return months.map((m, i) => ({
    month: m.slice(2),
    revenue: Math.round((4.4 + rand() * 1.4 + i * 0.1) * 1_000_000),
    returned: Math.round((0.04 + rand() * 0.06) * 1_000_000),
    orders: Math.floor((14000 + rand() * 4000 + i * 200)),
    newCustomers: Math.floor((3000 + rand() * 1500)),
    repeatCustomers: Math.floor((800 + rand() * 600)),
  }))
}

export const generateWeeklyRevenue = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 6)
  return range(12).map((i) => ({
    week: `W${i + 1}`,
    revenue: Math.round((900 + rand() * 350) * 1000),
    orders: Math.floor(2200 + rand() * 900),
  }))
}

/* Daily trend — 30 days of revenue + new customer counts. The Growth
 * page uses this for the rolling 30-day chart with a metric switch
 * (revenue ↔ customers). Anchored to today() so the latest tick is
 * always "today" in the demo. */
export const generateDailyTrend = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 12)
  const today = new Date()
  return range(30).map((i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    /* Weekend bump (Sat/Sun = 6/0) for revenue, but customers stay
     * fairly flat — telesale + ads run mostly on weekdays. */
    const dow = d.getDay()
    const weekendBump = dow === 0 || dow === 6 ? 1.2 : 1
    return {
      date: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      revenue: Math.round((140 + rand() * 60) * 1000 * weekendBump),
      customers: Math.floor((90 + rand() * 50) * (dow === 0 || dow === 6 ? 0.85 : 1.05)),
      orders: Math.floor((180 + rand() * 80) * weekendBump),
    }
  })
}

export const generateHourlyDistribution = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 7)
  return range(24).map((h) => {
    let weight =
      h >= 10 && h <= 14
        ? 8 + rand() * 4
        : h >= 19 && h <= 22
          ? 9 + rand() * 5
          : h >= 7 && h <= 9
            ? 4 + rand() * 3
            : h >= 0 && h <= 5
              ? 0.5 + rand() * 1
              : 2 + rand() * 3
    return { hour: `${h.toString().padStart(2, '0')}:00`, share: Math.round(weight * 10) / 10 }
  })
}

export const generateProvinceTop = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 8)
  return PROVINCES.slice(0, 10)
    .map((p, i) => ({
      province: p,
      revenue: Math.round((18 - i * 1.5 + rand() * 1.2) * 1_000_000),
      orders: Math.floor((20000 - i * 1800 + rand() * 1000)),
      customers: Math.floor((16000 - i * 1400 + rand() * 800)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export const generateCohortRetention = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 9)
  const cohorts = [
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
  ]
  return cohorts.map((cohort, idx) => {
    const monthsAvailable = cohorts.length - idx
    const customers = 1200 + Math.floor(rand() * 5500)
    const retention = range(Math.min(monthsAvailable, 11)).map((m) => {
      if (m === 0) return null
      const base = 8 - m * 0.8 + rand() * 2
      return Math.max(0.5, Math.round(base * 10) / 10)
    })
    return { cohort, customers, retention }
  })
}

export const generateCoPurchase = (workspaceId: string) => {
  const products = generateProducts(workspaceId).slice(0, 18)
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 11)
  const n = products.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Higher co-occurrence for products with similar popularity (bundles)
      const popularity =
        Math.sqrt(products[i].customers * products[j].customers) / 100
      // Some pairs are "natural bundles" (random hot pairs)
      const isBundle = rand() > 0.85
      const v = Math.floor(
        popularity * (isBundle ? 4 + rand() * 8 : 0.05 + rand() * 0.6),
      )
      matrix[i][j] = v
      matrix[j][i] = v
    }
  }
  return { products, matrix }
}

export const generateTop20Popular = (workspaceId: string) => {
  const products = generateProducts(workspaceId)
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 12)
  return products.slice(0, 20).map((p) => {
    const singleBuy = Math.floor(p.customers * (0.2 + rand() * 0.7))
    return {
      ...p,
      orders: p.units,
      singleBuyCount: singleBuy,
      singleBuyPct: Math.round((singleBuy / p.customers) * 100),
    }
  })
}

export const generateReturnReasons = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 10)
  return [
    { reason: 'ของไม่ตรงปก / รสไม่ถูกใจ', share: 32 + rand() * 5 },
    { reason: 'จัดส่งช้า', share: 18 + rand() * 4 },
    { reason: 'หีบห่อชำรุด', share: 14 + rand() * 4 },
    { reason: 'ลูกค้าเปลี่ยนใจ', share: 12 + rand() * 4 },
    { reason: 'ใกล้หมดอายุ', share: 9 + rand() * 3 },
    { reason: 'อื่น ๆ', share: 8 + rand() * 3 },
  ]
}

// ----- KPI Config (persisted in localStorage per workspace) -----

import { storage } from './storage'

const KPI_KEY = (workspaceId: string) => `kpi.${workspaceId}`

export const kpiStore = {
  get(workspaceId: string): KpiConfig {
    return storage.get<KpiConfig>(KPI_KEY(workspaceId), {
      workspaceId,
      monthlyRevenueTarget: 5_000_000,
      monthlyOrdersTarget: 16_000,
      enrollmentTargetPerSale: 60,
      returnRateMax: 3,
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    })
  },
  set(workspaceId: string, cfg: KpiConfig) {
    storage.set(KPI_KEY(workspaceId), cfg)
    window.dispatchEvent(new Event('eiz-kpi-changed'))
  },
}

// ----- Sales enrollment store (persisted) -----

const SALES_KEY = (workspaceId: string) => `sales.${workspaceId}`

export const salesStore = {
  get(workspaceId: string): Sale[] {
    const stored = storage.get<Sale[] | null>(SALES_KEY(workspaceId), null)
    if (stored) return stored
    const generated = generateSales(workspaceId)
    storage.set(SALES_KEY(workspaceId), generated)
    return generated
  },
  set(workspaceId: string, list: Sale[]) {
    storage.set(SALES_KEY(workspaceId), list)
    window.dispatchEvent(new Event('eiz-sales-changed'))
  },
}

// ----- Customer enrollment overlay -----

const CUSTOMER_OVERLAY_KEY = (workspaceId: string) => `customers.overlay.${workspaceId}`

export interface CustomerEnrollmentOverlay {
  customerId: string
  saleId: string
  saleName: string
  enrolledAt: string
  enrolledByAdmin: string
  callPriority?: 'hot' | 'warm' | 'cold'
  locked?: boolean           // Lock to this sale, won't be reshuffled
  assignmentBadge?: 'new' | 'kept' // After last reshuffle: was this changed or kept?
  previousSaleName?: string  // Sale before last reshuffle (for "kept" reference)
}

export const customerOverlay = {
  get(workspaceId: string): Record<string, CustomerEnrollmentOverlay> {
    return storage.get(CUSTOMER_OVERLAY_KEY(workspaceId), {})
  },
  enroll(
    workspaceId: string,
    customerId: string,
    sale: { id: string; name: string },
    admin: string,
  ) {
    const overlay = customerOverlay.get(workspaceId)
    overlay[customerId] = {
      customerId,
      saleId: sale.id,
      saleName: sale.name,
      enrolledAt: new Date().toISOString(),
      enrolledByAdmin: admin,
    }
    storage.set(CUSTOMER_OVERLAY_KEY(workspaceId), overlay)
    window.dispatchEvent(new Event('eiz-customers-changed'))
  },
  unenroll(workspaceId: string, customerId: string) {
    const overlay = customerOverlay.get(workspaceId)
    delete overlay[customerId]
    storage.set(CUSTOMER_OVERLAY_KEY(workspaceId), overlay)
    window.dispatchEvent(new Event('eiz-customers-changed'))
  },
}

// Cached fetch helpers (so we don't regenerate on every render)
const cache = new Map<string, unknown>()
const cached = <T>(key: string, build: () => T): T => {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key) as T
}

export const dataset = {
  customers: (workspaceId: string) =>
    cached(`customers-${workspaceId}`, () => generateCustomers(workspaceId)),
  customersWithOverlay: (workspaceId: string) => {
    const base = dataset.customers(workspaceId)
    const overlay = customerOverlay.get(workspaceId)
    return base.map((c) => {
      const ov = overlay[c.id]
      if (!ov) return c
      return {
        ...c,
        enrolled: true,
        assignedSale: ov.saleName,
        enrolledAt: ov.enrolledAt,
        enrolledBy: ov.enrolledByAdmin,
      }
    })
  },
  products: (workspaceId: string) =>
    cached(`products-${workspaceId}`, () => generateProducts(workspaceId)),
  channels: (workspaceId: string) =>
    cached(`channels-${workspaceId}`, () => generateChannelStats(workspaceId)),
  monthly: (workspaceId: string) =>
    cached(`monthly-${workspaceId}`, () => generateMonthlyRevenue(workspaceId)),
  weekly: (workspaceId: string) =>
    cached(`weekly-${workspaceId}`, () => generateWeeklyRevenue(workspaceId)),
  hourly: (workspaceId: string) =>
    cached(`hourly-${workspaceId}`, () => generateHourlyDistribution(workspaceId)),
  daily: (workspaceId: string) =>
    cached(`daily-${workspaceId}`, () => generateDailyTrend(workspaceId)),
  provinces: (workspaceId: string) =>
    cached(`provinces-${workspaceId}`, () => generateProvinceTop(workspaceId)),
  cohorts: (workspaceId: string) =>
    cached(`cohorts-${workspaceId}`, () => generateCohortRetention(workspaceId)),
  returnReasons: (workspaceId: string) =>
    cached(`returns-${workspaceId}`, () => generateReturnReasons(workspaceId)),
  coPurchase: (workspaceId: string) =>
    cached(`co-purchase-${workspaceId}`, () => generateCoPurchase(workspaceId)),
  top20Popular: (workspaceId: string) =>
    cached(`top20-${workspaceId}`, () => generateTop20Popular(workspaceId)),
  channelMeta: CHANNELS,
}

// ===== Call priority — used by Enrollment Pipeline =====
export type CallPriority = 'hot' | 'warm' | 'cold'

export const computeCallPriority = (c: Customer): CallPriority => {
  const daysSinceLast = (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000
  if (c.status === 'champion' || c.status === 'loyal') {
    if (daysSinceLast < 60) return 'hot'
    return 'warm'
  }
  if (c.status === 'potential' && c.avgBasket > 800) return 'hot'
  if (c.status === 'at_risk' && c.totalSpend > 5000) return 'hot'
  if (c.status === 'new') return 'warm'
  if (c.status === 'at_risk' || c.status === 'potential') return 'warm'
  return 'cold'
}

export const CALL_PRIORITY_META: Record<
  CallPriority,
  { label: string; emoji: string; bg: string; text: string; border: string; sla: string }
> = {
  hot: {
    label: 'Hot — โทรวันนี้',
    emoji: '🔥',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    sla: 'ภายใน 24 ชม.',
  },
  warm: {
    label: 'Warm — โทรในสัปดาห์นี้',
    emoji: '🌡️',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    sla: 'ภายใน 7 วัน',
  },
  cold: {
    label: 'Cold — โทรในเดือนนี้',
    emoji: '❄️',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    sla: 'ภายใน 30 วัน',
  },
}

// Bulk update overlay for "Auto-Distribute"
const _ovKey = (workspaceId: string) => `customers.overlay.${workspaceId}`
export const distributeCustomers = (
  workspaceId: string,
  assignments: (CustomerEnrollmentOverlay & { callPriority?: CallPriority })[],
) => {
  const current = storage.get<Record<string, CustomerEnrollmentOverlay & { callPriority?: CallPriority }>>(
    _ovKey(workspaceId),
    {},
  )
  for (const a of assignments) {
    current[a.customerId] = a
  }
  storage.set(_ovKey(workspaceId), current)
  storage.set(`customers.distributed.${workspaceId}`, {
    at: new Date().toISOString(),
    count: assignments.length,
  })
  window.dispatchEvent(new Event('eiz-customers-changed'))
}

export const lastDistributedAt = (workspaceId: string) =>
  storage.get<{ at: string; count: number; reshuffled?: number; kept?: number } | null>(
    `customers.distributed.${workspaceId}`,
    null,
  )

// Toggle lock on a customer (admin sticky assignment)
export const toggleCustomerLock = (
  workspaceId: string,
  customerId: string,
  saleId: string,
  saleName: string,
  admin: string,
) => {
  const current = storage.get<Record<string, CustomerEnrollmentOverlay>>(
    _ovKey(workspaceId),
    {},
  )
  const existing = current[customerId]
  if (existing) {
    current[customerId] = {
      ...existing,
      locked: !existing.locked,
    }
  } else {
    current[customerId] = {
      customerId,
      saleId,
      saleName,
      enrolledAt: new Date().toISOString(),
      enrolledByAdmin: admin,
      locked: true,
    }
  }
  storage.set(_ovKey(workspaceId), current)
  window.dispatchEvent(new Event('eiz-customers-changed'))
}

// =========================================================
// REPLENISHMENT CONFIG — admin sets restock cycle per product
// =========================================================

export interface ReplenishmentConfig {
  productId: string
  productName: string
  cycleDays: number      // ลูกค้าซื้อใหม่ทุกกี่วัน
  reminderBefore: number // ส่ง reminder X วันก่อนครบรอบ
  enabled: boolean
  updatedAt: string
  updatedBy: string
}

const REPL_KEY = (workspaceId: string) => `replenishment.${workspaceId}`

export const replenishmentStore = {
  get(workspaceId: string): Record<string, ReplenishmentConfig> {
    return storage.get<Record<string, ReplenishmentConfig>>(REPL_KEY(workspaceId), {})
  },
  set(workspaceId: string, productId: string, config: ReplenishmentConfig) {
    const map = replenishmentStore.get(workspaceId)
    map[productId] = config
    storage.set(REPL_KEY(workspaceId), map)
    window.dispatchEvent(new Event('eiz-replenishment-changed'))
  },
  remove(workspaceId: string, productId: string) {
    const map = replenishmentStore.get(workspaceId)
    delete map[productId]
    storage.set(REPL_KEY(workspaceId), map)
    window.dispatchEvent(new Event('eiz-replenishment-changed'))
  },
  // Pre-populate with sensible defaults for top products
  seedDefaults(workspaceId: string, products: { id: string; name: string }[]) {
    const existing = replenishmentStore.get(workspaceId)
    if (Object.keys(existing).length > 0) return
    const defaults: Record<string, number> = {
      p01: 30, p02: 60, p03: 90, p04: 30, p05: 30, p06: 60, p07: 45,
      p08: 30, p09: 30, p10: 45, p11: 60, p12: 60, p13: 60, p14: 30, p15: 365,
    }
    const map: Record<string, ReplenishmentConfig> = {}
    products.slice(0, 10).forEach((p) => {
      map[p.id] = {
        productId: p.id,
        productName: p.name,
        cycleDays: defaults[p.id] ?? 45,
        reminderBefore: 7,
        enabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      }
    })
    storage.set(REPL_KEY(workspaceId), map)
  },
}
