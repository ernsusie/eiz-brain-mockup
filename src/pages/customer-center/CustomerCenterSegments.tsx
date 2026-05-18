import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Megaphone,
  Phone,
  ShoppingBag,
  Target,
  UserCheck,
  Users,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

/* Same colour ramp / segment IDs as the Dashboard "วิเคราะห์กลุ่มลูกค้า"
 * page. Single source of truth keeps the two views consistent — when
 * the user clicks a tile on the dashboard, the matching segment shows
 * up here with the same colour band and rules. */
type RfmCell = { r: number; f: number; m: number }
type Band = 'champion' | 'good' | 'growing' | 'alert' | 'watch' | 'lost' | 'inactive' | 'followup'
type Priority = 'P1' | 'P2' | 'P3' | 'P4'

interface SegSpec {
  key:    string
  label:  string
  rRange: [number, number]
  fRange: [number, number]
  mRange: [number, number]
  band:   Band
  priority:    Priority
  teleSegment: string
  sellWhat:    string
  adsWhat:     string
  enrollmentNote: string
}

const BAND_COLORS: Record<Band, string> = {
  champion:  '#a855f7',
  good:      '#10b981',
  growing:   '#fbbf24',
  alert:     '#f87171',
  watch:     '#fb923c',
  lost:      '#fda4af',
  inactive:  '#cbd5e1',
  followup:  '#7dd3fc',
}

