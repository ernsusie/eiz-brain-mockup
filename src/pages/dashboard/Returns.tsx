import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Globe,
  MapPin,
  Percent,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const BADGE_COLOR: Record<string, string> = {
  first_buy_cooling:         'bg-amber-100 text-amber-700',
  almost_lost:               'bg-rose-100 text-rose-700',
  first_buy_warming:         'bg-orange-100 text-orange-700',
  lost_customer:             'bg-slate-200 text-slate-700',
  low_value_first_buy_aging: 'bg-violet-100 text-violet-700',
}

/**
 * Dashboard sub-page · Returns (rebuilt per attached design)
 *
 * Layout:
 *  1. KPI strip — Returned · Lost Revenue · Return Rate · % of Total Orders
 *  2. Monthly Return Trend (bar + line combo)
 *  3. By Channel + By Province tables (side-by-side)
 *  4. Staff Return Rate by Month heatmap
 *  5. Top Returned Products + High-Risk Customers (Frequent Returns)
 */
export const Returns = () => {
  const ws = workspaces.current()
  const [showCancels, setShowCancels] = useState(false)
  if (!ws) return null

  const channelSplit = dataset.channelReturnSplit(ws.id)
  const monthlyRet   = dataset.monthlyReturns(ws.id)
  const byProvince   = dataset.returnsByProvince(ws.id)
  const staffRate    = dataset.staffReturnRate(ws.id)
  const topProducts  = dataset.topReturnedProducts(ws.id)
  const highRisk     = dataset.highRiskReturnCustomers(ws.id)

  const totalReturned = channelSplit.reduce((s, c) => s + c.returned, 0)
  const totalCancelled = channelSplit.reduce((s, c) => s + c.cancelled, 0)
  const totalOrders   = channelSplit.reduce((s, c) => s + c.completed + c.cancelled + c.returned, 0)
  const lostRevenue   = monthlyRet.reduce((s, m) => s + m.lost, 0)
  const returnRate    = (totalReturned / Math.max(1, totalOrders)) * 100

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500 italic">
          Returns = orders shipped but customer refused delivery — indicates bad behavior and real loss
        </p>
        <button
          onClick={() => setShowCancels((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold',
            showCancels
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          )}
        >
          👁 {showCancels ? 'Hide Cancels' : 'Show Cancels'}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi tone="amber"  icon={Activity}     label="Returned"          value={formatNumber(totalReturned)} sub={formatTHB(lostRevenue, { compact: true })} />
        <Kpi tone="rose"   icon={DollarSign}   label="Lost Revenue (Returns)" value={formatTHB(lostRevenue)} />
        <Kpi tone="amber"  icon={Percent}      label="Return Rate"       value={`${returnRate.toFixed(1)}%`} />
        <Kpi tone="amber"  icon={ShoppingCart} label="Of Total Orders"   value={formatNumber(totalOrders)} sub={`${formatNumber(totalReturned)} คืน`} />
      </div>

      {/* Cancel KPIs when toggled */}
      {showCancels && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi tone="amber" icon={Activity}     label="Cancelled" value={formatNumber(totalCancelled)} sub="ยกเลิกก่อนส่ง" />
          <Kpi tone="amber" icon={Percent}      label="Cancel Rate" value={`${((totalCancelled / Math.max(1, totalOrders)) * 100).toFixed(2)}%`} />
          <Kpi tone="amber" icon={DollarSign}   label="Cancel Loss (Est.)" value={formatTHB(lostRevenue * 0.6, { compact: true })} sub="ประมาณการ" />
          <Kpi tone="amber" icon={ShoppingCart} label="Completed" value={formatNumber(channelSplit.reduce((s, c) => s + c.completed, 0))} />
        </div>
      )}

      {/* Monthly Return Trend — bar + line combo */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-slate-900">Monthly Return Trend</div>
            <div className="text-xs text-slate-500">จำนวน (แท่ง) · Rate % (เส้น)</div>
          </div>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-600 text-white">6M</button>
            <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">All</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyRet} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} domain={[0, 'dataMax + 0.5']} />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              formatter={(v: number, n: string) =>
                n === 'rate' ? [`${v.toFixed(2)}%`, 'Rate %'] : [formatNumber(v), 'Returned']
              }
            />
            <Bar  yAxisId="left"  dataKey="returned" name="Returned" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Line yAxisId="right" dataKey="rate"     name="Rate %"   stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* By Channel + By Province */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">By Channel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left py-2 px-5 font-semibold">Channel</th>
                  <th className="text-right py-2 px-3 font-semibold">Return</th>
                  <th className="text-right py-2 px-3 font-semibold">Lost</th>
                  <th className="text-right py-2 px-5 font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {channelSplit.map((c) => (
                  <tr key={c.channel} className="hover:bg-slate-50">
                    <td className="py-2.5 px-5 font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      {c.channel}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-semibold">{formatNumber(c.returned)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatTHB(c.returned * (c.revenue / Math.max(1, c.completed + c.cancelled + c.returned)), { compact: true })}</td>
                    <td className="py-2.5 px-5 text-right font-bold">{c.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">By Province</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left py-2 px-5 font-semibold">Province</th>
                  <th className="text-right py-2 px-3 font-semibold">Return</th>
                  <th className="text-right py-2 px-3 font-semibold">Lost</th>
                  <th className="text-right py-2 px-5 font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byProvince.map((p) => (
                  <tr key={p.province} className="hover:bg-slate-50">
                    <td className="py-2.5 px-5 font-medium">{p.province}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-semibold">{formatNumber(p.returned)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatTHB(p.lost, { compact: true })}</td>
                    <td className="py-2.5 px-5 text-right font-bold">{p.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Staff Return Rate by Month — heatmap */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Staff Return Rate by Month</h3>
          <span className="text-[11px] text-slate-500">
            Identify staff with abnormally high return rates — may indicate fake COD orders to inflate KPIs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-4 font-semibold sticky left-0 bg-slate-50">Staff</th>
                <th className="text-right py-2 px-3 font-semibold">Overall</th>
                {staffRate[0]?.months.map((m) => (
                  <th key={m} className="text-right py-2 px-2 font-semibold whitespace-nowrap">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffRate.map((s) => (
                <tr key={s.staff} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 font-medium text-slate-900 sticky left-0 bg-white">{s.staff}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={cn(
                      'font-bold',
                      s.overall >= 5 ? 'text-rose-600' : s.overall >= 3 ? 'text-amber-600' : 'text-slate-600',
                    )}>
                      {s.overall.toFixed(1)}%
                    </span>
                    <div className="text-[9px] text-slate-400">({s.totalReturns}/{s.totalOrders})</div>
                  </td>
                  {s.months.map((m) => {
                    const cell = s.monthlyData[m]
                    if (!cell) return <td key={m} className="py-2 px-2 text-center text-slate-300">—</td>
                    const intensity = Math.min(1, cell.rate / 6)
                    return (
                      <td key={m} className="py-2 px-2 text-right" style={{ background: `rgba(245, 158, 11, ${intensity * 0.35})` }}>
                        <div className={cn('font-semibold', cell.rate >= 4 ? 'text-rose-700' : cell.rate >= 2 ? 'text-amber-700' : 'text-slate-600')}>
                          {cell.rate.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-slate-400">{cell.returns}/{cell.total}</div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Returned Products */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900">🛒 Top Returned Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-5 font-semibold">Product</th>
                <th className="text-right py-2 px-3 font-semibold">Return</th>
                <th className="text-right py-2 px-5 font-semibold">Lost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-5 font-medium text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-bold">{formatNumber(p.returned)}</td>
                  <td className="py-2.5 px-5 text-right tabular-nums">{formatTHB(p.lost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* High-Risk Customers (Frequent Returns) */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900">⚠️ High-Risk Customers (Frequent Returns)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-5 font-semibold">Customer</th>
                <th className="text-right py-2 px-3 font-semibold">Orders</th>
                <th className="text-right py-2 px-3 font-semibold">Return</th>
                <th className="text-right py-2 px-3 font-semibold">Lost</th>
                <th className="text-right py-2 px-5 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRisk.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-5 font-medium text-slate-900">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.name}
                      <span className={cn('chip text-[10px]', BADGE_COLOR[c.badge] ?? 'bg-slate-100 text-slate-700')}>
                        {c.badge}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{c.orders}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-bold">{c.returned}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatTHB(c.lost)}</td>
                  <td className="py-2.5 px-5 text-right font-bold text-rose-600">{c.rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const Kpi = ({
  tone, icon: Icon, label, value, sub,
}: {
  tone:  'amber' | 'rose'
  icon:  any
  label: string
  value: string
  sub?:  string
}) => {
  const toneCls = tone === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
  return (
    <div className="card p-4 border">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', toneCls)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</div>
          {sub && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</div>}
        </div>
      </div>
    </div>
  )
}
