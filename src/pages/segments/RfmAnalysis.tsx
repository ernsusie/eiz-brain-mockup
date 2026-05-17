import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Crown,
  Heart,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Wallet,
  Repeat,
  Users,
  Info,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

// RFM = Recency · Frequency · Monetary
// All UI labels in English (technical term). All notes / analysis in Thai.

type RfmCell = { r: number; f: number; m: number }

const score = (
  customers: Customer[],
): (Customer & RfmCell)[] => {
  if (customers.length === 0) return []
  // Quintile ranking 1-5
  const today = Date.now()
  const recencyDays = customers.map((c) => (today - new Date(c.lastBuy).getTime()) / 86400_000)
  const frequencyVals = customers.map((c) => c.orders)
  const monetaryVals = customers.map((c) => c.totalSpend)
  const quintile = (v: number, sorted: number[], reverse = false) => {
    const idx = sorted.findIndex((x) => x >= v)
    const pct = idx / Math.max(1, sorted.length - 1)
    const q = Math.min(5, Math.max(1, Math.ceil(pct * 5)))
    return reverse ? 6 - q : q
  }
  const sortedR = [...recencyDays].sort((a, b) => a - b)
  const sortedF = [...frequencyVals].sort((a, b) => a - b)
  const sortedM = [...monetaryVals].sort((a, b) => a - b)
  return customers.map((c, i) => ({
    ...c,
    r: quintile(recencyDays[i], sortedR, true), // lower days = better R
    f: quintile(frequencyVals[i], sortedF),
    m: quintile(monetaryVals[i], sortedM),
  }))
}

interface RfmSegment {
  key: string
  label: string
  rRange: [number, number]
  fRange: [number, number]
  mRange: [number, number]
  color: string
  bg: string
  ring: string
  icon: any
  description: string
  insightTh: string
  actionTh: string[]
}