const SEGS: SegSpec[] = [
  /* P1 — โทรด่วน (3 วัน) */
  { key: 'big_leaving',     label: 'ลูกค้าใหญ่ที่กำลังจะหายไป',     rRange: [2,3], fRange: [3,5], mRange: [4,5], band: 'lost',     priority: 'P1', teleSegment: 'High-value Reactivation', sellWhat: 'Care package + voucher 25%', adsWhat: 'Pre-launch new product · invite-only', enrollmentNote: 'รอ assign sale คนเดิมก่อน (ถ้ามี history)' },
  { key: 'big_lost',        label: 'ลูกค้าตัวที่เลิกซื้อไปแล้ว',     rRange: [1,2], fRange: [3,5], mRange: [4,5], band: 'alert',    priority: 'P1', teleSegment: 'Win-back',               sellWhat: 'Personal offer 25-30% · กลุ่มสินค้าโปรด', adsWhat: 'Retarget 90d · pixel + LINE OA', enrollmentNote: 'enroll ให้ทีม telesale + ส่ง win-back email' },
  { key: 'cust_lost',       label: 'ลูกค้าเลิกซื้อไปแล้ว',           rRange: [1,2], fRange: [2,3], mRange: [1,2], band: 'lost',     priority: 'P1', teleSegment: 'Last attempt',           sellWhat: 'Final win-back coupon 40%', adsWhat: 'Exclude after attempt', enrollmentNote: 'Re-engage 2 ครั้ง · ถ้าไม่ตอบ archive' },
  /* P2 — สัปดาห์นี้ */
  { key: 'loyal_drifting',  label: 'ลูกค้าชั้นที่เริ่มห่างไป',     rRange: [3,4], fRange: [4,5], mRange: [4,5], band: 'champion', priority: 'P2', teleSegment: 'Loyal Care',             sellWhat: 'Cross-sell + invite VIP membership', adsWhat: 'Suppress (ใช้ใน look-alike)', enrollmentNote: 'Auto-touchpoint ไม่ต้อง enroll telesale' },
  { key: 'dead_first_big',  label: '(ตายแล้ว) ซื้อครั้งแรกง่ายหนัก',  rRange: [1,1], fRange: [1,1], mRange: [4,5], band: 'alert',    priority: 'P2', teleSegment: 'High-value Onboarding',  sellWhat: 'Welcome call + cross-sell premium', adsWhat: 'Pre-launch invite', enrollmentNote: 'enroll P2 สาย sale ที่ specialize' },
  { key: 'cooling_first_big', label: '(เริ่มห่าง) ซื้อครั้งแรกง่ายหนัก', rRange: [2,3], fRange: [1,1], mRange: [4,5], band: 'growing', priority: 'P2', teleSegment: 'Reactivate New',         sellWhat: 'Voucher 20% · personalised', adsWhat: 'Retarget 60d', enrollmentNote: 'enroll หาก telesale ว่าง' },
  { key: 'mid_value_dead',  label: 'ลูกค้าที่ตายแล้วที่มียอดปานกลาง-สูง', rRange: [1,2], fRange: [1,2], mRange: [3,4], band: 'lost', priority: 'P2', teleSegment: 'Mid-value Reactivation', sellWhat: 'Voucher 25%', adsWhat: 'Look-alike retarget', enrollmentNote: 'enroll ถ้ามี history channel เดิม' },
  /* P3 — touchpoint */
  { key: 'potential_loyal', label: 'มีโอกาสเป็นลูกค้าชั้นเยี่ยม',     rRange: [4,5], fRange: [2,3], mRange: [3,4], band: 'champion', priority: 'P3', teleSegment: 'Nurture',                sellWhat: 'Cross-sell · loyalty program',  adsWhat: 'Educational + UGC content', enrollmentNote: 'รอ trigger ที่ 30 วันแรก' },
  { key: 'easy_above_avg',  label: '(เฝ้าดู) ซื้อครั้งแรกง่ายหนัก',    rRange: [4,5], fRange: [1,1], mRange: [4,5], band: 'followup', priority: 'P3', teleSegment: 'Onboarding High-Value',  sellWhat: 'Coupon 200 + sample',          adsWhat: 'Bundle videos', enrollmentNote: 'auto onboarding sequence' },
  { key: 'first_warmest',   label: '(ดูแล) ซื้อครั้งแรกสูงกว่าปกติ',  rRange: [3,5], fRange: [1,1], mRange: [3,4], band: 'followup', priority: 'P3', teleSegment: 'Onboarding Mid',         sellWhat: 'Bundle ลด 15%',                 adsWhat: 'Educational content',  enrollmentNote: 'auto LINE OA 7 วันแรก' },
  { key: 'low_freq_unsold', label: 'กลุ่มลูกค้าที่ไม่ค่อยขาย',         rRange: [2,3], fRange: [2,3], mRange: [2,3], band: 'lost',     priority: 'P3', teleSegment: 'Re-engage Soft',         sellWhat: 'Personalised recommend',         adsWhat: 'Brand-awareness',   enrollmentNote: 'ส่ง LINE OA ก่อน · telesale top 30%' },
  /* P4 — auto-nurture */
  { key: 'champion_loyal',  label: 'ลูกค้าชั้นเยี่ยมที่ยังอยู่กับเรา', rRange: [4,5], fRange: [4,5], mRange: [4,5], band: 'champion', priority: 'P4', teleSegment: 'VIP Care',               sellWhat: 'Premium / new launch first',     adsWhat: 'Look-alike seed', enrollmentNote: 'ขอ review · invite referral' },
  { key: 'first_aging',     label: 'ซื้อครั้งแรก — ห่างนาน',          rRange: [1,2], fRange: [1,1], mRange: [2,3], band: 'growing',  priority: 'P4', teleSegment: 'Final Attempt',           sellWhat: 'Coupon ลด 25%',                  adsWhat: 'Exclude',                  enrollmentNote: 'Final win-back · auto' },
  { key: 'first_cooling',   label: 'ซื้อครั้งแรก — เริ่มห่าง',         rRange: [2,3], fRange: [1,1], mRange: [2,3], band: 'followup', priority: 'P4', teleSegment: 'Auto-nurture',            sellWhat: 'Onboard pack + voucher 150',     adsWhat: 'Educational',              enrollmentNote: 'Auto-onboard ครบ 14 วัน' },
  { key: 'low_normal',      label: '(ดูแล) ซื้อครั้งแรกง่ายปกติ',     rRange: [3,5], fRange: [1,1], mRange: [1,2], band: 'followup', priority: 'P4', teleSegment: 'Onboarding Light',        sellWhat: 'Voucher 100 · low ASP',          adsWhat: 'Suppress',                 enrollmentNote: 'Auto-onboard' },
  { key: 'dead_cheap',      label: 'ตาย (ซื้อน้อย)',                  rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'lost',     priority: 'P4', teleSegment: 'Archive',                 sellWhat: '—',                              adsWhat: 'Exclude',                  enrollmentNote: 'Archive · suppress ads' },
  { key: 'aging_60_120',    label: 'ยอดต่ำกว่า 1000 ซื้อครั้งแรก 60-120 วัน', rRange: [2,3], fRange: [1,1], mRange: [1,1], band: 'watch', priority: 'P4', teleSegment: 'Auto Re-engage', sellWhat: 'Discount 15%', adsWhat: 'Retarget pixel only', enrollmentNote: 'Auto LINE OA' },
  { key: 'rare_small',      label: 'ซื้อเรื่อยจัดน้อยๆ',               rRange: [2,3], fRange: [2,3], mRange: [1,2], band: 'growing',  priority: 'P4', teleSegment: 'Auto-nurture Soft',       sellWhat: 'Cross-sell sample',              adsWhat: 'Suppress',                 enrollmentNote: 'Auto · ไม่ต้อง enroll' },
  { key: 'first_small',     label: '(ดูแล) ซื้อครั้งแรกง่ายน้อย',      rRange: [4,5], fRange: [1,1], mRange: [1,1], band: 'followup', priority: 'P4', teleSegment: 'Onboarding Mini',         sellWhat: 'Sample pack ส่งฟรี',             adsWhat: 'Awareness',                enrollmentNote: 'Auto onboard 7 วัน' },
  { key: 'never',           label: 'ทดลอง/ดอง/ยังไม่มีการสั่งซื้อ',    rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'inactive', priority: 'P4', teleSegment: 'Archive',                 sellWhat: '—',                              adsWhat: 'Exclude',                  enrollmentNote: 'Archive' },
]

