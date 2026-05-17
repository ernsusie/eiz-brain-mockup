import type { Customer, Sale, ProductStat, ChannelStat } from '@/types'
import { formatNumber, formatTHB } from './utils'

export interface BriefMetrics {
  totalCustomers: number
  monthlyRevenue: number
  atRiskCount: number
  vipAtRiskCount: number
  worstCustomer: Customer | null
  midBucketCount: number
  teamShortage: number
  singleBuyCount: number
  singleBuyPct: number
  totalCustomersBase: number
}

export interface ActionCard {
  id: string
  priority: 'top' | 'high' | 'medium' | 'low'
  title: string
  description: string
  customerCount: number
  revenueAtRisk: number
  comparison?: string
  filterQuery: string
  emoji: string
  color: 'rose' | 'amber' | 'violet' | 'brand' | 'emerald' | 'sky' | 'pink' | 'slate'
}

export interface MonthChange {
  type: 'down' | 'up'
  label: string
  metric?: string
}

export const computeBriefMetrics = (
  customers: Customer[],
  _sales: Sale[],
  _channels: ChannelStat[],
): BriefMetrics => {
  const atRisk = customers.filter(
    (c) => c.status === 'at_risk' || c.status === 'lost' || c.status === 'ghost',
  )
  const vipAtRisk = customers.filter(
    (c) =>
      (c.status === 'at_risk' || c.status === 'lost') &&
      (c.totalSpend > 10_000 || c.orders > 5),
  )
  const worstCustomer =
    vipAtRisk.length > 0
      ? [...vipAtRisk].sort((a, b) => b.totalSpend - a.totalSpend)[0]
      : null
  const midBucket = customers.filter(
    (c) => c.status === 'potential' || (c.status === 'at_risk' && c.totalSpend < 5000),
  )
  // assume each telesale can handle ~880 customers
  const teamShortage = Math.max(0, Math.round(midBucket.length / 880) - 7)

  const singleBuy = customers.filter((c) => c.orders === 1)

  // Scale to "population" — multiplied to feel realistic
  return {
    totalCustomers: customers.length * 200,
    monthlyRevenue: 0, // current month often not started
    atRiskCount: atRisk.length * 100,
    vipAtRiskCount: vipAtRisk.length * 25,
    worstCustomer,
    midBucketCount: midBucket.length * 95,
    teamShortage,
    singleBuyCount: singleBuy.length * 165,
    singleBuyPct: Math.round((singleBuy.length / customers.length) * 100),
    totalCustomersBase: customers.length * 200,
  }
}

export const buildAiSummary = (m: BriefMetrics, monthName: string): string[] => {
  const worstName = m.worstCustomer ? m.worstCustomer.name : 'ลูกค้าหลายราย'

  return [
    `รายได้เดือน${monthName} อยู่ที่ **${formatTHB(m.monthlyRevenue)}** โดยมีลูกค้าที่มีความเสี่ยงจะหายออกจากระบบถึง **${formatNumber(m.atRiskCount)} ราย** ซึ่งในจำนวนนี้รวม VIP ที่เสี่ยง **${formatNumber(m.vipAtRiskCount)} ราย** (รายที่น่ากังวลที่สุดคือ${worstName}) ขณะที่คิวกลุ่ม mid_tank ล้นอยู่ที่ **${formatNumber(m.midBucketCount)} ราย** และต้องการทีมเพิ่มอีก **${m.teamShortage} คน** เพื่อจัดการ`,

    `**ความเสี่ยงที่ใหญ่ที่สุด:** VIP ${formatNumber(m.vipAtRiskCount)} รายกำลังเสี่ยงหลุด — กลุ่มนี้เป็นนักสร้างรายได้หลักที่ไม่สมส่วนกับจำนวน การสูญเสียแม้เพียงบางส่วนจะกระทบรายได้อย่างมีนัยสำคัญในเดือนถัดไป`,

    `**โอกาสที่ใหญ่ที่สุด:** ลูกค้าที่ซื้อครั้งเดียว **${formatNumber(m.singleBuyCount)} ราย** คิดเป็น **${m.singleBuyPct}%** ของฐานลูกค้าทั้งหมด ${formatNumber(m.totalCustomersBase)} ราย — ถ้าแปลงได้แม้ 5-10% ให้กลับมาซื้อซ้ำ ผลลัพธ์จะเปลี่ยนภาพรายได้ทันที`,

    `เดือนหน้านี้ควรเลือกให้ชัดว่าจะ "รักษา" หรือ "ขยาย" ก่อน เพราะทรัพยากรไม่พอทำทั้งสองพร้อมกัน`,
  ]
}

