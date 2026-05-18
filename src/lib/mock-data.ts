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

/* Frequency distribution + repeat-purchase metrics derived from the
 * customer roster (so totals stay consistent with other pages). */
export const generateFrequencyAnalysis = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const buckets = [
    { key: '1',   label: '1 ครั้ง',       count: 0, value: 0 },
    { key: '2',   label: '2 ครั้ง',       count: 0, value: 0 },
    { key: '3',   label: '3 ครั้ง',       count: 0, value: 0 },
    { key: '4-5', label: '4-5 ครั้ง',     count: 0, value: 0 },
    { key: '6+',  label: '6+ ครั้ง (VIP)', count: 0, value: 0 },
  ]
  for (const c of customers) {
    const o = c.orders
    const idx = o >= 6 ? 4 : o >= 4 ? 3 : o === 3 ? 2 : o === 2 ? 1 : 0
    buckets[idx].count += 1
    buckets[idx].value += c.totalSpend
  }
  /* Days-between-purchases distribution (calculated from firstBuy →
   *  lastBuy ÷ orders-1 for customers with ≥2 orders). */
  const gaps = [
    { key: '0-30',   label: '0-30 วัน',   count: 0 },
    { key: '31-60',  label: '31-60 วัน',  count: 0 },
    { key: '61-90',  label: '61-90 วัน',  count: 0 },
    { key: '91-180', label: '91-180 วัน', count: 0 },
    { key: '180+',   label: '180+ วัน',   count: 0 },
  ]
  for (const c of customers) {
    if (c.orders < 2) continue
    const first = new Date(c.firstBuy).getTime()
    const last  = new Date(c.lastBuy).getTime()
    const avg   = (last - first) / 86400_000 / (c.orders - 1)
    const idx = avg > 180 ? 4 : avg > 90 ? 3 : avg > 60 ? 2 : avg > 30 ? 1 : 0
    gaps[idx].count += 1
  }
  /* Monthly repeat-rate trend (last 6 months, mock cohort-based). */
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 13)
  const months = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
  const repeatTrend = months.map((m, i) => ({
    month: m.slice(2),
    repeatPct: Math.round((15 + rand() * 6 + i * 0.6) * 10) / 10,
    newPct:    Math.round((40 + rand() * 12 - i * 0.4) * 10) / 10,
  }))
  return { buckets, gaps, repeatTrend }
}

/* 6-month daily revenue / customers / orders / returns — feeds the
 * Sale Performance daily-trend chart that sits next to the monthly
 * bar chart. Anchored to today() so the last bar is "today". */
export const generateDaily6Month = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 15)
  const today = new Date()
  const days = 180
  return range(days).map((i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    const dow = d.getDay()
    const weekendBump = dow === 0 || dow === 6 ? 1.15 : 1
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toISOString().slice(0, 10),
      revenue:   Math.round((130 + rand() * 80) * 1000 * weekendBump),
      customers: Math.floor((85 + rand() * 60) * (dow === 0 || dow === 6 ? 0.85 : 1.05)),
      orders:    Math.floor((170 + rand() * 90) * weekendBump),
      returned:  Math.round((2 + rand() * 4) * 1000),
    }
  })
}

/* Channel × completion buckets — Sale Performance Cancellations &
 * Returns by Channel table needs `completed / cancelled / returned /
 * rate`. Derived from channels generator. */
export const generateChannelReturnSplit = (workspaceId: string) => {
  const channels = generateChannelStats(workspaceId)
  return channels.map((c) => {
    const cancelled = Math.floor(c.orders * c.cancelRate * 0.01)
    const returned = Math.floor(c.orders * 0.018)        // ~1.8% returns
    const completed = c.orders - cancelled - returned
    const rate = ((cancelled + returned) / Math.max(1, c.orders)) * 100
    return {
      channel: c.channel,
      color: c.color,
      completed,
      cancelled,
      returned,
      rate,
      revenue: c.revenue,
    }
  })
}

/* Top-10 customers ranked by riskScore — drives Sale Performance's
 *  "High-Risk Customers" mini-table. */
export const generateTopRiskCustomers = (workspaceId: string) => {
  const all = generateCustomers(workspaceId)
  return [...all]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map((c) => ({
      id:     c.id,
      name:   c.name,
      segment:c.segmentMarketing,
      status: c.status,
      risk:   Math.round(c.riskScore),
      spend:  c.totalSpend,
    }))
}