// Classic RFM 10-segment model (Recency/Frequency/Monetary, English labels)
const RFM_SEGMENTS: RfmSegment[] = [
  {
    key: 'champions',
    label: 'Champions',
    rRange: [4, 5],
    fRange: [4, 5],
    mRange: [4, 5],
    color: 'text-emerald-700',
    bg: 'tone-customer',
    ring: 'border-emerald-300',
    icon: Crown,
    description: 'Bought recently, buy often, spend the most.',
    insightTh:
      'ลูกค้าทองคำ — ซื้อบ่อย ซื้อเยอะ และเพิ่งซื้อล่าสุด เป็น 5% สูงสุดของฐานลูกค้า',
    actionTh: [
      'ขอ review + testimonial ใช้เป็นคอนเทนต์โฆษณา',
      'ส่ง VIP referral code (ลด 200x2 ทั้งคู่)',
      'ทดสอบสินค้าใหม่ก่อนเปิดตัวจริง (early access)',
    ],
  },
  {
    key: 'loyal',
    label: 'Loyal Customers',
    rRange: [2, 5],
    fRange: [3, 5],
    mRange: [3, 5],
    color: 'text-sky-700',
    bg: 'tone-geo',
    ring: 'border-sky-300',
    icon: Heart,
    description: 'Buy regularly, responsive to promotions.',
    insightTh:
      'ลูกค้าประจำ — เก่งในการตอบสนองโปรโมชั่น ใช้กระตุ้น upsell ขึ้นไประดับ champion ได้',
    actionTh: [
      'เสนอ bundle / upsell สินค้าระดับสูงขึ้น',
      'เชิญเข้า VIP membership',
      'ส่ง personalized recommendation จาก purchase history',
    ],
  },
  {
    key: 'potential',
    label: 'Potential Loyalists',
    rRange: [3, 5],
    fRange: [1, 3],
    mRange: [1, 3],
    color: 'text-violet-700',
    bg: 'tone-product',
    ring: 'border-violet-300',
    icon: Sparkles,
    description: 'Recent customers with average frequency.',
    insightTh:
      'มีศักยภาพเป็น loyal — เพิ่งซื้อล่าสุดและซื้อเป็นระยะ ๆ ต้องการการกระตุ้นที่ตรงจุด',
    actionTh: [
      'แนะนำสินค้า cross-sell ที่เกี่ยวข้อง',
      'ส่ง email/LINE OA แบบ educational',
      'Loyalty program สะสมแต้ม',
    ],
  },
  {
    key: 'new',
    label: 'New Customers',
    rRange: [4, 5],
    fRange: [1, 1],
    mRange: [1, 3],
    color: 'text-blue-700',
    bg: 'tone-geo',
    ring: 'border-blue-300',
    icon: Users,
    description: 'First-time buyers within the last month.',
    insightTh:
      'ลูกค้าใหม่ — โอกาสทอง ต้องสร้าง experience ที่ดีและกระตุ้น order ที่ 2 ภายใน 30 วัน',
    actionTh: [
      'Onboarding sequence (welcome email + LINE OA 3 ข้อความใน 14 วัน)',
      'Coupon 150 บาท สำหรับ order ที่ 2',
      'ส่งวิดีโอ how-to + รีวิวจริง',
    ],
  },
  {
    key: 'promising',
    label: 'Promising',
    rRange: [3, 4],
    fRange: [1, 1],
    mRange: [1, 1],
    color: 'text-cyan-700',
    bg: 'tone-geo',
    ring: 'border-cyan-300',
    icon: TrendingUp,
    description: 'Recent shoppers but haven\'t spent much.',
    insightTh:
      'เพิ่งซื้อแต่จ่ายน้อย — ต้องสร้างความเชื่อมั่นก่อนยอมจ่ายเงินก้อนใหญ่',
    actionTh: [
      'แสดง social proof + reviews',
      'แนะนำ trial pack ราคาเข้าถึงได้',
      'Live demo / Q&A session',
    ],
  },
  {
    key: 'need_attention',
    label: 'Need Attention',
    rRange: [2, 3],
    fRange: [2, 3],
    mRange: [2, 3],
    color: 'text-amber-700',
    bg: 'tone-risk',
    ring: 'border-amber-300',
    icon: AlertTriangle,
    description: 'Above-average recency, frequency, monetary — but declining.',
    insightTh:
      'เริ่มห่างเหิน — ต้องดึงความสนใจกลับมาก่อนจะกลายเป็น at-risk',
    actionTh: [
      'ส่ง re-engagement email ที่ personalized',
      'เสนอ limited-time offer',
      'แสดงสินค้าใหม่ + collection ล่าสุด',
    ],
  },
  {
    key: 'about_to_sleep',
    label: 'About to Sleep',
    rRange: [2, 3],
    fRange: [1, 2],
    mRange: [1, 2],
    color: 'text-orange-700',
    bg: 'tone-risk',
    ring: 'border-orange-300',
    icon: Calendar,
    description: 'Below-average recency, low frequency.',
    insightTh:
      'กำลังจะหลับ — ห่างจาก last buy 60-90 วัน ถ้าไม่ทำอะไรจะกลายเป็น lost',
    actionTh: [
      'Limited time offer 20% off',
      'Win-back coupon ส่งทาง LINE OA',
      'Reminder ads ใน FB / IG',
    ],
  },
  {
    key: 'at_risk',
    label: 'At Risk',
    rRange: [1, 2],
    fRange: [3, 5],
    mRange: [3, 5],
    color: 'text-rose-700',
    bg: 'tone-retention',
    ring: 'border-rose-300',
    icon: AlertTriangle,
    description: 'Used to buy often & spend a lot — now drifting away.',
    insightTh:
      'อันตราย — เคยเป็น VIP แต่ห่างไปนาน มูลค่า lifetime สูง ต้องเร่งดึงกลับด่วน',
    actionTh: [
      'Telesale โทรหาภายใน 7 วัน',
      'Personal offer 25-30% off',
      'ส่ง care package + handwritten note',
    ],
  },
  {
    key: 'cant_lose',
    label: "Can't Lose Them",
    rRange: [1, 1],
    fRange: [4, 5],
    mRange: [4, 5],
    color: 'text-red-700',
    bg: 'tone-retention',
    ring: 'border-red-300',
    icon: Crown,
    description: 'Highest-value customers who haven\'t purchased in a while.',
    insightTh:
      'ยอมเสียไม่ได้ — top spenders ที่หายไป มูลค่ามหาศาล ใช้ best offer ที่เคยมี',
    actionTh: [
      'Best-ever offer (30-40% off / free gift)',
      'CEO-level call หรือ video message ส่วนตัว',
      'Reactivation ด้วย bundle premium',
    ],
  },
  {
    key: 'hibernating',
    label: 'Hibernating',
    rRange: [1, 2],
    fRange: [1, 2],
    mRange: [1, 2],
    color: 'text-slate-600',
    bg: 'tone-neutral',
    ring: 'border-slate-300',
    icon: Repeat,
    description: 'Low everything — haven\'t bought in a long time.',
    insightTh:
      'หลับลึก — ถ้า re-engage 2 ครั้งแล้วยังไม่ตอบ ให้ archive ได้เพื่อประหยัด ads budget',
    actionTh: [
      'Re-engage 2 ครั้งใน 60 วัน',
      'ถ้าไม่ตอบ → archive จาก active list',
      'Suppress จาก ads audience',
    ],
  },
  {
    key: 'lost',
    label: 'Lost',
    rRange: [1, 1],
    fRange: [1, 1],
    mRange: [1, 1],
    color: 'text-slate-500',
    bg: 'tone-neutral',
    ring: 'border-slate-200',
    icon: AlertTriangle,
    description: 'Lowest recency, frequency, and monetary.',
    insightTh:
      'หายขาด — ลงทุนเพิ่มไม่คุ้ม ใช้เป็น exclusion list ใน ads campaign',
    actionTh: [
      'Exclude จาก paid ads',
      'Final win-back attempt (one shot)',
      'ลบจาก marketing automation',
    ],
  },
]

