import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Sparkles,
  Tag,
  AlertCircle,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatDate, formatTHB, statusColor, statusLabel } from '@/lib/utils'
import { analyzeCustomer, AiInsight } from '@/lib/ai-mock'
import { AIInsightModal } from '@/components/AIInsightModal'

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const ws = workspaces.current()
  const [aiOpen, setAiOpen] = useState(false)
  const [insight, setInsight] = useState<AiInsight | null>(null)

  const customer = useMemo(() => {
    if (!ws || !id) return null
    return dataset.customersWithOverlay(ws.id).find((c) => c.id === id) ?? null
  }, [ws, id])

  if (!ws) return null
  if (!customer) {
    return (
      <div className="card p-8 text-center">
        <div className="font-semibold">ไม่พบลูกค้า</div>
        <button onClick={() => navigate('/customers')} className="btn-ghost text-xs mt-3">
          กลับ
        </button>
      </div>
    )
  }

  const openAi = () => {
    setInsight(analyzeCustomer(customer))
    setAiOpen(true)
  }

  // Synthetic order history
  const orders = Array.from({ length: Math.min(8, customer.orders) }, (_, i) => ({
    id: `ord-${i}`,
    date: new Date(
      new Date(customer.lastBuy).getTime() - i * 24 * 86400_000,
    ).toISOString(),
    items: i % 2 === 0 ? 'Zenia ผงผัก 100 กรัม + แก้ว' : 'น้ำมันกระเทียม B9',
    qty: 1 + (i % 3),
    total: customer.avgBasket * (0.8 + (i % 4) * 0.1),
    status: i === 0 ? 'completed' : i === 1 ? 'cancelled' : 'completed',
    channel: customer.channel,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> กลับ
        </button>
        <button onClick={openAi} className="btn-primary text-sm">
          <Sparkles className="w-4 h-4" /> วิเคราะห์ด้วย AI
        </button>
      </div>

      <div className="card p-6 bg-gradient-to-r from-brand-50/60 via-white to-coral-50/40">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
            style={{ background: customer.highAov ? '#f59e0b' : '#ff7a00' }}
          >
            {customer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
              <span className={cn('chip', statusColor[customer.status])}>
                {statusLabel[customer.status]}
              </span>
              {customer.highAov && (
                <span className="chip bg-amber-100 text-amber-700">⚠ High AOV</span>
              )}
              {customer.enrolled && (
                <span className="chip bg-emerald-100 text-emerald-700">
                  ✓ Enrolled · {customer.assignedSale}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {customer.phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {customer.province}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> ช่องทาง: {customer.channel}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> สมัครเมื่อ {formatDate(customer.firstBuy)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {customer.tags.map((t) => (
                <span key={t} className="chip bg-slate-100 text-slate-600">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={ShoppingBag} label="ออเดอร์ทั้งหมด" value={`${customer.orders} ออเดอร์`} />
        <MiniStat
          icon={TrendingUp}
          label="ยอดรวมตลอดอายุ"
          value={formatTHB(customer.totalSpend)}
        />
        <MiniStat icon={Calendar} label="ซื้อล่าสุด" value={formatDate(customer.lastBuy)} />
        <MiniStat
          icon={AlertCircle}
          label="Risk Score"
          value={`${customer.riskScore}/100`}
          tone={
            customer.riskScore > 60 ? 'danger' : customer.riskScore > 40 ? 'warning' : 'default'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="font-semibold text-slate-900 mb-3">ประวัติออเดอร์ล่าสุด</div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left py-2 font-medium">วันที่</th>
                <th className="text-left py-2 font-medium">สินค้า</th>
                <th className="text-right py-2 font-medium">จำนวน</th>
                <th className="text-right py-2 font-medium">ยอด</th>
                <th className="text-left py-2 font-medium">Channel</th>
                <th className="text-left py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-600">{formatDate(o.date)}</td>
                  <td className="py-2">{o.items}</td>
                  <td className="py-2 text-right">{o.qty}</td>
                  <td className="py-2 text-right font-semibold">{formatTHB(o.total)}</td>
                  <td className="py-2">{o.channel}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        'chip',
                        o.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-slate-900 mb-3">โปรไฟล์การจัดกลุ่ม</div>
          <SegLine label="Marketing" value={customer.segmentMarketing} color="brand" />
          <SegLine label="Telesale" value={customer.segmentTelesale} color="emerald" />
          <SegLine label="Ads" value={customer.segmentAds} color="rose" />

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1.5">
            <Row label="Avg Basket" value={formatTHB(customer.avgBasket)} />
            <Row label="Return Rate" value={`${customer.returnRate}%`} />
            <Row label="ช่องทางหลัก" value={customer.channel} />
            <Row label="จำนวนวันเป็นลูกค้า" value={`${Math.floor((Date.now() - new Date(customer.firstBuy).getTime()) / 86400_000)} วัน`} />
          </div>

          <button onClick={openAi} className="btn-primary w-full justify-center mt-4">
            <Sparkles className="w-4 h-4" /> วิเคราะห์ + สคริปต์โทร
          </button>
        </div>
      </div>

      <AIInsightModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        insight={insight}
        title={customer.name}
        subtitle={`${customer.phone} · ${customer.province}`}
      />
    </div>
  )
}

const MiniStat = ({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: any
  label: string
  value: string
  tone?: 'default' | 'warning' | 'danger'
}) => (
  <div className="card p-3 flex items-center gap-3">
    <div
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        tone === 'danger'
          ? 'bg-rose-100 text-rose-600'
          : tone === 'warning'
            ? 'bg-amber-100 text-amber-600'
            : 'bg-slate-100 text-slate-600',
      )}
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-semibold text-sm text-slate-900 truncate">{value}</div>
    </div>
  </div>
)

const SegLine = ({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: 'brand' | 'emerald' | 'rose'
}) => (
  <div className="flex items-center justify-between text-sm py-1.5">
    <div className="text-xs text-slate-500">{label}</div>
    <div
      className={cn(
        'chip max-w-[200px] truncate',
        color === 'brand'
          ? 'bg-brand-50 text-brand-700'
          : color === 'emerald'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-rose-50 text-rose-700',
      )}
    >
      {value}
    </div>
  </div>
)

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
)
