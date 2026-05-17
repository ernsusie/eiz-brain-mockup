import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Upload,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset, salesStore } from '@/lib/mock-data'
import { formatNumber, formatTHB, cn } from '@/lib/utils'
import {
  buildActionCards,
  buildAiSummary,
  buildMonthChanges,
  computeBriefMetrics,
  type ActionCard,
} from '@/lib/brief-insights'

const COLOR_TONES: Record<
  ActionCard['color'],
  { bg: string; text: string; border: string; ring: string }
> = {
  rose: {
    bg: 'bg-rose-50/60',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'ring-rose-200',
  },
  amber: {
    bg: 'bg-amber-50/60',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'ring-amber-200',
  },
  violet: {
    bg: 'bg-violet-50/60',
    text: 'text-violet-700',
    border: 'border-violet-200',
    ring: 'ring-violet-200',
  },
  brand: {
    bg: 'bg-brand-50/60',
    text: 'text-brand-700',
    border: 'border-brand-200',
    ring: 'ring-brand-200',
  },
  emerald: {
    bg: 'bg-emerald-50/60',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-200',
  },
  sky: {
    bg: 'bg-sky-50/60',
    text: 'text-sky-700',
    border: 'border-sky-200',
    ring: 'ring-sky-200',
  },
  pink: {
    bg: 'bg-pink-50/60',
    text: 'text-pink-700',
    border: 'border-pink-200',
    ring: 'ring-pink-200',
  },
  slate: {
    bg: 'bg-slate-50/60',
    text: 'text-slate-700',
    border: 'border-slate-200',
    ring: 'ring-slate-200',
  },
}