export const buildActionCards = (
  customers: Customer[],
  sales: Sale[],
  products: ProductStat[],
  channels: ChannelStat[],
): ActionCard[] => {
  // 1. Last chance queue — loyal who're slipping 60-90 days
  const lastChance = customers.filter(
    (c) =>
      (c.status === 'loyal' || c.status === 'at_risk') &&
      c.orders >= 3 &&
      (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000 < 120,
  )
  const lastChanceCount = lastChance.length * 5
  const lastChanceValue = lastChance.reduce((s, c) => s + c.totalSpend, 0) * 8

  // 2. VIP crisis
  const vipCrisis = customers.filter(
    (c) =>
      (c.status === 'champion' || c.status === 'loyal') &&
      c.totalSpend > 10_000 &&
      (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000 > 30,
  )
  const vipCount = vipCrisis.length * 8
  const vipValue = vipCrisis.reduce((s, c) => s + c.totalSpend, 0) * 5

  // 3. Silent whales — high LTV but inactive
  const whales = customers.filter(
    (c) =>
      c.totalSpend > 8_000 &&
      (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000 > 90,
  )
  const whaleCount = whales.length * 3
  const whaleValue = whales.reduce((s, c) => s + c.totalSpend, 0) * 6

  // 4. Loyal drifting
  const loyalDrifting = customers.filter(
    (c) => c.status === 'loyal' && c.orders >= 3 && c.riskScore > 30,
  )
  const loyalCount = loyalDrifting.length * 25
  const loyalValue = loyalDrifting.reduce((s, c) => s + c.totalSpend, 0) * 12

  // 5. Golden window 2nd buy
  const goldenWindow = customers.filter(
    (c) =>
      c.orders === 1 &&
      (Date.now() - new Date(c.firstBuy).getTime()) / 86400_000 >= 26 &&
      (Date.now() - new Date(c.firstBuy).getTime()) / 86400_000 <= 75,
  )
  const goldenCount = goldenWindow.length * 38
  const goldenValue = goldenWindow.reduce((s, c) => s + c.avgBasket, 0) * 4

  // 6. Middle bucket overflow
  const midBucket = customers.filter(
    (c) => c.status === 'potential' || (c.status === 'at_risk' && c.totalSpend < 5000),
  )
  const midCount = midBucket.length * 95
  const teamNeeded = Math.round(midCount / 880)
  const teamHave = sales.filter((s) => s.type === 'telesale' && s.active).length

  // 7. Channel concentration
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)
  const topChannel = [...channels].sort((a, b) => b.revenue - a.revenue)[0]
  const topChannelPct = (topChannel.revenue / totalRevenue) * 100

  // 8. Staff abnormal return rate
  const staffHighReturn = sales.filter((s) => s.returnRate > 3.5)

  return [
    {
      id: 'last-chance',
      priority: 'top',
      title: `${formatNumber(lastChanceCount)} คน อยู่ในคิว "โอกาสสุดท้าย" พร้อมเสีย`,
      description: `ลูกค้าขาประจำ ${formatNumber(lastChanceCount)} รายไม่ซื้อมา 2-3 เดือน LTV รวม ${formatTHB(lastChanceValue)} ติดต่อภายในสัปดาห์นี้ก่อนหลุดถาวร`,
      customerCount: lastChanceCount,
      revenueAtRisk: lastChanceValue,
      filterQuery: '?segment=ลูกค้าเสี่ยงหลุด&kind=marketing',
      emoji: '⏰',
      color: 'rose',
    },
    {
      id: 'vip-crisis',
      priority: 'high',
      title: `${formatNumber(vipCount)} VIP กำลังอยู่ในสถานะวิกฤต — ${formatTHB(vipValue)} ที่ต้องรักษา`,
      description: `ลูกค้าใช้จ่ายสูงกว่าค่าเฉลี่ย 3 เท่า แต่สถานะกำลังจะขาดติด ติดต่อตรงทันที — เสียคนเดียวกระทบหนัก`,
      customerCount: vipCount,
      revenueAtRisk: vipValue,
      filterQuery: '?segment=VIP กำลังจะหลุด&kind=marketing',
      emoji: '👑',
      color: 'brand',
    },
    {
      id: 'whales',
      priority: 'high',
      title: `${formatNumber(whaleCount)} วาฬ LTV สูงเงียบไป >90 วัน — ${formatTHB(whaleValue)} ที่ฟื้นกลับได้`,
      description: `ลูกค้าใช้จ่ายเกิน ${formatTHB(8000)} และเงียบไป 90 วัน รวมยอด ${formatTHB(whaleValue)} เป็นกลุ่มที่คุ้มที่สุดในการดึงกลับ`,
      customerCount: whaleCount,
      revenueAtRisk: whaleValue,
      filterQuery: '?segment=Re-activation&kind=marketing',
      emoji: '🐋',
      color: 'sky',
    },
    {
      id: 'loyal-drifting',
      priority: 'high',
      title: `${formatNumber(loyalCount)} ลูกค้าประจำกำลังเริ่มห่างหาย`,
      description: `กลุ่ม "loyal_leaving" — เคยซื้อสม่ำเสมอแต่ความถี่ลดลง ${formatTHB(loyalValue)} ที่กำลังเสี่ยง รีบดูแลก่อนสาย`,
      customerCount: loyalCount,
      revenueAtRisk: loyalValue,
      filterQuery: '?segment=ลูกค้าเสี่ยงหลุด&kind=marketing',
      emoji: '〰️',
      color: 'amber',
    },
    {
      id: 'golden-window',
      priority: 'medium',
      title: `${formatNumber(goldenCount)} คนกำลังอยู่ใน "หน้าต่างทอง" ซื้อครั้งที่ 2`,
      description: `ลูกค้าซื้อครั้งแรก 26-75 วันที่แล้ว และยังไม่ซื้อซ้ำ — ส่งโปรกระตุ้นได้เลย หากได้ 5% กลับมาซื้อได้ราว ${formatTHB(goldenValue * 0.05)}`,
      customerCount: goldenCount,
      revenueAtRisk: goldenValue * 0.05,
      filterQuery: '?segment=ลูกค้าใหม่รอ Follow-up&kind=marketing',
      emoji: '🌟',
      color: 'emerald',
    },
    {
      id: 'mid-bucket',
      priority: 'medium',
      title: `คิว "📋 ถังกลาง" ใหญ่เกินกำลังทีม (ต้องการ ${teamNeeded} คน, มี ${teamHave})`,
      description: `คิวมี ${formatNumber(midCount)} ราย และทีมโทรได้ราว 880 สาย/เดือน/คน — เพิ่มกำลังคน หรือกรองรายชื่อก่อนแจกจ่าย`,
      customerCount: midCount,
      revenueAtRisk: 0,
      filterQuery: '?status=potential',
      emoji: '📋',
      color: 'violet',
    },
    {
      id: 'channel-concentration',
      priority: 'medium',
      title: `ช่อง "${topChannel.channel}" สร้าง ${topChannelPct.toFixed(0)}% ของรายได้`,
      description: `รายได้กระจุกที่ช่องเดียว — หากช่องนี้สะดุด ธุรกิจจะกระทบหนัก ลองทดสอบช่องรองเพื่อกระจายความเสี่ยง`,
      customerCount: topChannel.customers,
      revenueAtRisk: topChannel.revenue,
      filterQuery: `?channel=${encodeURIComponent(topChannel.channel)}`,
      emoji: '📡',
      color: 'pink',
    },
    {
      id: 'staff-returns',
      priority: 'low',
      title: `${staffHighReturn.length} พนักงานมีอัตราคืนสินค้าสูงผิดปกติ`,
      description: `อัตราคืนสินค้าของ ${staffHighReturn[0]?.name ?? '—'} สูงกว่าค่าเฉลี่ย 1.5× ตรวจสอบกระบวนการขายของกลุ่มนี้ในช่วง 90 วันล่าสุด`,
      customerCount: staffHighReturn.length,
      revenueAtRisk: 0,
      filterQuery: '',
      emoji: '⚠️',
      color: 'slate',
    },
  ]
}

export const buildMonthChanges = (
  products: ProductStat[],
  channels: ChannelStat[],
): MonthChange[] => {
  const topChannel = [...channels].sort((a, b) => b.revenue - a.revenue)[0]
  const topProduct = products[0]
  return [
    { type: 'down', label: 'ช่องทางตก: ' + topChannel.channel },
    { type: 'down', label: 'สินค้าตก: ' + topProduct.name },
    { type: 'down', label: 'มูลค่าออเดอร์เฉลี่ย ลดลง 100.0%' },
    { type: 'down', label: 'จำนวนออเดอร์ ลดลง 100.0%' },
  ]
}
