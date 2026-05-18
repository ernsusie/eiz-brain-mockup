import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  Crown,
  Heart,
  Repeat,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

/**
 * Dashboard sub-page · วิเคราะห์กลุ่มลูกค้า
 *
 * Compact RFM overview — shows the 11 behavioral segments as
 * clickable tiles. Clicking a tile navigates to the customer center
 * (/segments) with the segment pre-selected so the user can drill
 * into the actual roster. The full RFM methodology + heatmap lives
 * on /segments/rfm — we link to it from the page header.
 */

type RfmCell = { r: number; f: number; m: number }

interface SegmentSpec {
  key:    string
  label:  string
  rRange: [number, number]
  fRange: [number, number]
  mRange: [number, number]
  tone:   string
  ring:   string
  color:  string
  icon:   any
  thInsight: string
}

const SEGMENTS: SegmentSpec[] = [
  { key: 'champions',     label: 'Champions',         rRange: [4,5], fRange: [4,5], mRange: [4,5], tone: 'tone-customer',  ring: 'border-emerald-300', color: 'text-emerald-700', icon: Crown,         thInsight: 'ลูกค้าทอง — ใช้สร้าง referral + early access' },
  { key: 'loyal',         label: 'Loyal',             rRange: [2,5], fRange: [3,5], mRange: [3,5], tone: 'tone-geo',       ring: 'border-sky-300',     color: 'text-sky-700',     icon: Heart,         thInsight: 'ลูกค้าประจำ — ทำ upsell ขึ้น champion' },
  { key: 'potential',     label: 'Potential Loyal',   rRange: [3,5], fRange: [1,3], mRange: [1,3], tone: 'tone-product',   ring: 'border-violet-300',  color: 'text-violet-700',  icon: Sparkles,      thInsight: 'มีศักยภาพ — cross-sell แบบ educational' },
  { key: 'new',           label: 'New',               rRange: [4,5], fRange: [1,1], mRange: [1,3], tone: 'tone-geo',       ring: 'border-blue-300',    color: 'text-blue-700',    icon: Users,         thInsight: 'ลูกค้าใหม่ — onboarding 14 วันแรก' },
  { key: 'promising',     label: 'Promising',         rRange: [3,4], fRange: [1,1], mRange: [1,1], tone: 'tone-geo',       ring: 'border-cyan-300',    color: 'text-cyan-700',    icon: TrendingUp,    thInsight: 'เพิ่งซื้อแต่ยอดต่ำ — สร้าง trust' },
  { key: 'need_attention',label: 'Need Attention',    rRange: [2,3], fRange: [2,3], mRange: [2,3], tone: 'tone-risk',      ring: 'border-amber-300',   color: 'text-amber-700',   icon: AlertTriangle, thInsight: 'เริ่มห่างเหิน — re-engage personalised' },
  { key: 'about_to_sleep',label: 'About to Sleep',    rRange: [2,3], fRange: [1,2], mRange: [1,2], tone: 'tone-risk',      ring: 'border-orange-300',  color: 'text-orange-700',  icon: Calendar,      thInsight: 'กำลังจะหลับ — limited-time 20% off' },
  { key: 'at_risk',       label: 'At Risk',           rRange: [1,2], fRange: [3,5], mRange: [3,5], tone: 'tone-retention', ring: 'border-rose-300',    color: 'text-rose-700',    icon: AlertTriangle, thInsight: 'อันตราย — telesale โทรใน 7 วัน' },
  { key: 'cant_lose',     label: "Can't Lose",        rRange: [1,1], fRange: [4,5], mRange: [4,5], tone: 'tone-retention', ring: 'border-red-300',     color: 'text-red-700',     icon: Crown,         thInsight: 'ยอมเสียไม่ได้ — best-ever offer 30-40%' },
  { key: 'hibernating',   label: 'Hibernating',       rRange: [1,2], fRange: [1,2], mRange: [1,2], tone: 'tone-neutral',   ring: 'border-slate-300',   color: 'text-slate-600',   icon: Repeat,        thInsight: 'หลับลึก — re-engage 2 ครั้ง แล้ว archive' },
  { key: 'lost',          label: 'Lost',              rRange: [1,1], fRange: [1,1], mRange: [1,1], tone: 'tone-neutral',   ring: 'border-slate-200',   color: 'text-slate-500',   icon: AlertTriangle, thInsight: 'หายขาด — exclude จาก paid ads' },
]

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

