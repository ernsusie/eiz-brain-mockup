import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'
import {
  Package,
  AlertTriangle,
  RefreshCcw,
  Tag,
  Trophy,
  LinkIcon,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const PALETTE = ['#ff7a00', '#ff5722', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

export const Products = () => {
  const ws = workspaces.current()
  const [showMatrix, setShowMatrix] = useState(true)
  if (!ws) return null
  const products = dataset.products(ws.id)
  const top10 = products.slice(0, 10)
  const top20 = dataset.top20Popular(ws.id)
  const coPurchase = dataset.coPurchase(ws.id)
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalUnits = products.reduce((s, p) => s + p.units, 0)
  const avgAsp = Math.round(products.reduce((s, p) => s + p.asp, 0) / products.length)
  const topShare = (top10[0].revenue / totalRevenue) * 100
  const highReturn = products.filter((p) => p.returnRate > 4)
  const maxRevenue = top20[0]?.revenue ?? 1

  return (
    <div className="space-y-6">
      {/* Chapter 1 — Product overview */}
      <section className="story-section">
        <div className="story-header">
          <Package className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">ภาพรวมสินค้า — Product Overview</h2>
          <span className="story-sub">รวม SKU, สินค้าขายดี และส่วนแบ่งรายได้</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Mini icon={Package} tone="product" label="Active SKU" value="20" sub="ขายอยู่จริง" />
          <Mini
            icon={Tag}
            tone="product"
            label="Total Units"
            value={formatNumber(totalUnits, { compact: true })}
            sub="ขายไปทั้งหมด"
          />
          <Mini
            icon={Tag}
            tone="revenue"
            label="Avg Selling Price"
            value={formatTHB(avgAsp)}
            sub="เฉลี่ยต่อชิ้น"
          />
          <Mini
            icon={Package}
            tone="revenue"
            label="Top Product Share"
            value={`${topShare.toFixed(1)}%`}
            sub={top10[0].name.slice(0, 18) + '...'}
          />
          <Mini
            icon={AlertTriangle}
            tone="risk"
            label="Inactive 60d"
            value="403"
            sub="ไม่ขายใน 60 วัน"
          />
        </div>
      </section>

      {/* Chapter 2 — What sells */}
      <section className="story-section">
        <div className="story-header">
          <Tag className="w-5 h-5 text-brand-600" />
          <h2 className="story-title">ขายดีที่สุด — Top Sellers</h2>
          <span className="story-sub">เรียงตามรายได้ · 80% มาจากสินค้า top 10</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card tone-revenue p-5 lg:col-span-2">
            <div className="font-semibold mb-3">Top 10 Products by Revenue</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={top10}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={200}
                  tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 27) + '...' : v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatTHB(v, { compact: true })}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {top10.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card tone-product p-5">
            <div className="font-semibold mb-3">สัดส่วนรายได้</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={top10}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {top10.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatTHB(v, { compact: true })}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2 text-xs text-slate-500">
              สินค้าอันดับ 1 ครองส่วนแบ่ง <strong>{topShare.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3 — Product health table */}
      <section className="story-section">
        <div className="story-header">
          <Package className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">Product Health</h2>
          <span className="story-sub">รายได้ · ลูกค้า · ความถี่ · อัตราคืน — ทุกอย่างในที่เดียว</span>
        </div>

        <div className="card tone-product overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-50/50 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Product</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Revenue</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Units</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Customers</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Avg Freq</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ASP</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Return %</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((p) => (
                  <tr key={p.id} className="border-t border-violet-100/40 hover:bg-white/50">
                    <td className="px-4 py-2.5 max-w-xs truncate">{p.name}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-brand-700">
                      {formatTHB(p.revenue, { compact: true })}
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.units)}</td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.customers)}</td>
                    <td className="px-3 py-2.5 text-right">{p.avgFreq}×</td>
                    <td className="px-3 py-2.5 text-right">{formatTHB(p.asp)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          'chip',
                          p.returnRate > 5
                            ? 'bg-rose-100 text-rose-700'
                            : p.returnRate > 3
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700',
                        )}
                      >
                        {p.returnRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Chapter 4 — Top 20 Popular */}
      <section className="story-section">
        <div className="story-header">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="story-title">สินค้ายอดนิยม Top 20</h2>
          <span className="story-sub">
            จัดอันดับตามรายได้ · สังเกตอัตรา "ซื้อเดียว" — ยิ่งสูงยิ่งควรทำ bundle
          </span>
        </div>

        <div className="card tone-revenue overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60 text-xs text-slate-600">
                <tr>
                  <th className="text-center px-3 py-2.5 font-semibold w-10">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold">สินค้า</th>
                  <th className="text-right px-3 py-2.5 font-semibold">รายได้</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ออเดอร์</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ซื้อเดียว</th>
                  <th className="text-left px-3 py-2.5 font-semibold w-40">สัดส่วนรายได้</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-t border-brand-100/30 hover:bg-white/60"
                  >
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                          i < 3
                            ? 'bg-brand-500 text-white'
                            : i < 10
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-md truncate font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-brand-700">
                      {formatTHB(p.revenue, { compact: true })}
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.customers)}</td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.orders)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">
                          {formatNumber(p.singleBuyCount)}
                        </span>
                        {p.singleBuyPct >= 50 && (
                          <span className="chip bg-rose-100 text-rose-700 text-[10px]">
                            {p.singleBuyPct}%
                          </span>
                        )}
                        {p.singleBuyPct < 50 && p.singleBuyPct >= 25 && (
                          <span className="chip bg-amber-100 text-amber-700 text-[10px]">
                            {p.singleBuyPct}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-400 to-coral-500"
                          style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card tone-customer p-4 mt-3">
          <div className="text-sm text-slate-700">
            💡 <strong>ข้อสังเกต:</strong> สินค้าที่มี "ซื้อเดียว" สูง (
            <span className="chip bg-rose-100 text-rose-700 text-[10px]">≥ 50%</span>)
            แปลว่าลูกค้าซื้อแล้วไม่ต่อ — ควรทำ <strong>bundle</strong> หรือ{' '}
            <strong>cross-sell campaign</strong> เพื่อกระตุ้นการซื้อร่วมกับสินค้าอื่น
          </div>
        </div>
      </section>

      {/* Chapter 5 — Co-purchase matrix */}
      <section className="story-section">
        <div className="story-header">
          <LinkIcon className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">เมทริกซ์สินค้าที่ซื้อร่วมกัน</h2>
          <span className="story-sub">
            ตัวเลข = จำนวนลูกค้าที่ซื้อทั้ง 2 สินค้า · เซลล์เขียวเข้ม = คู่ขายดี (ทำ bundle ได้)
          </span>
        </div>

        <div className="card tone-product p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-500">
              สินค้า {coPurchase.products.length} ตัว · เลื่อนเพื่อดูทั้งหมด
            </div>
            <button
              onClick={() => setShowMatrix((s) => !s)}
              className="text-xs text-violet-700 hover:underline"
            >
              {showMatrix ? 'ซ่อนเมทริกซ์' : 'แสดงเมทริกซ์'}
            </button>
          </div>
          {showMatrix && <CoPurchaseMatrix data={coPurchase} />}
        </div>
      </section>

      {/* Chapter 6 — High-return alert */}
      {highReturn.length > 0 && (
        <section className="story-section">
          <div className="story-header">
            <RefreshCcw className="w-5 h-5 text-rose-600" />
            <h2 className="story-title">สินค้าคืนสูง — High Return Watch</h2>
            <span className="story-sub">มากกว่า 4% ต้องตรวจคุณภาพ / packaging</span>
          </div>

          <div className="card tone-risk p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highReturn.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-amber-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Return rate <strong className="text-rose-600">{p.returnRate}%</strong>{' '}
                      · เสียโอกาส ~{formatTHB(p.returns * p.asp, { compact: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-amber-900 bg-amber-50/60 rounded-xl p-3 border border-amber-100">
              💡 <strong>แนะนำ:</strong> ตรวจ packaging + รีวิวจากลูกค้า + คุยกับ supplier
              ภายใน 7 วัน
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const CoPurchaseMatrix = ({
  data,
}: {
  data: { products: { id: string; name: string }[]; matrix: number[][] }
}) => {
  const { products, matrix } = data
  const max = Math.max(...matrix.flat(), 1)

  const cellColor = (v: number) => {
    if (v === 0) return { bg: 'transparent', fg: '#cbd5e1' }
    const t = v / max
    if (t >= 0.5) return { bg: 'rgba(16, 185, 129, 0.85)', fg: 'white' }
    if (t >= 0.25) return { bg: 'rgba(16, 185, 129, 0.45)', fg: '#065f46' }
    if (t >= 0.1) return { bg: 'rgba(16, 185, 129, 0.18)', fg: '#0f766e' }
    return { bg: 'rgba(148, 163, 184, 0.12)', fg: '#475569' }
  }

  const short = (s: string, n = 14) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

  return (
    <div className="overflow-auto max-w-full">
      <table className="text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 p-1 text-left w-40 max-w-40" />
            {products.map((p, i) => (
              <th
                key={p.id}
                className="p-1 align-bottom min-w-[28px]"
                title={p.name}
              >
                <div
                  className="text-[9px] text-slate-500 font-medium whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    height: '100px',
                  }}
                >
                  {i + 1}. {short(p.name, 18)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((row, i) => (
            <tr key={row.id}>
              <td
                className="sticky left-0 bg-white z-10 p-1 pr-2 font-medium text-slate-700 text-[10px] whitespace-nowrap truncate w-40 max-w-40"
                title={row.name}
              >
                {i + 1}. {short(row.name, 22)}
              </td>
              {products.map((col, j) => {
                if (i === j) {
                  return (
                    <td
                      key={col.id}
                      className="border border-white text-center text-slate-300 bg-slate-50"
                    >
                      —
                    </td>
                  )
                }
                const v = matrix[i][j]
                const { bg, fg } = cellColor(v)
                return (
                  <td
                    key={col.id}
                    className="border border-white text-center font-semibold transition-transform hover:scale-110 hover:z-10 relative cursor-default"
                    style={{
                      background: bg,
                      color: fg,
                      minWidth: 28,
                      height: 24,
                    }}
                    title={`${row.name} × ${col.name}: ${v}`}
                  >
                    {v > 0 ? v : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span>ความถี่ที่ซื้อร่วมกัน:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200" /> 0
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.18)' }} /> น้อย
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.45)' }} /> ปานกลาง
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.85)' }} /> สูง (Bundle candidate)
        </div>
      </div>
    </div>
  )
}

const Mini = ({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: any
  label: string
  value: string
  sub: string
  tone: 'revenue' | 'product' | 'risk' | 'customer'
}) => {
  const tones: Record<string, string> = {
    revenue: 'bg-brand-100 text-brand-700',
    product: 'bg-violet-100 text-violet-700',
    risk: 'bg-amber-100 text-amber-700',
    customer: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <div className={`card p-3 tone-${tone}`}>
      <div className="flex items-start gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
          <div className="font-bold text-sm text-slate-900 truncate">{value}</div>
          <div className="text-[10px] text-slate-500 truncate">{sub}</div>
        </div>
      </div>
    </div>
  )
}
