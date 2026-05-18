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
import { Package, Tag } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const PALETTE = ['#ff7a00', '#ff5722', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

/**
 * Dashboard sub-page · Products — slim view.
 *
 * Three charts only: Top 10 by revenue, revenue share pie, product
 * health table for the top 10. Deeper analysis (top 20, co-purchase
 * matrix, high-return alerts) lives on /dashboard/product-analysis.
 */
export const Products = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const products = dataset.products(ws.id)
  const top10 = products.slice(0, 10)
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const topShare = (top10[0].revenue / totalRevenue) * 100

  return (
    <div className="space-y-6">
      <section className="story-section">
        <div className="story-header">
          <Tag className="w-5 h-5 text-brand-600" />
          <h2 className="story-title">Top 10 Products by Revenue</h2>
          <span className="story-sub">เรียงตามรายได้รวม</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card tone-revenue p-5 lg:col-span-2">
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

      <section className="story-section">
        <div className="story-header">
          <Package className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">Product Health (Top 10)</h2>
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
    </div>
  )
}