const matchesSegment = (c: Customer & RfmCell, seg: RfmSegment): boolean =>
  c.r >= seg.rRange[0] &&
  c.r <= seg.rRange[1] &&
  c.f >= seg.fRange[0] &&
  c.f <= seg.fRange[1] &&
  c.m >= seg.mRange[0] &&
  c.m <= seg.mRange[1]

export const RfmAnalysis = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<RfmSegment | null>(null)
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const scored = useMemo(() => score(customers), [customers])

  const segmentBuckets = useMemo(
    () =>
      RFM_SEGMENTS.map((seg) => {
        const list = scored.filter((c) => matchesSegment(c, seg))
        const value = list.reduce((s, c) => s + c.totalSpend, 0)
        return { seg, count: list.length, value }
      }),
    [scored],
  )

  const totalCustomers = scored.length || 1
  const totalValue = scored.reduce((s, c) => s + c.totalSpend, 0)

  // Heatmap data: cells R 1-5 × F 1-5 average count
  const heatmap: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  scored.forEach((c) => {
    heatmap[5 - c.r][c.f - 1] += 1
  })
  const heatMax = Math.max(...heatmap.flat(), 1)

  return (
    <div className="space-y-6">
      {/* Header — English title, Thai note */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">RFM Segmentation Analysis</h2>
          <p className="muted">
            Recency · Frequency · Monetary — วิธีจัดกลุ่มลูกค้าตามพฤติกรรมจริง
          </p>
        </div>
        <button
          onClick={() => navigate('/segments')}
          className="btn-ghost text-xs hidden md:inline-flex"
        >
          ← Back to Lifecycle Segments
        </button>
      </div>

      {/* Methodology card (English + Thai) */}
      <div className="card tone-neutral p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900 mb-1">How RFM works</div>
            <p className="text-sm text-slate-600 mb-3">
              Each customer is scored 1-5 on three dimensions, then mapped to a behavioral segment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DimensionCard
                letter="R"
                title="Recency"
                en="Days since last purchase"
                th="ซื้อล่าสุดเมื่อกี่วันก่อน · ยิ่งน้อยยิ่งดี (คะแนน 5 = ดีที่สุด)"
                tone="tone-revenue"
                accent="bg-brand-100 text-brand-700"
              />
              <DimensionCard
                letter="F"
                title="Frequency"
                en="Total number of orders"
                th="จำนวนครั้งที่ซื้อทั้งหมด · ยิ่งมากยิ่งดี"
                tone="tone-customer"
                accent="bg-emerald-100 text-emerald-700"
              />
              <DimensionCard
                letter="M"
                title="Monetary"
                en="Total spend (lifetime value)"
                th="ยอดใช้จ่ายรวมตลอด · ยิ่งสูงยิ่งดี"
                tone="tone-product"
                accent="bg-violet-100 text-violet-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          tone="tone-customer"
          label="Total Customers"
          value={formatNumber(totalCustomers, { compact: true })}
          sub="scored ทั้งหมด"
        />
        <StatCard
          tone="tone-revenue"
          label="Lifetime Value"
          value={formatTHB(totalValue, { compact: true })}
          sub="ผลรวม monetary"
        />
        <StatCard
          tone="tone-product"
          label="Champions"
          value={formatNumber(segmentBuckets.find((b) => b.seg.key === 'champions')?.count ?? 0)}
          sub="ลูกค้าระดับสุดยอด"
        />
        <StatCard
          tone="tone-risk"
          label="At Risk + Can't Lose"
          value={formatNumber(
            (segmentBuckets.find((b) => b.seg.key === 'at_risk')?.count ?? 0) +
              (segmentBuckets.find((b) => b.seg.key === 'cant_lose')?.count ?? 0),
          )}
          sub="ต้องเร่งดึงกลับ"
        />
      </div>

      {/* RFM 5x5 heatmap */}
      <div className="card tone-product p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-slate-900">R × F Heatmap</div>
            <div className="muted">
              แกนซ้าย = Recency (R5 = เพิ่งซื้อ) · แกนล่าง = Frequency (F5 = บ่อยที่สุด)
            </div>
          </div>
          <span className="chip bg-violet-100 text-violet-700">5×5 Grid</span>
        </div>
        <div className="flex items-start gap-2">
          {/* Y axis label */}
          <div className="flex flex-col-reverse items-end justify-around h-[260px] py-2 text-[10px] font-bold text-slate-500">
            <span>R1</span>
            <span>R2</span>
            <span>R3</span>
            <span>R4</span>
            <span>R5</span>
          </div>
          {/* Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-1.5">
              {heatmap.map((row, rIdx) =>
                row.map((cell, fIdx) => {
                  const intensity = cell / heatMax
                  return (
                    <div
                      key={`${rIdx}-${fIdx}`}
                      className="aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all hover:scale-105 cursor-default"
                      style={{
                        background: `rgba(255, 122, 0, ${0.08 + intensity * 0.85})`,
                        color: intensity > 0.5 ? 'white' : '#0f172a',
                      }}
                    >
                      {cell || ''}
                    </div>
                  )
                }),
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {['F1', 'F2', 'F3', 'F4', 'F5'].map((l) => (
                <div key={l} className="text-center text-[10px] font-bold text-slate-500">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 italic">
          มุมบนขวา (R5/F5) = ลูกค้าทอง · มุมล่างซ้าย (R1/F1) = ลูกค้าหายขาด
        </div>
      </div>

      {/* 11 RFM segments grid */}
      <div>
        <div className="story-header">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className="story-title">11 Behavioral Segments</h3>
          <span className="story-sub">English labels · Thai action notes — click for detail</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {segmentBuckets.map(({ seg, count, value }) => {
            const Icon = seg.icon
            const pct = (count / totalCustomers) * 100
            return (
              <button
                key={seg.key}
                onClick={() => setSelected(seg)}
                className={cn(
                  'card text-left p-4 border-2 transition-all hover:-translate-y-0.5 hover:shadow-md',
                  seg.bg,
                  seg.ring,
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center ${seg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 leading-tight">{seg.label}</div>
                  </div>
                  <div className={`text-xs font-bold ${seg.color}`}>{pct.toFixed(1)}%</div>
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                  {seg.description}
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-white/60">
                  <div>
                    <div className={`text-lg font-bold ${seg.color}`}>{formatNumber(count)}</div>
                    <div className="text-[10px] text-slate-500">customers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {formatTHB(value, { compact: true })}
                    </div>
                    <div className="text-[10px] text-slate-500">LTV</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className={cn(
              'card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-slide-up border-2',
              selected.bg,
              selected.ring,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center ${selected.color}`}>
                  <selected.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    RFM Segment
                  </div>
                  <h3 className={`text-xl font-bold ${selected.color}`}>{selected.label}</h3>
                  <div className="text-sm text-slate-600 mt-1">{selected.description}</div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className="chip bg-white text-slate-700 border border-slate-200">
                R: {selected.rRange[0]}-{selected.rRange[1]}
              </span>
              <span className="chip bg-white text-slate-700 border border-slate-200">
                F: {selected.fRange[0]}-{selected.fRange[1]}
              </span>
              <span className="chip bg-white text-slate-700 border border-slate-200">
                M: {selected.mRange[0]}-{selected.mRange[1]}
              </span>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 mb-3">
              <div className="text-xs font-bold text-slate-700 mb-1">📝 ข้อสังเกต</div>
              <div className="text-sm text-slate-800">{selected.insightTh}</div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-700 mb-2">✅ แนวทางการจัดการ</div>
              <ul className="space-y-1.5">
                {selected.actionTh.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className={`font-bold ${selected.color}`}>{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                navigate(`/customers?segment=${encodeURIComponent(selected.label)}&kind=marketing`)
                setSelected(null)
              }}
              className="btn-primary w-full justify-center mt-4"
            >
              <Users className="w-4 h-4" /> ดูรายชื่อลูกค้าใน segment นี้
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const DimensionCard = ({
  letter,
  title,
  en,
  th,
  tone,
  accent,
}: {
  letter: string
  title: string
  en: string
  th: string
  tone: string
  accent: string
}) => (
  <div className={`rounded-2xl p-3 border ${tone}`}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold ${accent}`}>
        {letter}
      </div>
      <div className="font-bold text-slate-900">{title}</div>
    </div>
    <div className="text-xs text-slate-600 italic mb-1">{en}</div>
    <div className="text-xs text-slate-700">{th}</div>
  </div>
)

const StatCard = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: string
}) => (
  <div className={`card p-4 ${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)
