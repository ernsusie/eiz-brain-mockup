import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Crown,
  Heart,
  Megaphone,
  Phone,
  ShoppingBag,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

type RfmCell = { r: number; f: number; m: number }

type Priority = 'P1' | 'P2' | 'P3' | 'P4'

interface SegSpec {
  key:          string
  label:        string
  rRange:       [number, number]
  fRange:       [number, number]
  mRange:       [number, number]
  priority:     Priority          /* P1 = call first */
  tone:         string             /* card border colour class */
  ring:         string
  textColor:    string
  icon:         any
  teleSegment:  string             /* "VIP / Reactivation / New Follow-up / Win-back" */
  sellWhat:     string             /* sell recommendation */
  adsWhat:      string             /* ad target recommendation */
  enrollmentNote: string           /* hint about enrollment status */
}

/* Segments ordered so the most urgent (P1) come first.
 * Priority rules:
 *   P1 — Can't lose / At-risk VIP / Big leaving — call THIS WEEK
 *   P2 — At-risk / About to sleep — schedule call
 *   P3 — Need attention / Potential loyal — touchpoint
 *   P4 — Champions / Loyal / New / Lost — auto-nurture
 */
const SEGS: SegSpec[] = [
  {
    key: 'cant_lose',  label: "Can't Lose (VIP ที่กำลังจะหลุด)",
    rRange: [1,1], fRange: [4,5], mRange: [4,5], priority: 'P1',
    tone: 'bg-red-50 border-red-200', ring: 'border-red-300', textColor: 'text-red-700',
    icon: AlertTriangle,
    teleSegment: 'VIP Reactivation',
    sellWhat: 'Premium bundle · top SKU เดิม + ลด 30%',
    adsWhat:  'Reactivation (look-alike champion) · งบสูง',
    enrollmentNote: 'ต้อง enroll ให้ telesale ดูแลภายใน 3 วัน',
  },
  {
    key: 'at_risk',  label: 'At Risk (ลูกค้าเสี่ยงหลุด)',
    rRange: [1,2], fRange: [3,5], mRange: [3,5], priority: 'P1',
    tone: 'bg-rose-50 border-rose-200', ring: 'border-rose-300', textColor: 'text-rose-700',
    icon: AlertCircle,
    teleSegment: 'Win-back',
    sellWhat: 'Personal offer · กลุ่มสินค้าที่ลูกค้าซื้อบ่อย',
    adsWhat:  'Retarget 90d · pixel-based + LINE OA',
    enrollmentNote: 'enroll ให้ทีม telesale + ส่ง win-back email',
  },
  {
    key: 'big_leaving',  label: 'ลูกค้าใหญ่ที่กำลังจะหายไป',
    rRange: [2,3], fRange: [3,5], mRange: [4,5], priority: 'P1',
    tone: 'bg-pink-50 border-pink-200', ring: 'border-pink-300', textColor: 'text-pink-700',
    icon: AlertTriangle,
    teleSegment: 'High-value Reactivation',
    sellWhat: 'Care package + 25% voucher',
    adsWhat:  'Pre-launch new product · invite-only',
    enrollmentNote: 'รอ assign sale คนเดิมก่อน (ถ้ามี history)',
  },
  {
    key: 'about_to_sleep',  label: 'About to Sleep (กำลังจะหลับ)',
    rRange: [2,3], fRange: [1,2], mRange: [1,2], priority: 'P2',
    tone: 'bg-orange-50 border-orange-200', ring: 'border-orange-300', textColor: 'text-orange-700',
    icon: AlertCircle,
    teleSegment: 'Re-engage',
    sellWhat: 'Limited offer 20% off · best-seller',
    adsWhat:  'FB/IG reminder · 60d retarget',
    enrollmentNote: 'Auto-enroll หาก telesale ว่าง',
  },
  {
    key: 'need_attention',  label: 'Need Attention (เริ่มห่าง)',
    rRange: [2,3], fRange: [2,3], mRange: [2,3], priority: 'P2',
    tone: 'bg-amber-50 border-amber-200', ring: 'border-amber-300', textColor: 'text-amber-700',
    icon: AlertCircle,
    teleSegment: 'Re-engage Soft',
    sellWhat: 'Personalised recommend · new collection',
    adsWhat:  'Educational content · brand awareness',
    enrollmentNote: 'ส่ง LINE OA ก่อน — telesale เฉพาะ top 30%',
  },
  {
    key: 'potential_loyal',  label: 'Potential Loyalists (ดาวรุ่ง)',
    rRange: [4,5], fRange: [2,3], mRange: [2,3], priority: 'P3',
    tone: 'bg-violet-50 border-violet-200', ring: 'border-violet-300', textColor: 'text-violet-700',
    icon: Sparkles,
    teleSegment: 'Nurture',
    sellWhat: 'Cross-sell · loyalty program',
    adsWhat:  'Educational + UGC content',
    enrollmentNote: 'รอ trigger ที่ 30 วันแรก',
  },
  {
    key: 'new_customers',  label: 'New Customers (ลูกค้าใหม่)',
    rRange: [4,5], fRange: [1,1], mRange: [1,3], priority: 'P3',
    tone: 'bg-sky-50 border-sky-200', ring: 'border-sky-300', textColor: 'text-sky-700',
    icon: UserCheck,
    teleSegment: 'Onboarding',
    sellWhat: 'Coupon ฿150 สำหรับ order 2 + sample',
    adsWhat:  'How-to videos + เนื้อหา onboarding 14 วัน',
    enrollmentNote: 'ส่ง onboarding sequence อัตโนมัติ',
  },
  {
    key: 'loyal_drifting',  label: 'Loyal กำลังเริ่มห่าง',
    rRange: [3,4], fRange: [4,5], mRange: [3,4], priority: 'P2',
    tone: 'bg-indigo-50 border-indigo-200', ring: 'border-indigo-300', textColor: 'text-indigo-700',
    icon: Heart,
    teleSegment: 'Loyal Care',
    sellWhat: 'Cross-sell + invite VIP membership',
    adsWhat:  'Suppress (ใช้ใน look-alike)',
    enrollmentNote: 'Auto-touchpoint · ไม่ต้อง enroll telesale',
  },
  {
    key: 'champion',  label: 'Champions (ลูกค้าทอง)',
    rRange: [4,5], fRange: [4,5], mRange: [4,5], priority: 'P4',
    tone: 'bg-emerald-50 border-emerald-200', ring: 'border-emerald-300', textColor: 'text-emerald-700',
    icon: Crown,
    teleSegment: 'VIP Care',
    sellWhat: 'Premium / new launch ก่อนคนอื่น',
    adsWhat:  'Look-alike seed (suppress from spend)',
    enrollmentNote: 'ขอ review · invite referral',
  },
  {
    key: 'loyal',  label: 'Loyal (ลูกค้าประจำ)',
    rRange: [3,5], fRange: [3,4], mRange: [3,4], priority: 'P4',
    tone: 'bg-cyan-50 border-cyan-200', ring: 'border-cyan-300', textColor: 'text-cyan-700',
    icon: Heart,
    teleSegment: 'Maintain',
    sellWhat: 'Bundle / personalized recommend',
    adsWhat:  'Suppress',
    enrollmentNote: 'Auto-nurture',
  },
  {
    key: 'hibernating',  label: 'Hibernating (หลับลึก)',
    rRange: [1,2], fRange: [1,2], mRange: [1,2], priority: 'P4',
    tone: 'bg-slate-50 border-slate-200', ring: 'border-slate-300', textColor: 'text-slate-700',
    icon: Users,
    teleSegment: 'Last attempt',
    sellWhat: 'Final win-back coupon · ลด 40%',
    adsWhat:  'Exclude หลังรอบสุดท้าย',
    enrollmentNote: 'Re-engage 2 ครั้ง · ถ้าไม่ตอบ archive',
  },
]

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: 'bg-red-600 text-white',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-amber-500 text-white',
  P4: 'bg-slate-400 text-white',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  P1: 'P1 · โทรด่วน (3 วัน)',
  P2: 'P2 · นัดโทรสัปดาห์นี้',
  P3: 'P3 · touchpoint',
  P4: 'P4 · auto-nurture',
}