/* YTD growth — week-over-week / month-over-month / year-over-year
 *  rollups, plus a breakdown by dimension (channel/province/product/sale).
 *  The Growth page surfaces these. */
export const generateYtdGrowth = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 16)
  const monthly = generateMonthlyRevenue(workspaceId)
  const channels = generateChannelStats(workspaceId)
  const products = generateProducts(workspaceId)
  const provinces = generateProvinceTop(workspaceId)
  /* Overall — vs previous period */
  const overall = {
    wow: Math.round((rand() * 12 - 3) * 10) / 10,
    mom: Math.round((rand() * 18 - 4) * 10) / 10,
    yoy: Math.round((rand() * 35 + 5) * 10) / 10,
    weekRevenue:  Math.round((4.5 + rand() * 1.5) * 1_000_000),
    monthRevenue: monthly[monthly.length - 1].revenue,
    yearRevenue:  monthly.reduce((s, m) => s + m.revenue, 0),
  }
  const byChannel = channels.slice(0, 6).map((c) => ({
    name:    c.channel,
    color:   c.color,
    revenue: c.revenue,
    wow:     Math.round((rand() * 30 - 10) * 10) / 10,
    mom:     Math.round((rand() * 35 - 8) * 10) / 10,
    yoy:     Math.round((rand() * 50 + 5) * 10) / 10,
  }))
  const byProvince = provinces.slice(0, 6).map((p) => ({
    name:    p.province,
    revenue: p.revenue,
    wow:     Math.round((rand() * 28 - 8) * 10) / 10,
    mom:     Math.round((rand() * 32 - 6) * 10) / 10,
    yoy:     Math.round((rand() * 45 + 8) * 10) / 10,
  }))
  const byProduct = products.slice(0, 6).map((p) => ({
    name:    p.name.length > 28 ? p.name.slice(0, 27) + '…' : p.name,
    revenue: p.revenue,
    wow:     Math.round((rand() * 30 - 10) * 10) / 10,
    mom:     Math.round((rand() * 35 - 8) * 10) / 10,
    yoy:     Math.round((rand() * 50 + 0) * 10) / 10,
  }))
  const SALES = ['Pakamon T.', 'อุ๊', 'อีฟ', 'จูนJune', 'แก้ว', 'Nuu', 'ปุ๋', 'อ้อ']
  const bySale = SALES.map((s) => ({
    name:    s,
    revenue: Math.round((1.5 + rand() * 1.8) * 1_000_000),
    wow:     Math.round((rand() * 25 - 8) * 10) / 10,
    mom:     Math.round((rand() * 30 - 6) * 10) / 10,
    yoy:     Math.round((rand() * 45 + 5) * 10) / 10,
  }))
  return { overall, byChannel, byProvince, byProduct, bySale }
}

/* Urgent situations — 4 colour-coded cards driven by customer status.
 *  Used at the top of Sale Performance to direct the operator's
 *  attention to the highest-leverage groups today. */
export const generateUrgentSituations = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const cantLose   = customers.filter((c) => c.status === 'at_risk' && c.totalSpend > 5000)
  const atRisk     = customers.filter((c) => c.status === 'at_risk' && c.totalSpend <= 5000)
  const potential  = customers.filter((c) => c.status === 'potential')
  const newWaiting = customers.filter((c) => c.status === 'new' && c.orders === 1)
  return [
    {
      key:        'vip_leaving',
      color:      'red',
      icon:       '🚨',
      title:      'VIP กำลังหลุด',
      desc:       `ลูกค้า VIP ${cantLose.length.toLocaleString()} ราย เริ่มห่างหาย ต้องติดต่อด่วน`,
      count:      cantLose.length,
      impactBaht: cantLose.reduce((s, c) => s + c.totalSpend, 0),
    },
    {
      key:        'at_risk',
      color:      'orange',
      icon:       '⚠️',
      title:      'ลูกค้าเสี่ยงหลุด',
      desc:       `${atRisk.length.toLocaleString()} ราย เริ่มซื้อน้อยลง ต้องดูแล`,
      count:      atRisk.length,
      impactBaht: atRisk.reduce((s, c) => s + c.totalSpend, 0),
    },
    {
      key:        'potential',
      color:      'green',
      icon:       '⭐',
      title:      'ดาวรุ่ง',
      desc:       `ลูกค้าที่มีศักยภาพสูง ${potential.length.toLocaleString()} ราย`,
      count:      potential.length,
      impactBaht: potential.reduce((s, c) => s + c.totalSpend, 0),
    },
    {
      key:        'new_followup',
      color:      'blue',
      icon:       '👋',
      title:      'ลูกค้าใหม่รอ Follow-up',
      desc:       `${newWaiting.length.toLocaleString()} ราย ยังไม่กลับมาซื้อ`,
      count:      newWaiting.length,
      impactBaht: newWaiting.reduce((s, c) => s + c.totalSpend, 0),
    },
  ]
}