export const IntelligenceBrief = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  if (!ws) return null

  const data = useMemo(() => {
    const customers = dataset.customersWithOverlay(ws.id)
    const sales = salesStore.get(ws.id)
    const products = dataset.products(ws.id)
    const channels = dataset.channels(ws.id)
    const metrics = computeBriefMetrics(customers, sales, channels)
    const summary = buildAiSummary(metrics, 'พฤษภาคม 2026')
    const cards = buildActionCards(customers, sales, products, channels)
    const changes = buildMonthChanges(products, channels)
    return { metrics, summary, cards, changes }
  }, [ws.id])

  const topCard = data.cards.find((c) => c.priority === 'top')!
  const watchCards = data.cards.filter((c) => c.priority !== 'top' || c.id !== topCard.id)
  // Include the top card in the grid too (it shows again as first item like the screenshot)
  const allWatchCards = [topCard, ...watchCards.filter((c) => c.id !== topCard.id)]

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            สรุปอัจฉริยะ
          </h1>
          <p className="muted mt-1">
            สรุปสิ่งที่เปลี่ยนไปเดือนนี้ พร้อมสิ่งที่ควรทำต่อ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip bg-violet-100 text-violet-700">เพิ่งสร้าง</span>
          <span className="text-xs text-slate-500">
            🕒 อัปเดตเมื่อ 18 พ.ค. 2569 01:01
          </span>
          <button className="btn-ghost text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            อัปเดตข้อมูลใหม่
          </button>
        </div>
      </div>

      {/* Data freshness notice */}
      <div className="card tone-risk px-4 py-2.5 inline-flex items-center gap-2 text-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-amber-900">ข้อมูลล่าสุดถึงวันที่: 30 เม.ย. 2569</span>
      </div>

      {/* AI Summary card */}
      <div className="card p-6 bg-gradient-to-br from-violet-50/60 via-white to-brand-50/30 border-violet-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-semibold text-slate-900">สรุปจาก AI</div>
        </div>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          {data.summary.map((para, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: formatAiText(para) }} />
          ))}
        </div>
      </div>

      {/* Top priority card */}
      <PriorityCard card={topCard} navigate={navigate} />

      {/* Things to watch grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">สิ่งที่ควรดู</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allWatchCards.map((card) => (
            <WatchCard key={card.id} card={card} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card tone-risk p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <div className="font-semibold text-amber-900">เดือนนี้เปลี่ยนไปอย่างไร</div>
          </div>
          <ul className="space-y-2 text-sm">
            {data.changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card tone-customer p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div className="font-semibold text-emerald-900">ลูกค้าที่กลับมาแล้ว</div>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            ยังไม่มี snapshot เดือนก่อน — เริ่มเก็บประวัติได้แล้ววันนี้
          </div>
        </div>

        <div className="card tone-product p-5">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-violet-600" />
            <div className="font-semibold text-violet-900">ข้อมูลที่เพิ่งอัปโหลด</div>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed">
            ไฟล์ล่าสุด <strong>"โยอินเมษายน69.xlsx"</strong> เมื่อ 6 พ.ค. 2569 20:13 —
            ลูกค้าใหม่ 108 ราย, ซื้อครั้งแรก 102 ราย, รายได้ใหม่{' '}
            {formatTHB(140_650)}
          </div>
          <div className="mt-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
            เทียบไฟล์ก่อน: ลูกค้าใหม่ <strong>−2,691</strong>, ซื้อครั้งแรก <strong>−2,487</strong>, รายได้ใหม่{' '}
            <strong>−{formatTHB(4_380_530)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
//  Components
// =====================================================

const PriorityCard = ({
  card,
  navigate,
}: {
  card: ActionCard
  navigate: (path: string) => void
}) => {
  const tone = COLOR_TONES[card.color]
  return (
    <div
      className={cn(
        'card p-6 border-2 relative overflow-hidden',
        tone.bg,
        tone.border,
      )}
    >
      <div className="absolute top-4 right-4">
        <span className="chip bg-violet-100 text-violet-700 text-[10px]">
          ✨ สิ่งที่ควรทำก่อน
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 pr-32">
        <span className="text-2xl mr-2">{card.emoji}</span>
        {card.title}
      </h3>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        {card.description}
      </p>

      <div className="flex items-center gap-3 mt-4 text-sm">
        <span className="font-bold text-slate-900">
          {formatNumber(card.customerCount)}{' '}
          <span className="font-normal text-slate-500">ลูกค้า</span>
        </span>
        {card.revenueAtRisk > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-900">
              {formatTHB(card.revenueAtRisk).replace('฿', '')}{' '}
              <span className="font-normal text-slate-500">บาท · มูลค่าที่เกี่ยวข้อง</span>
            </span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span className="text-slate-400 italic">ยังไม่มีเดือนก่อนเทียบ</span>
      </div>

      <button
        onClick={() => navigate('/customers' + card.filterQuery)}
        className="btn-primary text-sm mt-4"
      >
        ดูรายชื่อลูกค้า
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

const WatchCard = ({
  card,
  navigate,
}: {
  card: ActionCard
  navigate: (path: string) => void
}) => {
  const tone = COLOR_TONES[card.color]
  return (
    <div
      className={cn(
        'card p-5 border-2 transition-all hover:-translate-y-0.5 hover:shadow-md',
        tone.border,
      )}
    >
      <h3 className="font-bold text-slate-900 leading-snug">
        <span className="mr-1.5">{card.emoji}</span>
        {card.title}
      </h3>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
        {card.description}
      </p>

      <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
        <span className="font-bold text-slate-900">
          {formatNumber(card.customerCount)}{' '}
          <span className="font-normal text-slate-500">ลูกค้า</span>
        </span>
        {card.revenueAtRisk > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-900">
              {formatTHB(card.revenueAtRisk).replace('฿', '')}{' '}
              <span className="font-normal text-slate-500">บาท</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">มูลค่าที่เกี่ยวข้อง</span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span className="text-slate-400 italic">ยังไม่มีเดือนก่อนเทียบ</span>
      </div>

      <button
        onClick={() => navigate('/customers' + card.filterQuery)}
        className={cn(
          'mt-4 text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 bg-white hover:bg-violet-50 transition-colors',
          tone.text,
          tone.border,
        )}
      >
        ดูรายชื่อลูกค้า
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}

// Convert **bold** markdown into <strong>
const formatAiText = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
}