const PRIORITY_TONE: Record<Priority, { chip: string; head: string; ring: string; bg: string; section: string }> = {
  P1: { chip: 'bg-red-600 text-white',    head: 'text-red-700',    ring: 'border-red-200',    bg: 'bg-red-50',     section: 'bg-rose-50/50' },
  P2: { chip: 'bg-orange-500 text-white', head: 'text-orange-700', ring: 'border-orange-200', bg: 'bg-orange-50',  section: 'bg-orange-50/40' },
  P3: { chip: 'bg-amber-500 text-white',  head: 'text-amber-700',  ring: 'border-amber-200',  bg: 'bg-amber-50',   section: 'bg-amber-50/40' },
  P4: { chip: 'bg-slate-400 text-white',  head: 'text-slate-600',  ring: 'border-slate-200',  bg: 'bg-slate-50',   section: 'bg-slate-50/60' },
}

const PRIORITY_LABEL: Record<Priority, { title: string; sub: string }> = {
  P1: { title: 'P1 · โทรด่วน (ภายใน 3 วัน)',    sub: 'มูลค่าสูงสุด · ความเสียหายมหาศาลถ้าหลุด' },
  P2: { title: 'P2 · นัดโทรสัปดาห์นี้',         sub: 'เสี่ยงปานกลาง · เร่งติดต่อก่อนเลื่อนสถานะ' },
  P3: { title: 'P3 · ส่ง touchpoint',           sub: 'อัตโนมัติด้วย LINE OA + email' },
  P4: { title: 'P4 · auto-nurture / archive',   sub: 'ไม่ต้องโทร — ปล่อยให้ระบบดูแลเอง' },
}