/* Per-month returns + lost revenue — fuels the Monthly Return Trend
 *  bar+line chart on the Returns page. */
export const generateMonthlyReturns = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 17)
  const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04']
  return months.map((m, i) => {
    const returned = Math.floor((80 + rand() * 80) * (i < 2 ? 1.4 : 1))
    const rate = Math.round((1.2 + rand() * 1.3 + (i < 2 ? 0.5 : 0)) * 100) / 100
    const lost = Math.round((100 + rand() * 200) * returned)
    return { month: m.slice(2), returned, rate, lost }
  })
}

/* Per-province returns — fuels the Returns "By Province" table. */
export const generateReturnsByProvince = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 18)
  return PROVINCES.slice(0, 10).map((p, i) => {
    const returned = Math.floor((90 - i * 7 + rand() * 20))
    const rate = Math.round((1.8 + rand() * 3 - i * 0.1) * 10) / 10
    const lost = Math.round((300 + rand() * 700) * returned)
    return { province: p, returned, rate: Math.max(0.5, rate), lost }
  }).sort((a, b) => b.rate - a.rate)
}

/* Staff return rate by month — fuels the staff heatmap. */
export const generateStaffReturnRate = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 19)
  const STAFF = [
    'จิน', 'Pakamon T./FRAME', 'อุ๊', 'อีฟ', 'จูนJune', 'แก้ว', 'Nuu', 'ปุ๋', 'อ้อ',
    'B.Sukarat (Mind)', 'กราย', 'ไอริน', 'Benyada Klk', 'ปุ๊ สุภาพร', 'dao',
    'แอดมินดอม', 'ฝ้ารุ่ง โกสรลักษณ์', 'System',
  ]
  const MONTHS = ['26-04', '26-03', '26-02', '26-01', '25-12', '25-11', '25-10', '25-09', '25-08', '25-07', '25-06']
  return STAFF.map((s) => {
    const monthlyData: Record<string, { rate: number; returns: number; total: number } | null> = {}
    let totalReturns = 0
    let totalOrders = 0
    for (const m of MONTHS) {
      if (rand() < 0.15) {
        monthlyData[m] = null
        continue
      }
      const total = Math.floor(80 + rand() * 1100)
      const rate = Math.round((0.5 + rand() * 4.5) * 10) / 10
      const returns = Math.floor((rate / 100) * total)
      monthlyData[m] = { rate, returns, total }
      totalReturns += returns
      totalOrders += total
    }
    const overall = totalOrders > 0
      ? Math.round((totalReturns / totalOrders) * 1000) / 10
      : 0
    return { staff: s, overall, totalReturns, totalOrders, monthlyData, months: MONTHS }
  }).sort((a, b) => b.overall - a.overall)
}

/* Top returned products — for Returns page "Top Returned Products". */
export const generateTopReturnedProducts = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 20)
  const products = generateProducts(workspaceId).slice(0, 15)
  return products.map((p) => ({
    id:       p.id,
    name:     p.name,
    returned: Math.floor((20 + rand() * 480) * (p.returnRate / 4)),
    lost:     Math.round(p.asp * (20 + rand() * 480) * (p.returnRate / 4)),
  })).sort((a, b) => b.returned - a.returned)
}