const score = (customers: Customer[]): (Customer & RfmCell)[] => {
  if (customers.length === 0) return []
  const today = Date.now()
  const recDays = customers.map((c) => (today - new Date(c.lastBuy).getTime()) / 86400_000)
  const freq    = customers.map((c) => c.orders)
  const money   = customers.map((c) => c.totalSpend)
  const quintile = (v: number, sorted: number[], reverse = false) => {
    const idx = sorted.findIndex((x) => x >= v)
    const pct = idx / Math.max(1, sorted.length - 1)
    const q = Math.min(5, Math.max(1, Math.ceil(pct * 5)))
    return reverse ? 6 - q : q
  }
  const sR = [...recDays].sort((a, b) => a - b)
  const sF = [...freq].sort((a, b) => a - b)
  const sM = [...money].sort((a, b) => a - b)
  return customers.map((c, i) => ({
    ...c,
    r: quintile(recDays[i], sR, true),
    f: quintile(freq[i], sF),
    m: quintile(money[i], sM),
  }))
}

const matches = (c: Customer & RfmCell, s: SegSpec): boolean =>
  c.r >= s.rRange[0] && c.r <= s.rRange[1] &&
  c.f >= s.fRange[0] && c.f <= s.fRange[1] &&
  c.m >= s.mRange[0] && c.m <= s.mRange[1]

