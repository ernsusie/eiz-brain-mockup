import type { FilterValue } from '@/components/FilterBar'
import { dataset, salesStore, lastDistributedAt } from './mock-data'
import { formatNumber, formatTHB } from './utils'
import { applyCustomerFilter, isFilterActive } from './dashboard-filter'

export interface PageSummary {
  title: string
  scope: string
  paragraphs: string[]
  bullets: { label: string; value: string }[]
  recommendation: string
}

const filterScope = (filter: FilterValue): string => {
  const parts: string[] = []
  if (filter.range !== 'all') parts.push(`ช่วงเวลา ${filter.range}`)
  if (filter.channels.length) parts.push(`ช่องทาง ${filter.channels.join(', ')}`)
  if (filter.status.length) parts.push(`สถานะ ${filter.status.join(', ')}`)
  if (filter.province) parts.push(`จังหวัด ${filter.province}`)
  if (filter.search) parts.push(`คำค้น "${filter.search}"`)
  return parts.length ? parts.join(' · ') : 'ไม่มี filter — ดูข้อมูลทั้งหมด'
}

export const generatePageSummary = (
  pathname: string,
  workspaceId: string,
  filter: FilterValue,
): PageSummary => {
  const customers = dataset.customersWithOverlay(workspaceId)
  const filtered = applyCustomerFilter(customers, filter)
  const ratio = filtered.length / Math.max(1, customers.length)
  const channels = dataset.channels(workspaceId)
  const products = dataset.products(workspaceId)
  const provinces = dataset.provinces(workspaceId)
  const sales = salesStore.get(workspaceId)
  const monthly = dataset.monthly(workspaceId)

  const scope = filterScope(filter)

  // Route-specific summaries
  if (pathname.startsWith('/dashboard/products') || pathname === '/dashboard/products') {
    const topProduct = products[0]
    const inactive = 403
    return {
      title: 'สรุป Products',
      scope,
      paragraphs: [
        `สินค้าที่ขายอยู่ ${products.length} ตัว · สินค้าขายดีอันดับ 1 คือ **${topProduct.name}** ทำรายได้ ${formatTHB(topProduct.revenue, { compact: true })} ครอง share ~${((topProduct.revenue / products.reduce((s, p) => s + p.revenue, 0)) * 100).toFixed(0)}% ของยอดรวม`,
        `มีสินค้าที่ inactive 60 วัน อยู่ ${inactive} ตัว ควรพิจารณาเลิกขายหรือลด stock ส่วนสินค้า return rate สูง (>4%) มี ${products.filter((p) => p.returnRate > 4).length} ตัว ต้องตรวจคุณภาพ`,
      ],
      bullets: [
        { label: 'Top product', value: topProduct.name.slice(0, 32) + '...' },
        { label: 'Avg selling price', value: formatTHB(Math.round(products.reduce((s, p) => s + p.asp, 0) / products.length)) },
        { label: 'Active SKU', value: String(products.length) },
        { label: 'High return SKU', value: String(products.filter((p) => p.returnRate > 4).length) },
      ],
      recommendation:
        'แนะนำให้ดู Co-Purchase Matrix เพื่อหาคู่สินค้าที่ขายร่วมกันบ่อย แล้วทำ bundle ลด single-buy rate',
    }
  }

  if (pathname.startsWith('/dashboard/geography')) {
    const top = provinces[0]
    const top3Share = (provinces.slice(0, 3).reduce((s, p) => s + p.revenue, 0) / provinces.reduce((s, p) => s + p.revenue, 0)) * 100
    return {
      title: 'สรุปพื้นที่ขาย',
      scope,
      paragraphs: [
        `รายได้กระจุกที่ **${top.province}** เป็นหลัก คิดเป็น ${((top.revenue / provinces.reduce((s, p) => s + p.revenue, 0)) * 100).toFixed(0)}% ของยอดรวม — 3 จังหวัดแรกครองส่วนแบ่ง ${top3Share.toFixed(0)}%`,
        `ภาคกลาง + ตะวันออก เป็นแหล่งรายได้หลัก ส่วนภาคเหนือ-ใต้ ยังมีโอกาสขยาย — จังหวัดท่องเที่ยว (ภูเก็ต, เชียงใหม่) AOV สูงแต่ frequency ต่ำ เหมาะกับโปร trial pack`,
      ],
      bullets: [
        { label: 'Top province', value: top.province },
        { label: 'Top 3 share', value: `${top3Share.toFixed(0)}%` },
        { label: 'Total provinces', value: '262' },
      ],
      recommendation:
        'แนะนำเพิ่ม ads budget ในภาคเหนือและภาคใต้ เพื่อกระจายความเสี่ยงจากการพึ่งภาคกลาง',
    }
  }

  if (pathname.startsWith('/dashboard/retention')) {
    const repeat = customers.filter((c) => c.orders > 1).length
    const repeatRate = (repeat / customers.length) * 100
    return {
      title: 'สรุป Retention',
      scope,
      paragraphs: [
        `Repeat rate ปัจจุบัน **${repeatRate.toFixed(1)}%** — ${repeatRate >= 25 ? 'อยู่เกณฑ์ดี' : 'ยังต่ำ ต้องเพิ่ม win-back campaign'}`,
        `ลูกค้าใหม่ส่วนใหญ่ไม่กลับมาซื้อในเดือนที่ 2 — ควรส่ง onboarding sequence ใน 14 วันแรก และ flash deal ที่วันที่ 14-21`,
      ],
      bullets: [
        { label: 'Repeat customers', value: formatNumber(repeat) },
        { label: 'Repeat rate', value: `${repeatRate.toFixed(1)}%` },
        { label: 'Champions', value: formatNumber(customers.filter((c) => c.status === 'champion').length) },
      ],
      recommendation:
        'ตั้ง trigger "ส่งคูปอง 150฿ วันที่ 14 หลังซื้อครั้งแรก" เพื่อกระตุ้น M1 retention',
    }
  }

  if (pathname.startsWith('/dashboard/growth')) {
    const growthPct = ((monthly[monthly.length - 1].revenue - monthly[0].revenue) / monthly[0].revenue) * 100
    return {
      title: 'สรุป Growth',
      scope,
      paragraphs: [
        `ยอดเติบโต **${growthPct.toFixed(1)}%** ในช่วง 6 เดือนที่ผ่านมา — ${growthPct > 5 ? 'ดี' : 'ตก ต้องเร่งเครื่อง'}`,
        `ยอดขายช่วงเวลา peak อยู่ที่ 10:00-14:00 และ 19:00-22:00 — แนะนำจัด flash sale หรือ ปรับเวลาตอบแชทของแอดมินในช่วงนี้`,
      ],
      bullets: [
        { label: 'MoM growth', value: `${growthPct.toFixed(1)}%` },
        { label: 'Peak hours', value: '10-14 · 19-22' },
        { label: 'Channels with growth', value: String(channels.filter((c) => c.share > 5).length) },
      ],
      recommendation:
        'เพิ่มงบ ads ในช่วง peak hour และทดสอบช่องทางรอง (Line, TikTok) เพื่อกระจาย channel risk',
    }
  }

  if (pathname.startsWith('/dashboard')) {
    const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0) * ratio
    const atRisk = filtered.filter((c) => c.status === 'at_risk' || c.status === 'lost')
    const atRiskValue = atRisk.reduce((s, c) => s + c.totalSpend, 0)
    return {
      title: 'สรุป Sale Performance',
      scope,
      paragraphs: [
        `รายได้รวม **${formatTHB(totalRevenue, { compact: true })}** · ลูกค้า ${formatNumber(filtered.length * 200)} ราย${isFilterActive(filter) ? ' (filtered)' : ''}`,
        `กลุ่ม at-risk มี ${formatNumber(atRisk.length * 80)} ราย คิดเป็นมูลค่าที่เสี่ยงสูญเสีย **${formatTHB(atRiskValue, { compact: true })}** — ต้องเร่ง telesale contact ภายใน 14 วัน`,
        `ช่องทางหลักคือ ${channels[0].channel} ครองส่วนแบ่ง ${channels[0].share.toFixed(0)}% — ${channels[0].share > 60 ? 'กระจุกเกินไป ควร diversify' : 'อยู่ในเกณฑ์ปกติ'}`,
      ],
      bullets: [
        { label: 'Revenue (6M)', value: formatTHB(totalRevenue, { compact: true }) },
        { label: 'Total customers', value: formatNumber(filtered.length * 200) },
        { label: 'At-risk value', value: formatTHB(atRiskValue, { compact: true }) },
        { label: 'Top channel', value: channels[0].channel },
      ],
      recommendation:
        'แนะนำให้คลิกที่ status card "at-risk" เพื่อ cross-filter แล้วดู channel breakdown — หาว่าลูกค้าเสี่ยงมาจากช่องทางไหนเยอะที่สุด',
    }
  }

  if (pathname.startsWith('/segments/rfm')) {
    return {
      title: 'สรุป RFM Analysis',
      scope,
      paragraphs: [
        `RFM แบ่งลูกค้าเป็น 11 segments ตามมาตรฐาน · Champions ${formatNumber(customers.filter((c) => c.status === 'champion').length)} ราย เป็น base ที่สำคัญที่สุด`,
        `กลุ่ม "Can't Lose" และ "At Risk" รวมกัน ${formatNumber(customers.filter((c) => c.status === 'at_risk' || c.status === 'lost').length)} ราย — เป็น top priority สำหรับ telesale`,
      ],
      bullets: [
        { label: 'Champions', value: formatNumber(customers.filter((c) => c.status === 'champion').length) },
        { label: 'At Risk', value: formatNumber(customers.filter((c) => c.status === 'at_risk').length) },
        { label: 'Lost', value: formatNumber(customers.filter((c) => c.status === 'lost').length) },
      ],
      recommendation:
        'เริ่มจาก "Can\'t Lose Them" ก่อน — มูลค่าสูงสุดต่อหัว ใช้ best offer ที่เคยมี',
    }
  }

  if (pathname.startsWith('/segments')) {
    return {
      title: 'สรุป Customer Segments',
      scope,
      paragraphs: [
        `Segments แบ่งเป็น 3 ระดับ: Marketing (กว้าง) → Telesale (ต้องคุย 1:1) → Ads (paid traffic) — แต่ละระดับเป็น subset ของขั้นบน`,
        `ลูกค้าทั้งหมด ${formatNumber(customers.length * 200)} ราย กระจายอยู่ใน 5 marketing segments หลัก โดยกลุ่ม "ลูกค้าเสี่ยงหลุด" เป็นกลุ่มใหญ่ที่สุด`,
      ],
      bullets: [
        { label: 'Total customers', value: formatNumber(customers.length * 200) },
        { label: 'Marketing segments', value: '5' },
        { label: 'Telesale segments', value: '4' },
      ],
      recommendation: 'เริ่มจัดลำดับ priority จาก Telesale segment ก่อน เพราะ ROI สูงที่สุดต่อ effort',
    }
  }

  if (pathname.startsWith('/customers')) {
    return {
      title: 'สรุปลูกค้าทั้งหมด',
      scope,
      paragraphs: [
        `แสดงลูกค้า ${formatNumber(filtered.length)} ราย (จากทั้งหมด ${formatNumber(customers.length)} รายในระบบ)${isFilterActive(filter) ? ' หลังจาก filter' : ''}`,
        `High AOV customers (ยอดเฉลี่ย > 2,790) มี ${customers.filter((c) => c.highAov).length} ราย — กลุ่มนี้ต้องดูแลพิเศษ`,
      ],
      bullets: [
        { label: 'Displayed', value: formatNumber(filtered.length) },
        { label: 'Total in system', value: formatNumber(customers.length) },
        { label: 'High AOV', value: String(customers.filter((c) => c.highAov).length) },
      ],
      recommendation:
        'ใช้ปุ่ม AI ที่แต่ละ row เพื่อดู insight + สคริปต์โทรเฉพาะคน หรือ filter by status เพื่อดูกลุ่ม at-risk',
    }
  }

  if (pathname.startsWith('/enrollment')) {
    const enrolled = customers.filter((c) => c.enrolled).length
    const dist = lastDistributedAt(workspaceId)
    return {
      title: 'สรุป Enrollment',
      scope,
      paragraphs: [
        `Enrolled ${formatNumber(enrolled)} ราย จาก ${formatNumber(customers.length)} รายที่ callable · ทีม telesale มี ${sales.filter((s) => s.type === 'telesale' && s.active).length} คน active`,
        dist
          ? `Reshuffle ล่าสุดเมื่อ ${new Date(dist.at).toLocaleDateString('th-TH')} กระจาย ${dist.count} ราย`
          : 'ยังไม่เคยกด reshuffle — กดเพื่อกระจายให้ทีม',
      ],
      bullets: [
        { label: 'Enrolled', value: formatNumber(enrolled) },
        { label: 'Active telesales', value: String(sales.filter((s) => s.type === 'telesale' && s.active).length) },
        { label: 'Avg/sale', value: String(Math.round(enrolled / Math.max(1, sales.filter((s) => s.active).length))) },
      ],
      recommendation:
        'กด Reshuffle ทุกต้นเดือน · Lock ลูกค้า VIP ไว้ที่ sale คนเก่ง ไม่ให้สลับ',
    }
  }

  if (pathname.startsWith('/sales')) {
    const totalAchieve = sales.reduce((s, x) => s + x.achievedMonthly, 0)
    const totalKpi = sales.reduce((s, x) => s + x.kpiMonthly, 0)
    const pct = (totalAchieve / totalKpi) * 100
    return {
      title: 'สรุป Sales Team',
      scope,
      paragraphs: [
        `Achievement รวม ${pct.toFixed(0)}% · top performer คือ ${[...sales].sort((a, b) => b.achievedMonthly - a.achievedMonthly)[0].name}`,
        `ทีมที่ทำได้เกินเป้ามี ${sales.filter((s) => s.achievedMonthly >= s.kpiMonthly).length} คน · ตามหลังเป้า ${sales.filter((s) => s.achievedMonthly / s.kpiMonthly < 0.7).length} คน`,
      ],
      bullets: [
        { label: 'Total team', value: String(sales.length) },
        { label: 'Achievement', value: `${pct.toFixed(0)}%` },
        { label: 'Top performer', value: [...sales].sort((a, b) => b.achievedMonthly - a.achievedMonthly)[0].name },
      ],
      recommendation:
        'แนะนำ 1:1 coaching กับ sale ที่ทำได้ต่ำกว่า 40% · ใช้ best practice จาก top performer สร้าง training',
    }
  }

  if (pathname.startsWith('/replenishment')) {
    return {
      title: 'สรุป Replenishment',
      scope,
      paragraphs: [
        `Replenishment config ตั้งรอบการเติมสินค้าของแต่ละ SKU เพื่อให้ AI ทำนายว่าลูกค้าควรซื้อซ้ำเมื่อไหร่`,
        `เมื่อลูกค้าใกล้ครบรอบ ระบบจะส่งโปรกระตุ้นอัตโนมัติ ลด churn จากการลืม reorder`,
      ],
      bullets: [
        { label: 'Active SKU', value: String(products.length) },
        { label: 'Configured', value: 'ดูในหน้า' },
      ],
      recommendation: 'เริ่มจาก top 5 products ก่อน · ตั้ง remind 7 วันก่อนครบรอบ',
    }
  }

  return {
    title: 'สรุปหน้านี้',
    scope,
    paragraphs: ['ยังไม่มี summary สำหรับหน้านี้ — ลองเปลี่ยนหน้าหรือ refresh'],
    bullets: [],
    recommendation: '',
  }
}