/* High-risk customers (frequent returns) — Returns page bottom table. */
export const generateHighRiskReturnCustomers = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 21)
  const all = generateCustomers(workspaceId)
  /* Pick a sample biased toward higher-return-rate, score them. */
  const NAMES = [
    'หรู่หน้า ไม่รู้', 'V.โรรา โบบกรี', 'อวยีดา อันทรกำแหง 1', 'V.สุนทร ขอครีลาคก',
    'P สาคร เคหารบมิ', 'พรลตรี สาว้วงค์', 'G.อ.ส.น.บัลพิทธ์ ทรัพย์อนันต์ศิริ',
    'ทิชาลักษณ์(K)', 'ภ.ศุภา', 'สมศักดิ์ ลีลาวัฒน์', 'ปานชนก แสงโภคา',
  ]
  const BADGES = ['first_buy_cooling', 'almost_lost', 'first_buy_warming', 'lost_customer', 'low_value_first_buy_aging']
  return NAMES.map((name, i) => {
    const orders = 3 + Math.floor(rand() * 4)
    const returned = orders - 1 - Math.floor(rand() * 2)
    const lost = Math.round(150 + rand() * 1800)
    const rate = (returned / orders) * 100
    return {
      id:       all[i]?.id ?? `risk-${i}`,
      name,
      orders,
      returned,
      lost,
      rate:     Math.round(rate * 10) / 10,
      badge:    BADGES[Math.floor(rand() * BADGES.length)],
    }
  }).sort((a, b) => b.rate - a.rate)
}

/* Monthly first-purchase vs returning revenue — for Frequency page. */
export const generateFirstVsReturning = (workspaceId: string) => {
  const monthly = generateMonthlyRevenue(workspaceId)
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 22)
  return monthly.map((m) => {
    const firstShare = 0.32 + rand() * 0.12  // ~38% first
    const first = Math.round(m.revenue * firstShare)
    const returning = m.revenue - first
    return {
      month:     m.month,
      first,
      returning,
    }
  })
}

/* Customer-status buckets for the donut on Frequency page. */
export const generateCustomerStatusBuckets = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const groups = [
    { key: 'good',    label: 'ดี',     statuses: ['champion', 'loyal'],            color: '#10b981' },
    { key: 'watch',   label: 'เฝ้าระวัง', statuses: ['potential', 'new'],            color: '#f59e0b' },
    { key: 'crisis',  label: 'วิกฤต',    statuses: ['at_risk'],                     color: '#f97316' },
    { key: 'lost',    label: 'หายไป',    statuses: ['lost', 'ghost'],               color: '#ef4444' },
  ]
  return groups.map((g) => ({
    ...g,
    count: customers.filter((c) => g.statuses.includes(c.status)).length,
  }))
}

/* Purchase-pattern donut — coarse buckets for "ซื้อครั้งเดียว / สม่ำเสมอ /
 *  ซื้อเพิ่มขึ้น / สำรวจ / จ่ายเยอะแต่ไม่บ่อย". */
export const generatePurchasePattern = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const total = customers.length
  /* Heuristic buckets — driven by orders + avgBasket */
  const onceOnly = customers.filter((c) => c.orders === 1).length
  const steady   = customers.filter((c) => c.orders >= 3 && c.orders <= 5).length
  const growing  = customers.filter((c) => c.orders >= 6 && c.orders <= 9).length
  const explorer = customers.filter((c) => c.orders === 2).length
  const bigSpender = customers.filter((c) => c.orders >= 10 || c.avgBasket > 1500).length
  return [
    { key: 'once',    label: 'ซื้อครั้งเดียว',    count: onceOnly,                        color: '#6366f1' },
    { key: 'steady',  label: 'สม่ำเสมอ',          count: steady,                          color: '#8b5cf6' },
    { key: 'growing', label: 'ซื้อเพิ่มขึ้น',      count: growing,                         color: '#a855f7' },
    { key: 'explore', label: 'สำรวจ',             count: explorer,                        color: '#ec4899' },
    { key: 'big',     label: 'จ่ายเยอะแต่ไม่บ่อย', count: Math.min(bigSpender, total / 20), color: '#f43f5e' },
  ]
}

