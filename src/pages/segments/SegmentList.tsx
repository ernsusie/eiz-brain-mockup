import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Download,
  MessageSquare,
  Sparkles,
  Users,
  ArrowDown,
  Layers,
  Target,
  Phone,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { formatNumber, formatTHB } from '@/lib/utils'
import { getChildren, getStrategies, type SegmentStrategy } from '@/lib/segment-strategies'

type SegmentKey = 'marketing' | 'telesale' | 'ads'

const KIND_META: Record<
  SegmentKey,
  { title: string; subtitle: string; emoji: string; icon: any; color: string }
> = {
  marketing: {
    title: 'Marketing Lifecycle',
    subtitle: 'แบ่งกลุ่มกว้าง · ใช้สำหรับ email / LINE OA / brand campaign',
    emoji: '💌',
    icon: Layers,
    color: 'text-brand-700',
  },
  telesale: {
    title: 'Telesale Pipeline',
    subtitle: 'Subset ของ Marketing · ลูกค้าที่ต้องมีคนโทร / แชทตัวต่อตัว',
    emoji: '📞',
    icon: Phone,
    color: 'text-emerald-700',
  },
  ads: {
    title: 'Ads / Lookalike Audiences',
    subtitle: 'Subset ของ Telesale · ใช้ลงทุน paid media + retargeting',
    emoji: '🎯',
    icon: Target,
    color: 'text-purple-700',
  },
}