export const CustomerCenterSegments = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSeg = searchParams.get('seg') ?? null
  const [expanded, setExpanded] = useState<string | null>(initialSeg)
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const scored = useMemo(() => score(customers), [customers])

  const buckets = useMemo(
    () =>
      SEGS.map((seg) => {
        const list = scored.filter((c) => matches(c, seg))
        const value = list.reduce((s, c) => s + c.totalSpend, 0)
        const enrolled = list.filter((c) => c.enrolled).length
        return { seg, list, count: list.length, value, enrolled }
      }).filter((b) => b.count > 0),
    [scored],
  )

  const total = scored.length || 1
  const p1Count = buckets.filter((b) => b.seg.priority === 'P1').reduce((s, b) => s + b.count, 0)
  const p1Value = buckets.filter((b) => b.seg.priority === 'P1').reduce((s, b) => s + b.value, 0)

  const goToCustomers = (segKey: string, segLabel: string) => {
    navigate(`/customer-center/customers?segment=${encodeURIComponent(segLabel)}&seg_key=${segKey}`)
  }

  return (
    <div className="space-y-4">
      {/* Priority callout */}
      <div className="card bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-3 text-sm">
        <Phone className="w-4 h-4 text-rose-600" />
        <span className="text-slate-700">
          กลุ่ม Priority P1 (เสี่ยงหลุดมากที่สุด) มี{' '}
          <strong className="text-rose-700">{formatNumber(p1Count)} ราย</strong>{' '}
          มูลค่ารวม <strong>{formatTHB(p1Value, { compact: true })}</strong> — ควรเร่งดูแลภายใน 3 วัน
        </span>
      </div>

      {/* Segment cards — sorted by priority then count */}
      <div className="space-y-3">
        {[...buckets]
          .sort((a, b) => {
            if (a.seg.priority !== b.seg.priority) return a.seg.priority < b.seg.priority ? -1 : 1
            return b.count - a.count
          })
          .map(({ seg, count, value, enrolled }) => {
            const Icon = seg.icon
            const pct = (count / total) * 100
            const isExpanded = expanded === seg.key
            const enrollmentPct = count > 0 ? (enrolled / count) * 100 : 0
            return (
              <div
                key={seg.key}
                className={cn('card border-2 overflow-hidden transition-all', seg.tone, isExpanded && 'shadow-md')}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : seg.key)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className={cn('w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shrink-0', seg.textColor)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', PRIORITY_COLOR[seg.priority])}>
                        {seg.priority}
                      </span>
                      <h3 className="font-bold text-slate-900">{seg.label}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {seg.teleSegment} · {seg.enrollmentNote}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('text-2xl font-bold', seg.textColor)}>{formatNumber(count)}</div>
                    <div className="text-[11px] text-slate-500">{pct.toFixed(1)}% · {formatTHB(value, { compact: true })}</div>
                  </div>
                  <ArrowRight className={cn('w-5 h-5 text-slate-400 self-center transition-transform shrink-0', isExpanded && 'rotate-90')} />
                </button>

                {isExpanded && (
                  <div className="border-t border-white/60 bg-white/40 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="card bg-white p-3 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Telesale Priority</span>
                      </div>
                      <div className="font-semibold text-slate-900">{PRIORITY_LABEL[seg.priority]}</div>
                      <div className="text-xs text-slate-600 mt-1">Segment: {seg.teleSegment}</div>
                    </div>

                    <div className="card bg-white p-3 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Enrollment</span>
                      </div>
                      <div className="font-semibold text-slate-900">{enrollmentPct.toFixed(0)}% enrolled</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {enrolled} / {count} ราย ได้รับการ enroll
                      </div>
                    </div>

                    <div className="card bg-white p-3 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">มูลค่ารวม</span>
                      </div>
                      <div className="font-semibold text-slate-900">{formatTHB(value, { compact: true })}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        เฉลี่ย {formatTHB(value / Math.max(1, count), { compact: true })} / ราย
                      </div>
                    </div>

                    <div className="card bg-white p-3 text-sm md:col-span-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">ควรขายอะไร</span>
                      </div>
                      <div className="text-slate-700">{seg.sellWhat}</div>
                    </div>

                    <div className="card bg-white p-3 text-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Megaphone className="w-3.5 h-3.5 text-violet-600" />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ads / Reach</span>
                      </div>
                      <div className="text-slate-700">{seg.adsWhat}</div>
                    </div>

                    <button
                      onClick={() => goToCustomers(seg.key, seg.label)}
                      className="md:col-span-3 mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
                    >
                      <Users className="w-4 h-4" />
                      ดูรายชื่อลูกค้าใน segment นี้ ({formatNumber(count)} ราย)
                    </button>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
