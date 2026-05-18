import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Calendar, Repeat, Sparkles } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatPct, formatTHB } from '@/lib/utils'

const FREQ_COLORS = ['#cbd5e1', '#fbbf24', '#34d399', '#10b981', '#059669']
const GAP_COLORS  = ['#10b981', '#34d399', '#fbbf24', '#f97316', '#ef4444']

/**
 * Dashboard sub-page · ความถี่ และการซื้อซ้ำ
 *
 * Three lenses on repeat-purchase behaviour:
 *  1. Frequency distribution — how many orders does each customer place
 *  2. Days-between-purchases — how quickly do they return
 *  3. Monthly repeat-rate trend — direction of travel
 */
export const Frequency = () => {
  const ws = workspaces.current()
  if (!ws) return null

  const { buckets, gaps, repeatTrend } = dataset.frequency(ws.id)
  const customers = dataset.customersWithOverlay(ws.id)

  const totalCustomers = customers.length
  const repeatCustomers = customers.filter((c) => c.orders >= 2).length
  const repeatRate = (repeatCustomers / totalCustomers) * 100
  const vipCount = customers.filter((c) => c.orders >= 6).length
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0)
  const avgOrders = totalOrders / totalCustomers
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0)
  const repeatRevenue = customers
    .filter((c) => c.orders >= 2)
    .reduce((s, c) => s + c.totalSpend, 0)
  const repeatRevenueShare = (repeatRevenue / totalRevenue) * 100

  /* Latest vs first month repeat-rate trend to give a direction. */
  const trendDelta =
    repeatTrend[repeatTrend.length - 1].repeatPct - repeatTrend[0].repeatPct

  return (
    <div className="space-y-6">
      <section className="story-section">
        <div className="story-header">
          <Repeat className="w-5 h-5 text-pink-600" />
          <h2 className="story-title">ความถี่ และการซื้อซ้ำ — Frequency & Repeat</h2>
          <span className="story-sub">วัดว่าลูกค้ากลับมาซื้อกี่ครั้ง และเร็วแค่ไหน</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FreqStat tone="customer" label="Repeat Rate"          value={`${repeatRate.toFixed(1)}%`}          sub={`${formatNumber(repeatCustomers)} ราย ซื้อ ≥ 2 ครั้ง`} />
          <FreqStat tone="revenue"  label="Avg Orders / Customer" value={avgOrders.toFixed(2)}                 sub={`รวม ${formatNumber(totalOrders, { compact: true })} ออเดอร์`} />
          <FreqStat tone="product"  label="VIP (≥ 6 ครั้ง)"      value={formatNumber(vipCount)}                sub={`${formatPct((vipCount / totalCustomers) * 100, 1)} ของฐาน`} />
          <FreqStat tone="retention" label="Repeat Revenue Share" value={`${repeatRevenueShare.toFixed(1)}%`}  sub={`${formatTHB(repeatRevenue, { compact: true })} จากลูกค้าซ้ำ`} />
        </div>
      </section>

      <section className="story-section">
        <div className="story-header">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h3 className="story-title">การกระจายความถี่</h3>
          <span className="story-sub">จำนวนลูกค้าตามจำนวนครั้งที่ซื้อ</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card tone-customer p-5 lg:col-span-2">
            <div className="font-semibold mb-3 text-slate-900">Customers by Order Count</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={buckets} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => formatNumber(v, { compact: true })}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number, name: string) => {
                    if (name === 'count') return [`${formatNumber(v)} ราย`, 'ลูกค้า']
                    return [formatTHB(v, { compact: true }), 'ยอดซื้อ']
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {buckets.map((_, i) => (
                    <Cell key={i} fill={FREQ_COLORS[i] ?? '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card tone-revenue p-5">
            <div className="font-semibold mb-3 text-slate-900">มูลค่าตามกลุ่ม</div>
            <div className="space-y-3">
              {buckets.map((b, i) => {
                const max = Math.max(...buckets.map((x) => x.value), 1)
                return (
                  <div key={b.key}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{b.label}</span>
                      <span className="tabular-nums text-slate-700">
                        {formatTHB(b.value, { compact: true })}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(b.value / max) * 100}%`,
                          background: FREQ_COLORS[i] ?? '#10b981',
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {formatNumber(b.count)} ราย ·{' '}
                      {formatTHB(b.value / Math.max(1, b.count), { compact: true })} เฉลี่ย / คน
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-header">
          <Calendar className="w-5 h-5 text-violet-600" />
          <h3 className="story-title">ช่วงเวลาระหว่างการซื้อ</h3>
          <span className="story-sub">เฉพาะลูกค้าที่ซื้อ ≥ 2 ครั้ง · ยิ่งสั้นยิ่งดี</span>
        </div>

        <div className="card tone-product p-5">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gaps} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => formatNumber(v, { compact: true })}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${formatNumber(v)} ราย`, 'ลูกค้า']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {gaps.map((_, i) => (
                  <Cell key={i} fill={GAP_COLORS[i] ?? '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="story-section">
        <div className="story-header">
          <Repeat className="w-5 h-5 text-brand-600" />
          <h3 className="story-title">Repeat Rate รายเดือน (6 เดือน)</h3>
          <span className="story-sub">
            แนวโน้ม:{' '}
            <strong className={trendDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)}%
            </strong>{' '}
            จาก 6 เดือนก่อน
          </span>
        </div>

        <div className="card tone-revenue p-5">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={repeatTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, name: string) =>
                  [`${v.toFixed(1)}%`, name === 'repeatPct' ? 'Repeat %' : 'New %']
                }
              />
              <Line
                type="monotone"
                dataKey="repeatPct"
                stroke="#ff7a00"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="newPct"
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="card tone-customer p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-800 mb-1">📌 ข้อสังเกต</div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>
                Repeat rate <strong>{repeatRate.toFixed(1)}%</strong> —{' '}
                {repeatRate >= 25 ? 'อยู่ในเกณฑ์ดี' : repeatRate >= 15 ? 'พอใช้ ต้องเพิ่ม retention' : 'ต่ำกว่าเป้า ควรลงทุนใน lifecycle marketing'}
              </li>
              <li>
                Repeat revenue คิดเป็น <strong>{repeatRevenueShare.toFixed(1)}%</strong> ของยอดรวม —
                {repeatRevenueShare >= 60 ? ' แข็งแกร่ง พึ่ง repeat แล้ว' : ' ยังพึ่ง new customers มากเกินไป'}
              </li>
              <li className={cn(
                trendDelta >= 0 ? 'text-emerald-700' : 'text-rose-700',
                'font-medium',
              )}>
                Repeat rate {trendDelta >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'}{' '}
                <strong>{Math.abs(trendDelta).toFixed(1)}%</strong> ใน 6 เดือน
                {trendDelta < 0 && ' — ควรเริ่ม win-back campaign'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const FreqStat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub:   string
  tone:  'customer' | 'revenue' | 'product' | 'retention'
}) => (
  <div className={`card p-4 tone-${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)