export const SegmentList = ({ kind }: { kind: SegmentKey }) => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const totalCustomers = customers.length
  const meta = KIND_META[kind]
  const strategies = getStrategies(kind)

  // Distribute customers proportionally across strategies (mock — uses size weight)
  const totalSize = strategies.reduce((s, st) => s + st.size, 0)
  const segmentsWithCount = strategies.map((st) => {
    const share = st.size / totalSize
    const count = Math.round(totalCustomers * share)
    const value = customers.slice(0, count).reduce((s, c) => s + c.totalSpend, 0)
    return { ...st, count, value }
  })

  return (
    <div className="space-y-6">
      {/* Hierarchy nav (visual indicator) */}
      <div className="card tone-neutral p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" /> ลำดับชั้น Segments
          </div>
          <span className="text-xs text-slate-500">
            แต่ละขั้นเป็น subset ของขั้นก่อนหน้า · กว้าง → แคบ
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 relative">
          <TierBadge
            tier={1}
            label="Marketing"
            sub={`${getStrategies('marketing').length} segment`}
            color="bg-brand-500"
            active={kind === 'marketing'}
            onClick={() => navigate('/segments')}
          />
          <TierBadge
            tier={2}
            label="Telesale"
            sub={`${getStrategies('telesale').length} segment`}
            color="bg-emerald-500"
            active={kind === 'telesale'}
            onClick={() => navigate('/segments/telesale')}
          />
          <TierBadge
            tier={3}
            label="Ads"
            sub={`${getStrategies('ads').length} segment`}
            color="bg-purple-500"
            active={kind === 'ads'}
            onClick={() => navigate('/segments/ads')}
          />
        </div>
        <div className="mt-3 text-xs text-slate-500 italic flex items-center gap-2">
          <ArrowDown className="w-3 h-3" />
          กดเข้าไปแต่ละ segment → ดูรายชื่อลูกค้าเดี่ยว ๆ ในหน้า "ลูกค้าทั้งหมด"
        </div>
      </div>

      {/* Title */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-100`}>
          {meta.emoji}
        </div>
        <div>
          <h2 className={`text-xl font-bold ${meta.color}`}>
            {meta.title}
          </h2>
          <p className="muted">{meta.subtitle}</p>
        </div>
      </div>

      {/* Segment cards with management strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {segmentsWithCount.map((s) => {
          const isOpen = expandedId === s.id
          return (
            <div
              key={s.id}
              className={`card ${s.color} border-2 ${s.ring.replace('ring-', 'border-')} card-hover transition-all overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl shrink-0">{s.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-bold ${s.text}`}>{s.label}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">
                        {s.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold ${s.text}`}>
                      {formatNumber(s.count)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatTHB(s.value, { compact: true })}
                    </div>
                  </div>
                </div>

                {/* Quick info row */}
                <div className="bg-white/60 rounded-xl p-2.5 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <Info label="🎯 เป้าหมาย" value={s.goal} />
                    <Info label="📊 KPI" value={s.kpi} />
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                  className={`w-full text-xs font-semibold ${s.text} hover:underline flex items-center justify-center gap-1`}
                >
                  {isOpen ? 'ซ่อนรายละเอียด' : '+ ดูวิธีจัดการ + actions'}
                </button>
              </div>

              {/* Expanded actions */}
              {isOpen && (
                <div className="border-t-2 border-white/60 bg-white/40 p-4 animate-fade-in">
                  <Section title="👤 ใคร (Who)" body={s.who} />
                  <Section title="🎁 Offer ที่แนะนำ" body={s.offer} />

                  <div className="mt-3">
                    <div className="text-xs font-bold text-slate-700 mb-1.5">
                      ✅ วิธีจัดการ (Actions)
                    </div>
                    <ul className="space-y-1.5">
                      {s.actions.map((a, i) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                          <span className={`${s.text} mt-0.5 font-bold`}>{i + 1}.</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-xs font-semibold text-slate-700 mr-1">
                      📨 ช่องทาง:
                    </span>
                    {s.channels.map((ch) => (
                      <span
                        key={ch}
                        className="chip bg-white text-slate-700 border border-slate-200"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button className="btn-soft text-[11px] justify-center">
                      <Sparkles className="w-3 h-3" /> AI Content
                    </button>
                    <button className="btn-ghost text-[11px] justify-center">
                      <MessageSquare className="w-3 h-3" /> ส่งข้อความ
                    </button>
                    <button className="btn-ghost text-[11px] justify-center">
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/customers?segment=${encodeURIComponent(s.label)}&kind=${kind}`,
                      )
                    }
                    className={`mt-3 w-full flex items-center justify-between text-xs ${s.text} hover:bg-white/70 px-3 py-2 rounded-xl bg-white/50 border border-white/80`}
                  >
                    <span>
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      ดูรายชื่อลูกค้า {formatNumber(s.count)} ราย
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Strategy summary card */}
      <div className="card tone-customer p-5">
        <div className="font-semibold text-emerald-800 mb-2">
          💡 หลักการแบ่ง 3 ระดับ
        </div>
        <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
          <li>
            <strong>Marketing</strong> = กลุ่มกว้าง (broadcast) ใช้สำหรับ awareness และ
            brand-level campaign
          </li>
          <li>
            <strong>Telesale</strong> = subset ที่ต้อง <em>human touch</em> —
            สั่งให้คนโทรเฉพาะกลุ่มที่มี ROI สูงสุด
          </li>
          <li>
            <strong>Ads</strong> = subset ที่แคบที่สุด ใช้สำหรับ paid traffic /
            retargeting / lookalike — ROAS ต้องสูง
          </li>
        </ol>
      </div>
    </div>
  )
}

const TierBadge = ({
  tier,
  label,
  sub,
  color,
  active,
  onClick,
}: {
  tier: number
  label: string
  sub: string
  color: string
  active?: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`relative p-3 rounded-2xl text-left transition-all ${
      active
        ? 'bg-white border-2 border-slate-900 shadow-md'
        : 'bg-white/70 border border-slate-200 hover:border-slate-300'
    }`}
  >
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${color}`}
      >
        {tier}
      </div>
      <div>
        <div className="font-bold text-sm text-slate-900">{label}</div>
        <div className="text-[10px] text-slate-500">{sub}</div>
      </div>
    </div>
    {active && (
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
    )}
  </button>
)

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </div>
    <div className="text-xs text-slate-800 font-medium line-clamp-2">{value}</div>
  </div>
)

const Section = ({ title, body }: { title: string; body: string }) => (
  <div className="mb-2.5">
    <div className="text-xs font-bold text-slate-700">{title}</div>
    <div className="text-sm text-slate-700">{body}</div>
  </div>
)
