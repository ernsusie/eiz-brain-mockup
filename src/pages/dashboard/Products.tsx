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
import { useNavigate } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  Tag,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const PALETTE = ['#ff7a00', '#ff5722', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

/**
 * Dashboard sub-page · ภาพรวมสินค้า (Products overview)
 *
 * Slimmed to overview only — SKU stats, top sellers, and the product
 * health table. The deeper analytics (Top 20 single-buy table,
 * co-purchase matrix, high-return alert) live on the dedicated
 * "Product Analysis" sub-tab.
 */
export const Products = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  if (!ws) return null
  const products = dataset.products(ws.id)
  const top10 = products.slice(0, 10)
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalUnits = products.reduce((s, p) => s + p.units, 0)
  const avgAsp = Math.round(products.reduce((s, p) => s + p.asp, 0) / products.length)
  const topShare = (top10[0].revenue / totalRevenue) * 100

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

      {/* CTA to Product Analysis */}
      <button
        onClick={() => navigate('/dashboard/product-analysis')}
        className="card tone-product p-5 flex items-center gap-3 w-full text-left hover:-translate-y-0.5 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
          <LinkIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900">เจาะลึกสินค้า — Product Analysis</div>
          <div className="text-sm text-slate-600">
            Top 20 popular · เมทริกซ์สินค้าที่ซื้อร่วมกัน (bundle candidates) · สินค้าคืนสูง
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-violet-500 group-hover:translate-x-1 transition-transform" />
      </button>
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