const matches = (c: Customer & RfmCell, s: SegmentSpec): boolean =>
  c.r >= s.rRange[0] && c.r <= s.rRange[1] &&
  c.f >= s.fRange[0] && c.f <= s.fRange[1] &&
  c.m >= s.mRange[0] && c.m <= s.mRange[1]

export const SegmentAnalysis = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const scored = useMemo(() => scoreCustomers(customers), [customers])

  const buckets = useMemo(
    () =>
      SEGMENTS.map((seg) => {
        const list = scored.filter((c) => matches(c, seg))
        const value = list.reduce((s, c) => s + c.totalSpend, 0)
        return { seg, count: list.length, value }
      }),
    [scored],
  )

  const totalCustomers = scored.length || 1
  const totalValue = scored.reduce((s, c) => s + c.totalSpend, 0)
  const critical = buckets
    .filter((b) => ['at_risk', 'cant_lose', 'about_to_sleep'].includes(b.seg.key))
    .reduce((acc, b) => ({ count: acc.count + b.count, value: acc.value + b.value }), { count: 0, value: 0 })

  const handleSegmentClick = (segKey: string) => {
    /* Customer center filters by Thai segment names (marketing strategy
     *  segments) — for RFM keys we want the dedicated RFM analysis view
     *  with the segment auto-opened. */
    navigate(`/segments/rfm?seg=${segKey}`)
  }

  return (
    <div className="space-y-5">
      <section className="story-section">
        <div className="story-header">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          <h2 className="story-title">วิเคราะห์กลุ่มลูกค้า — RFM Overview</h2>
          <span className="story-sub">11 segments · คลิกการ์ดเพื่อเปิดรายชื่อใน Customer Center</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat tone="tone-customer" label="Total Customers" value={formatNumber(totalCustomers, { compact: true })} sub="scored ทั้งหมด" />
          <Stat tone="tone-revenue"  label="Lifetime Value"  value={formatTHB(totalValue, { compact: true })} sub="รวมยอดซื้อ" />
          <Stat tone="tone-product"  label="Champions"        value={formatNumber(buckets.find((b) => b.seg.key === 'champions')?.count ?? 0)} sub="ลูกค้าระดับสุดยอด" />
          <Stat tone="tone-risk"     label="กลุ่มเสี่ยงรวม"   value={formatNumber(critical.count)} sub={`${formatTHB(critical.value, { compact: true })} ที่เสี่ยง`} />
        </div>
      </section>

      <section className="story-section">
        <div className="story-header">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="story-title">11 Behavioral Segments</h3>
          <span className="story-sub">English labels · Thai action — คลิก → /segments/rfm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {buckets.map(({ seg, count, value }) => {
            const Icon = seg.icon
            const pct = (count / totalCustomers) * 100
            return (
              <button
                key={seg.key}
                onClick={() => handleSegmentClick(seg.key)}
                className={cn(
                  'card text-left p-4 border-2 transition-all hover:-translate-y-0.5 hover:shadow-md group',
                  seg.tone,
                  seg.ring,
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center ${seg.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 leading-tight truncate">{seg.label}</div>
                  </div>
                  <div className={`text-xs font-bold ${seg.color} whitespace-nowrap`}>{pct.toFixed(1)}%</div>
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 mb-2 min-h-[28px]">
                  {seg.thInsight}
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-white/60">
                  <div>
                    <div className={`text-lg font-bold ${seg.color}`}>{formatNumber(count)}</div>
                    <div className="text-[10px] text-slate-500">customers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatTHB(value, { compact: true })}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                      LTV
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="card tone-customer p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-800 mb-1">💡 ใช้ Segment Analysis อย่างไร</div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>• <strong>Champions + Loyal:</strong> ขอ review, สร้าง referral, ทดสอบสินค้าใหม่ก่อนเปิดตัว</li>
              <li>• <strong>At Risk + Can&apos;t Lose:</strong> ให้ telesale โทรภายใน 7 วัน — มูลค่าสูงสุดในแต่ละกลุ่ม</li>
              <li>• <strong>New + Promising:</strong> onboarding 14 วันแรก + coupon ครั้งที่ 2</li>
              <li>• <strong>Hibernating + Lost:</strong> ลด ad spend, exclude จาก paid audience</li>
            </ul>
            <button
              onClick={() => navigate('/segments/rfm')}
              className="btn-primary mt-3 text-xs"
            >
              ดู RFM Heatmap + Methodology เต็ม →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Stat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub:   string
  tone:  string
}) => (
  <div className={`card p-4 ${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)