// Generate a chat reply (mock)
export const generateChatReply = (
  userMessage: string,
  pathname: string,
  workspaceId: string,
  filter: FilterValue,
): string => {
  const msg = userMessage.toLowerCase()
  const customers = dataset.customersWithOverlay(workspaceId)
  const filtered = applyCustomerFilter(customers, filter)
  const channels = dataset.channels(workspaceId)

  if (msg.includes('ขาย') || msg.includes('รายได้') || msg.includes('revenue')) {
    const monthly = dataset.monthly(workspaceId)
    const total = monthly.reduce((s, m) => s + m.revenue, 0)
    return `รายได้รวมในช่วง 6 เดือนล่าสุด ${formatTHB(total)} · เดือนที่สูงสุดคือ ${[...monthly].sort((a, b) => b.revenue - a.revenue)[0].month} · ช่องทางหลักคือ ${channels[0].channel} (${channels[0].share.toFixed(0)}%)`
  }
  if (msg.includes('ลูกค้า') || msg.includes('customer')) {
    return `ตอนนี้ในระบบมีลูกค้า ${formatNumber(customers.length * 200)} ราย · กลุ่ม VIP ${formatNumber(customers.filter((c) => c.status === 'champion').length * 30)} ราย · เสี่ยงหลุด ${formatNumber(customers.filter((c) => c.status === 'at_risk').length * 80)} ราย · ${isFilterActive(filter) ? `หลัง filter เหลือ ${formatNumber(filtered.length)} ราย` : ''}`
  }
  if (msg.includes('เสี่ยง') || msg.includes('risk') || msg.includes('หาย')) {
    const atRisk = customers.filter((c) => c.status === 'at_risk' || c.status === 'lost')
    return `ลูกค้าเสี่ยงหลุด ${formatNumber(atRisk.length * 80)} ราย มูลค่ารวม ${formatTHB(atRisk.reduce((s, c) => s + c.totalSpend, 0))} · แนะนำให้ไปที่ Enrollment → Pipeline by Sale แล้วกระจายให้ telesale โทรภายใน 7 วัน`
  }
  if (msg.includes('สินค้า') || msg.includes('product')) {
    const products = dataset.products(workspaceId)
    return `สินค้าขายดีอันดับ 1 คือ ${products[0].name} ทำรายได้ ${formatTHB(products[0].revenue)} · สินค้าที่ return rate สูง (>4%) มี ${products.filter((p) => p.returnRate > 4).length} ตัวที่ต้องตรวจสอบ`
  }
  if (msg.includes('telesale') || msg.includes('sale') || msg.includes('ทีม')) {
    const sales = salesStore.get(workspaceId)
    return `ทีม telesale มี ${sales.filter((s) => s.type === 'telesale').length} คน · top performer คือ ${[...sales].sort((a, b) => b.achievedMonthly - a.achievedMonthly)[0].name} · ดูรายละเอียดในหน้า Sales Team`
  }
  if (msg.includes('โปร') || msg.includes('promotion') || msg.includes('campaign')) {
    return `จาก data ปัจจุบัน แนะนำ 3 campaign ตามลำดับ: 1) Win-back ลูกค้า at-risk (มูลค่า ${formatTHB(customers.filter((c) => c.status === 'at_risk').reduce((s, c) => s + c.totalSpend, 0))}) 2) 2nd-buy trigger สำหรับ new customers (โอกาสใหญ่สุด) 3) VIP referral program`
  }
  if (msg.includes('ช่อง') || msg.includes('channel')) {
    return `ช่องทางที่ทำเงินสูงสุด: ${channels.slice(0, 3).map((c) => `${c.channel} (${c.share.toFixed(0)}%)`).join(', ')} · ช่องที่ cancel rate สูงคือ ${[...channels].sort((a, b) => b.cancelRate - a.cancelRate)[0].channel}`
  }
  if (msg.includes('สรุป') || msg.includes('summary') || msg.includes('ภาพรวม')) {
    return `ภาพรวม: ลูกค้า ${formatNumber(customers.length * 200)} ราย · มูลค่าเสี่ยง ${formatTHB(customers.filter((c) => c.status === 'at_risk').reduce((s, c) => s + c.totalSpend, 0))} · ช่องทางหลัก ${channels[0].channel} (${channels[0].share.toFixed(0)}%) · ดูสรุปอัจฉริยะที่หน้า /brief สำหรับ action items ที่ละเอียดกว่า`
  }
  if (msg.includes('hi') || msg.includes('สวัสดี') || msg.includes('hello')) {
    return `สวัสดีครับ! ผมเป็น AI assistant ของ EizBrain · ถามผมได้เกี่ยวกับ ลูกค้า, ยอดขาย, สินค้า, ช่องทาง, ทีม sales หรือคำแนะนำการทำโปร · ผมจะตอบตาม scope ของหน้าและ filter ปัจจุบัน`
  }
  return `ผมยังไม่แน่ใจในคำถามนี้ลองถามเฉพาะเจาะจงกว่านี้ เช่น "ลูกค้าเสี่ยงมีกี่คน" หรือ "ช่องทางไหนทำเงินมากที่สุด" · หรือใช้คำสำคัญ: ขาย, ลูกค้า, สินค้า, ช่อง, ทีม, โปร`
}