const scoreCustomers = (customers: Customer[]): (Customer & RfmCell)[] => {
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
  const scored = useMemo(() => scoreCustomers(customers), [customers])

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

  /* Group by priority for the section headers. */
  const grouped = useMemo(() => {
    const map: Record<Priority, typeof buckets> = { P1: [], P2: [], P3: [], P4: [] }
    for (const b of buckets) map[b.seg.priority].push(b)
    /* Within each priority, sort by count desc. */
    for (const k of Object.keys(map) as Priority[]) {
      map[k].sort((a, b) => b.count - a.count)
    }
    return map
  }, [buckets])

  const total = scored.length || 1
  const p1Count = grouped.P1.reduce((s, b) => s + b.count, 0)
  const p1Value = grouped.P1.reduce((s, b) => s + b.value, 0)

  const goToCustomers = (segKey: string, segLabel: string) => {
    navigate(`/customer-center/customers?segment=${encodeURIComponent(segLabel)}&seg_key=${segKey}`)
  }

  return (
    <div className="space-y-5">
      <PageInsight
        kind="warning"
        title="Priority Callout"
        items={[
          <>
            P1 (เสี่ยงหลุดสูงสุด) มี <strong>{formatNumber(p1Count)} ราย</strong> มูลค่ารวม{' '}
            <strong>{formatTHB(p1Value, { compact: true })}</strong> — ต้องโทรดูแลภายใน 3 วัน
          </>,
          <>
            ใช้ priority section เพื่อแบ่ง workload โทรของ sale team — กดการ์ดเพื่อดูสินค้า/ads ที่แนะนำ
          </>,
        ]}
      />

      {/* Priority quick-filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Quick jump:</span>
        {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => {
          const tone = PRIORITY_TONE[p]
          const list = grouped[p]
          const totalCount = list.reduce((s, b) => s + b.count, 0)
          return (
            <a
              key={p}
              href={`#priority-${p}`}
              className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', tone.chip, 'hover:opacity-90')}
            >
              {p} · {formatNumber(totalCount)}
            </a>
          )
        })}
      </div>

      {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => {
        const list = grouped[p]
        if (list.length === 0) return null
        const totalCount = list.reduce((s, b) => s + b.count, 0)
        const totalValue = list.reduce((s, b) => s + b.value, 0)
        const tone = PRIORITY_TONE[p]
        return (
          <section key={p} id={`priority-${p}`} className={cn('scroll-mt-4 space-y-2 rounded-3xl p-3', tone.section)}>
            {/* Priority header — bigger visual break for clarity */}
            <header className={cn('rounded-2xl bg-white border-l-8 px-5 py-4 flex items-center gap-3 flex-wrap shadow-sm', tone.ring)}
              style={{ borderLeftColor: p === 'P1' ? '#dc2626' : p === 'P2' ? '#f97316' : p === 'P3' ? '#f59e0b' : '#94a3b8' }}>
              <span className={cn('text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full', tone.chip)}>
                {p}
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn('font-bold text-base', tone.head)}>{PRIORITY_LABEL[p].title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{PRIORITY_LABEL[p].sub}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{formatNumber(totalCount)}</div>
                <div className="text-[11px] text-slate-500 mt-1">รวม {formatTHB(totalValue, { compact: true })}</div>
              </div>
            </header>

            {/* Compact segment cards — 2-col grid on md+ to reduce row count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {list.map(({ seg, count, value, enrolled }) => {
                const pct = (count / total) * 100
                const isExpanded = expanded === seg.key
                const enrollmentPct = count > 0 ? (enrolled / count) * 100 : 0
                return (
                  <div
                    key={seg.key}
                    className={cn('card border overflow-hidden transition-all', isExpanded && 'shadow-md md:col-span-2')}
                    style={{ borderLeftWidth: 4, borderLeftColor: BAND_COLORS[seg.band] }}
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : seg.key)}
                      className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50/60"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: BAND_COLORS[seg.band] }}>
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{seg.label}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{seg.teleSegment}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-slate-900 tabular-nums leading-none">{formatNumber(count)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{pct.toFixed(1)}%</div>
                      </div>
                      <ArrowRight className={cn('w-4 h-4 text-slate-400 self-center transition-transform shrink-0', isExpanded && 'rotate-90')} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/40 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="card bg-white p-3 text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Tele Segment</span>
                          </div>
                          <div className="font-semibold text-slate-900">{seg.teleSegment}</div>
                          <div className="text-xs text-slate-600 mt-1">{seg.enrollmentNote}</div>
                        </div>

                        <div className="card bg-white p-3 text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Enrollment</span>
                          </div>
                          <div className="font-semibold text-slate-900">{enrollmentPct.toFixed(0)}% enrolled</div>
                          <div className="text-xs text-slate-600 mt-1">{enrolled} / {count} ราย</div>
                        </div>

                        <div className="card bg-white p-3 text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Target className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">มูลค่ารวม</span>
                          </div>
                          <div className="font-semibold text-slate-900">{formatTHB(value, { compact: true })}</div>
                          <div className="text-xs text-slate-600 mt-1">เฉลี่ย {formatTHB(value / Math.max(1, count), { compact: true })} / ราย</div>
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
          </section>
        )
      })}
    </div>
  )
}
