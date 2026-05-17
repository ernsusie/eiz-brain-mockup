import type { Customer, Sale } from '@/types'
import { formatTHB, statusLabel } from './utils'

interface AiBlock {
  title: string
  bullets: string[]
}

export interface AiInsight {
  summary: string
  blocks: AiBlock[]
  recommendation: string
  callScript?: string
  promotion?: { name: string; detail: string }[]
}

const promoLibrary = [
  { name: 'Combo ผงผัก + แก้วเชค', detail: 'ลด 12% เมื่อซื้อ 2 กระปุก, ส่งฟรี EMS — ใช้ได้ 7 วัน' },
  { name: 'Coupon ส่วนบุคคล', detail: 'คูปอง 150฿ เฉพาะออเดอร์ที่ 2 — กระตุ้นซื้อซ้ำ' },
  { name: 'B9 Trial Pack', detail: 'ราคา 290฿ จาก 490฿ — เหมาะกับลูกค้า cooling' },
  { name: 'Free Gift', detail: 'แถม Zenia mini ในออเดอร์ถัดไป — สร้างความรู้สึกพิเศษ' },
]

export const analyzeCustomer = (c: Customer): AiInsight => {
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000,
  )
  const ltv = c.totalSpend
  const tier =
    c.status === 'champion'
      ? 'VIP'
      : c.status === 'loyal'
        ? 'High value'
        : c.status === 'potential'
          ? 'Growth potential'
          : c.status === 'new'
            ? 'New'
            : 'Risk'

  const blocks: AiBlock[] = [
    {
      title: 'พฤติกรรมการซื้อ',
      bullets: [
        `ซื้อทั้งหมด ${c.orders} ครั้ง · เฉลี่ย ${formatTHB(c.avgBasket)}/บิล`,
        `LTV รวม ${formatTHB(ltv)} (อยู่ระดับ ${tier})`,
        `ห่างจากออเดอร์ล่าสุด ${daysSinceLast} วัน`,
        `ช่องทางหลัก: ${c.channel} · พื้นที่: ${c.province}`,
      ],
    },
    {
      title: 'สัญญาณความเสี่ยง',
      bullets: [
        c.riskScore > 60
          ? `Risk Score ${c.riskScore}/100 — ลูกค้ามีแนวโน้มหลุด ต้องติดต่อภายใน 7 วัน`
          : `Risk Score ${c.riskScore}/100 — ยังไม่วิกฤต`,
        c.returnRate > 5
          ? `อัตราคืนสินค้า ${c.returnRate}% สูงกว่าค่าเฉลี่ย — ระวังประสบการณ์`
          : `อัตราคืนสินค้า ${c.returnRate}% อยู่ในเกณฑ์ดี`,
        c.highAov
          ? 'High AOV — ใส่ใจมาตรฐานการดูแล / VIP touchpoint'
          : 'AOV ปกติ',
      ],
    },
  ]

  let recommendation = ''
  let callScript = ''
  let promotion: AiInsight['promotion'] = []

  if (c.status === 'champion' || c.status === 'loyal') {
    recommendation =
      'ลูกค้ากลุ่มหัวกระทิ — ห้ามขายแบบเร่ง ใช้กลยุทธ์ "ขอบคุณ + ขอรีวิว + แนะนำเพื่อน"'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ ขอบคุณมากที่ดูแลเรามาตลอด ${c.orders} ออเดอร์เลยนะคะ ทางทีมอยากขอความคิดเห็นเรื่อง ${c.channel} และส่งโค้ดส่วนลด VIP 200 บาท พร้อมโค้ดเชิญเพื่อนให้ค่ะ ลองดูก่อนได้เลยนะคะ`
    promotion = [promoLibrary[3], { name: 'VIP Referral', detail: 'ลด 200฿ ทั้งคู่ เมื่อแนะนำเพื่อน' }]
  } else if (c.status === 'potential') {
    recommendation =
      'มีศักยภาพ — push เข้า champion ด้วย bundle + free gift ภายใน 14 วัน'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ ทางทีมเห็นว่าคุณซื้อ ${c.channel} กับเรามาแล้ว ${c.orders} ครั้ง อยากเสนอ Combo พิเศษ ลด 12% เมื่อสั่ง 2 กระปุก ส่งฟรี EMS ค่ะ จะส่งลิงค์ให้ทาง LINE ตอนนี้เลยไหมคะ`
    promotion = [promoLibrary[0], promoLibrary[1]]
  } else if (c.status === 'new') {
    recommendation =
      'Onboarding — เน้นสร้างความเชื่อมั่นและกระตุ้นออเดอร์ที่ 2 ภายใน 30 วัน'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ ขอบคุณที่ลองสินค้าของเรา อยากสอบถามว่าได้ลองทานแล้วเป็นยังไงบ้างคะ ทางทีมมีคูปอง 150฿ ให้ใช้ออเดอร์ถัดไป กรุณาใช้ภายใน 7 วันนะคะ`
    promotion = [promoLibrary[1], promoLibrary[2]]
  } else if (c.status === 'at_risk') {
    recommendation =
      'เร่งดึงกลับ — โทรภายใน 7 วัน เสนอราคาพิเศษเฉพาะบุคคล + ส่งฟรี'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ ทางทีมสังเกตว่าไม่ได้สั่ง ${c.channel} จากเรามาสักพักแล้ว เลยอยากเสนอราคาพิเศษ B9 Trial Pack เพียง 290฿ จาก 490฿ ส่งฟรี EMS ค่ะ สนใจให้ทีมจัดส่งให้เลยไหมคะ`
    promotion = [promoLibrary[2], promoLibrary[1]]
  } else if (c.status === 'lost') {
    recommendation =
      'Win-back campaign — ใช้ flash sale / limited stock ทาง LINE + Retarget Ads'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ ทางทีมขอเสนอราคาดีที่สุดที่เคยมี เพียงสำหรับลูกค้าเก่าเท่านั้น — Combo ผงผัก 2 กระปุก ลด 25% รวมแก้วเชค เหลือเพียง 3 วันสุดท้ายค่ะ จะให้ส่งลิงค์ทาง LINE ไหมคะ`
    promotion = [promoLibrary[0], promoLibrary[3]]
  } else {
    recommendation = 'Re-activation: ส่ง SMS + Email + Retarget Ads ก่อนโทร'
    callScript = `สวัสดีคุณ ${c.name} ค่ะ พอดีทางทีมมีของขวัญเล็ก ๆ น้อย ๆ ให้ลูกค้าพิเศษ จะส่งโค้ดคูปอง 150฿ ให้ทาง LINE นะคะ ใช้ได้ภายใน 7 วันค่ะ`
    promotion = [promoLibrary[1]]
  }

  return {
    summary: `ลูกค้า ${tier} กลุ่ม ${statusLabel[c.status] ?? c.status} — ${daysSinceLast} วันไม่ซื้อ`,
    blocks,
    recommendation,
    callScript,
    promotion,
  }
}

export const analyzeSaleKpi = (s: Sale, kpiTarget: number, days = 17) => {
  const pct = (s.achievedMonthly / kpiTarget) * 100
  const remaining = Math.max(0, kpiTarget - s.achievedMonthly)
  const daysLeft = 30 - days
  const dailyNeed = remaining / Math.max(1, daysLeft)

  const insights: string[] = []
  if (pct >= 100) {
    insights.push('🎉 ทำได้เกินเป้าแล้ว — ต่อยอดด้วยลูกค้า VIP เพิ่ม upsell')
  } else if (pct >= 70) {
    insights.push(`อีก ${formatTHB(remaining)} ก็ถึงเป้า (~${Math.ceil(dailyNeed / 800)} ออเดอร์/วัน)`)
    insights.push('แนะนำเน้น lookalike จาก champion + retarget cart abandon')
  } else if (pct >= 40) {
    insights.push(`ตามหลังเป้า ${(100 - pct).toFixed(0)}% — ต้องการ ${formatTHB(dailyNeed)}/วัน`)
    insights.push('โฟกัส follow-up ลูกค้ากลุ่ม at_risk และเปิด flash sale 48 ชม.')
  } else {
    insights.push('⚠️ ห่างเป้ามาก — ต้องเช็คคุณภาพ lead และ training script')
    insights.push('แนะนำให้พิจารณา re-assign ลูกค้า + เพิ่ม touchpoint LINE/SMS')
  }
  if (s.returnRate > 3) {
    insights.push(`Return rate ${s.returnRate}% สูงเกิน threshold — ต้องตรวจคุณภาพ COD orders`)
  }
  return {
    pct: Math.round(pct * 10) / 10,
    remaining,
    daysLeft,
    dailyNeed,
    insights,
  }
}