/* Per-frequency table with avg-basket, customer count, orders, total. */
export const generateFrequencyTable = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const total = customers.length
  const totalSpend = customers.reduce((s, c) => s + c.totalSpend, 0)
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0)
  const buckets = [
    { key: '1',  min: 1, max: 1 },
    { key: '2',  min: 2, max: 2 },
    { key: '3',  min: 3, max: 3 },
    { key: '4',  min: 4, max: 4 },
    { key: '5',  min: 5, max: 5 },
    { key: '6',  min: 6, max: 6 },
    { key: '7',  min: 7, max: 7 },
    { key: '8',  min: 8, max: 8 },
    { key: '9',  min: 9, max: 9 },
    { key: '10+',min: 10, max: 999 },
  ]
  return {
    rows: buckets.map((b) => {
      const list = customers.filter((c) => c.orders >= b.min && c.orders <= b.max)
      const value = list.reduce((s, c) => s + c.totalSpend, 0)
      const orders = list.reduce((s, c) => s + c.orders, 0)
      return {
        bucket:    b.key,
        count:     list.length,
        share:     (list.length / total) * 100,
        orders,
        value,
        avgBasket: orders > 0 ? value / orders : 0,
      }
    }),
    totals: { count: total, orders: totalOrders, value: totalSpend, share: 100 },
  }
}

/* Retention 3 month / 6 month / repeat rate — for Frequency page right panel. */
export const generateRetentionStats = (workspaceId: string) => {
  const customers = generateCustomers(workspaceId)
  const repeat = customers.filter((c) => c.orders >= 2).length
  const repeatRate = (repeat / customers.length) * 100
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 23)
  return {
    m3: Math.round((18 + rand() * 4) * 100) / 100,
    m6: Math.round((19 + rand() * 5) * 100) / 100,
    repeatRate: Math.round(repeatRate * 100) / 100,
  }
}

/* 30-day return-rate trend — paired with the new Returns page. */
export const generateReturnTrend = (workspaceId: string) => {
  const rand = seededRandom(seedFromWorkspace(workspaceId) + 14)
  const today = new Date()
  return range(30).map((i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      returnRate: Math.round((1.4 + rand() * 1.6) * 100) / 100,
      cancelRate: Math.round((0.6 + rand() * 0.8) * 100) / 100,
    }
  })
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
  frequency: (workspaceId: string) =>
    cached(`freq-${workspaceId}`, () => generateFrequencyAnalysis(workspaceId)),
  returnTrend: (workspaceId: string) =>
    cached(`ret-${workspaceId}`, () => generateReturnTrend(workspaceId)),
  daily6m: (workspaceId: string) =>
    cached(`daily6m-${workspaceId}`, () => generateDaily6Month(workspaceId)),
  channelReturnSplit: (workspaceId: string) =>
    cached(`chret-${workspaceId}`, () => generateChannelReturnSplit(workspaceId)),
  topRiskCustomers: (workspaceId: string) =>
    cached(`risk-${workspaceId}`, () => generateTopRiskCustomers(workspaceId)),
  ytdGrowth: (workspaceId: string) =>
    cached(`ytd-${workspaceId}`, () => generateYtdGrowth(workspaceId)),
  monthlyReturns: (workspaceId: string) =>
    cached(`mret-${workspaceId}`, () => generateMonthlyReturns(workspaceId)),
  returnsByProvince: (workspaceId: string) =>
    cached(`retp-${workspaceId}`, () => generateReturnsByProvince(workspaceId)),
  staffReturnRate: (workspaceId: string) =>
    cached(`srat-${workspaceId}`, () => generateStaffReturnRate(workspaceId)),
  topReturnedProducts: (workspaceId: string) =>
    cached(`trp-${workspaceId}`, () => generateTopReturnedProducts(workspaceId)),
  highRiskReturnCustomers: (workspaceId: string) =>
    cached(`hrrc-${workspaceId}`, () => generateHighRiskReturnCustomers(workspaceId)),
  firstVsReturning: (workspaceId: string) =>
    cached(`fvr-${workspaceId}`, () => generateFirstVsReturning(workspaceId)),
  customerStatusBuckets: (workspaceId: string) =>
    cached(`csb-${workspaceId}`, () => generateCustomerStatusBuckets(workspaceId)),
  purchasePattern: (workspaceId: string) =>
    cached(`pp-${workspaceId}`, () => generatePurchasePattern(workspaceId)),
  frequencyTable: (workspaceId: string) =>
    cached(`ftbl-${workspaceId}`, () => generateFrequencyTable(workspaceId)),
  retentionStats: (workspaceId: string) =>
    cached(`rstat-${workspaceId}`, () => generateRetentionStats(workspaceId)),
  urgent: (workspaceId: string) =>
    cached(`urg-${workspaceId}`, () => generateUrgentSituations(workspaceId)),
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
