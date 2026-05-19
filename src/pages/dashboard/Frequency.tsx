import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Repeat } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

/** Discrete colour ramp for the 10 frequency buckets (1, 2, ..., 10+). */
const FREQ_COLORS = ['#6366f1', '#7c3aed', '#a855f7', '#c026d3', '#db2777', '#ef4444', '#f97316', '#facc15', '#84cc16', '#10b981']

/**
 * Dashboard sub-page · ความถี่ & ซื้อซ้ำ
 *
 * Both the Customer-status donut and the Purchase-pattern donut now
 * live on the Segment Analysis page — they were redundant here.
 *
 * The Revenue/Customers stacked bar previously rendered with raw
 * values on the same axis, which hid the Customers row entirely
 * (revenue is in millions, customers in thousands). Each lane is now
 * normalised to its own total so both rows always show.
 */
export const Frequency = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const buckets = dataset.frequencyTable(ws.id)
  const firstVsReturning = dataset.firstVsReturning(ws.id)
  const retentionStats = dataset.retentionStats(ws.id)

  const total = customers.length
  const onceOnly = buckets.rows[0].count
  const onceOnlyShare = (onceOnly / total) * 100
  const repeatShare = 100 - onceOnlyShare
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0)
  const avgOrders = totalOrders / total
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0)
  const repeatRevenue = customers
    .filter((c) => c.orders >= 2)
    .reduce((s, c) => s + c.totalSpend, 0)
  const firstRevenue = totalRevenue - repeatRevenue
  const repeatCustomers = customers.filter((c) => c.orders >= 2).length

  /* Stacked-bar data: each lane sums to 100 (% of its own total)
   *  so both Revenue and Customers rows are visible together. The
   *  raw absolute is kept on payload._raw for tooltip display. */
  const totalRevenueAll = buckets.totals.value || 1
  const totalCustomersAll = buckets.totals.count || 1
  const stacked = [
    {
      lane: 'Revenue',
      _grand: totalRevenueAll,
      ...Object.fromEntries(
        buckets.rows.map((b) => [b.bucket, (b.value / totalRevenueAll) * 100]),
      ),
      _raw: Object.fromEntries(buckets.rows.map((b) => [b.bucket, b.value])),
    },
    {
      lane: 'Customers',
      _grand: totalCustomersAll,
      ...Object.fromEntries(
        buckets.rows.map((b) => [b.bucket, (b.count / totalCustomersAll) * 100]),
      ),
      _raw: Object.fromEntries(buckets.rows.map((b) => [b.bucket, b.count])),
    },
  ] as Array<Record<string, any>>

  const totalFirst6m = firstVsReturning.reduce((s, m) => s + m.first, 0)
  const totalReturning6m = firstVsReturning.reduce((s, m) => s + m.returning, 0)

  return (
    <div className="space-y-5">
      <PageInsight
        kind="info"
        title="ข้อสังเกตจาก Frequency"
        items={[
          <>
            ลูกค้าส่วนใหญ่ <strong>{onceOnlyShare.toFixed(0)}%</strong> ซื้อแค่ครั้งเดียว ทำให้อัตรากลับมาซื้อเพียง{' '}
            <strong>{retentionStats.repeatRate.toFixed(1)}%</strong> และความถี่เฉลี่ยต่ำ ({avgOrders.toFixed(2)}) —
            ควรเน้นกระตุ้นให้เกิดการซื้อครั้งที่สอง
          </>,
          <>
            ยอดขายจากลูกค้าซ้ำคิดเป็น <strong>{((repeatRevenue / totalRevenue) * 100).toFixed(1)}%</strong> ของรวม —
            {repeatRevenue / totalRevenue > 0.5 ? ' แข็งแกร่ง' : ' พึ่งลูกค้าใหม่มาก ต้องลงทุนใน retention'}
          </>,
        ]}
      />

      {/* Shortcut to Retention Analysis · cohort + repeat deep dive */}
      <div className="card bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">ทางลัด → Retention Analysis</div>
          <p className="text-xs text-slate-600">
            เจาะลึก cohort heatmap (% กลับมา / % หาย) + ยอดซื้อซ้ำต่อครั้งต่อ cohort + Product/Channel journey
            ที่หน้า Retention Analysis
          </p>
        </div>
        <button
          onClick={() => navigate('/retention-analysis')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 shrink-0"
        >
          <Repeat className="w-4 h-4" /> เปิด Retention Analysis <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="card bg-emerald-50 border border-emerald-200 px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">📊</span>
        <span className="text-slate-700">
          อัตราซื้อซ้ำ <strong className="text-emerald-700">{retentionStats.repeatRate.toFixed(2)}%</strong>
          {' · '}
          <button
            onClick={() => navigate('/customer-center/customers?filter=once_only')}
            className="text-blue-600 hover:underline font-semibold"
          >
            ลูกค้าซื้อครั้งเดียว {onceOnlyShare.toFixed(0)}% ({formatNumber(onceOnly)} ราย)
          </button>
          {' · '}
          เฉลี่ยซื้อ <strong>{avgOrders.toFixed(1)} ครั้ง/คน</strong>
        </span>
      </div>

      {/* Stacked Purchase Frequency */}
      <section className="card p-5">
        <div className="mb-2">
          <h3 className="font-bold text-slate-900">Purchase Frequency — Revenue vs Customers</h3>
          <p className="text-xs text-slate-500">Each row shows % share by frequency group — both lanes normalised to 100%</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stacked} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#64748b' }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis dataKey="lane" type="category" tick={{ fontSize: 12, fill: '#334155' }} width={80} />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              formatter={(v: number, name: string, props: any) => {
                const raw = props.payload._raw[name as string] as number | undefined
                const label = props.payload.lane === 'Revenue'
                  ? formatTHB(raw ?? 0, { compact: true })
                  : formatNumber(raw ?? 0)
                return [`${label} (${v.toFixed(1)}%)`, `${name} ครั้ง`]
              }}
            />
            {buckets.rows.map((b, i) => (
              <Bar key={b.bucket} dataKey={b.bucket} stackId="a" fill={FREQ_COLORS[i]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center text-[11px] text-slate-600 mt-2">
          {buckets.rows.map((b, i) => (
            <span key={b.bucket} className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: FREQ_COLORS[i] }} />
              {b.bucket}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="card tone-neutral p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Revenue</div>
            <div className="text-lg font-bold text-slate-900">{formatTHB(buckets.totals.value)}</div>
          </div>
          <div className="card tone-neutral p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Customers</div>
            <div className="text-lg font-bold text-slate-900">{formatNumber(buckets.totals.count)}</div>
          </div>
        </div>
      </section>

      {/* Frequency table */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">ตารางความถี่ซื้อ</h3>
          <p className="text-xs text-slate-500">Click a row to see the customer list</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-5 font-semibold">จำนวนครั้งที่ซื้อ</th>
                <th className="text-right py-2 px-3 font-semibold">เฉลี่ย/บิล</th>
                <th className="text-right py-2 px-3 font-semibold">จำนวนลูกค้า</th>
                <th className="text-left py-2 px-3 font-semibold">% ลูกค้า</th>
                <th className="text-right py-2 px-3 font-semibold">ออเดอร์</th>
                <th className="text-right py-2 px-5 font-semibold">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buckets.rows.map((r, i) => (
                <tr
                  key={r.bucket}
                  onClick={() => navigate(`/customer-center/customers?freq=${encodeURIComponent(r.bucket)}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-2.5 px-5 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: FREQ_COLORS[i] }} />
                    ซื้อ{r.bucket === '10+' ? '10+' : `${r.bucket}ครั้ง`}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">฿{r.avgBasket.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatNumber(r.count)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.share * 1.2)}%`, background: FREQ_COLORS[i] }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-12 text-right">{r.share.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatNumber(r.orders)}</td>
                  <td className="py-2.5 px-5 text-right tabular-nums font-semibold text-brand-700">{formatTHB(r.value, { compact: true })}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/50 font-bold">
                <td className="py-2.5 px-5">Grand Total</td>
                <td className="py-2.5 px-3 text-right tabular-nums">฿{(buckets.totals.value / Math.max(1, buckets.totals.orders)).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{formatNumber(buckets.totals.count)}</td>
                <td className="py-2.5 px-3 text-right">100%</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{formatNumber(buckets.totals.orders)}</td>
                <td className="py-2.5 px-5 text-right tabular-nums text-brand-700">{formatTHB(buckets.totals.value)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* First vs Repeat — customers + revenue side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ComparisonCard
          title="ลูกค้าซื้อครั้งแรก vs ซื้อซ้ำ"
          rows={[
            { label: 'ซื้อครั้งแรก', value: onceOnly,        color: '#6366f1' },
            { label: 'ซื้อซ้ำ',      value: repeatCustomers, color: '#10b981' },
          ]}
          footers={[
            `ซื้อครั้งแรก ${formatNumber(onceOnly)} (${onceOnlyShare.toFixed(2)}%)`,
            `ซื้อซ้ำ ${formatNumber(repeatCustomers)} (${repeatShare.toFixed(2)}%)`,
          ]}
          formatter={formatNumber}
        />
        <ComparisonCard
          title="ยอดขายครั้งแรก vs ซื้อซ้ำ"
          rows={[
            { label: 'ซื้อครั้งแรก', value: firstRevenue,  color: '#6366f1' },
            { label: 'ซื้อซ้ำ',      value: repeatRevenue, color: '#10b981' },
          ]}
          footers={[
            `ซื้อครั้งแรก ${formatTHB(firstRevenue, { compact: true })} (${((firstRevenue / totalRevenue) * 100).toFixed(2)}%)`,
            `ซื้อซ้ำ ${formatTHB(repeatRevenue, { compact: true })} (${((repeatRevenue / totalRevenue) * 100).toFixed(2)}%)`,
          ]}
          formatter={(v) => formatTHB(v, { compact: true })}
        />
      </div>

      {/* Monthly sales — first vs returning + retention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-900">Monthly Sales (First Purchase vs Returning in Later Months)</h3>
              <p className="text-xs text-blue-700">First Purchase = orders in the same month as customer&apos;s first buy · Returning = orders in any different month</p>
            </div>
            <div className="flex gap-1">
              <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-600 text-white">6M</button>
              <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">All</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={firstVsReturning} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, n: string) => [formatTHB(v, { compact: true }), n === 'first' ? 'First Purchase' : 'Returning Later']} />
              <Bar dataKey="returning" stackId="a" name="Returning" fill="#f59e0b" />
              <Bar dataKey="first"     stackId="a" name="First"     fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Returning</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> First Purchase</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
              <div className="text-[11px] text-sky-700 font-semibold">First Purchase That Month</div>
              <div className="text-base font-bold text-slate-900">{formatTHB(totalFirst6m)}</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
              <div className="text-[11px] text-amber-700 font-semibold">Returning Later</div>
              <div className="text-base font-bold text-slate-900">{formatTHB(totalReturning6m)}</div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h3 className="font-bold text-slate-900 mb-3">Retention</h3>
          <div className="space-y-4">
            <RetentionBar label="Retention 3 เดือน" value={retentionStats.m3} color="#10b981" />
            <RetentionBar label="Retention 6 เดือน" value={retentionStats.m6} color="#06b6d4" />
            <RetentionBar
              label={
                <span className="inline-flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5" /> อัตราซื้อซ้ำ
                </span>
              }
              value={retentionStats.repeatRate}
              color="#a855f7"
            />
          </div>
          <button
            onClick={() => navigate('/retention-analysis')}
            className="text-xs font-semibold text-violet-700 hover:underline mt-4 inline-flex items-center gap-1"
          >
            ดูซื้อซ้ำรายรุ่นแบบละเอียด <ArrowRight className="w-3 h-3" />
          </button>
        </section>
      </div>
    </div>
  )
}

const ComparisonCard = ({
  title,
  rows,
  footers,
  formatter,
}: {
  title:     string
  rows:      { label: string; value: number; color: string }[]
  footers:   string[]
  formatter: (v: number) => string
}) => {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <section className="card p-5">
      <h3 className="font-bold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-3 mb-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-700 w-20 shrink-0">{r.label}</div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
              />
            </div>
            <div className="text-xs font-bold tabular-nums w-24 text-right">{formatter(r.value)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {footers.map((f, i) => (
          <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-700">{f}</div>
        ))}
      </div>
    </section>
  )
}

const RetentionBar = ({
  label,
  value,
  color,
}: {
  label: React.ReactNode
  value: number
  color: string
}) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <div className="text-xs font-semibold text-slate-700">{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color }}>
        {value.toFixed(2)}%
      </div>
    </div>
    <div className={cn('w-full h-2 rounded-full overflow-hidden bg-slate-100')}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value * 4)}%`, background: color }} />
    </div>
    <div className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: color }}>
      {value.toFixed(2)}%
    </div>
  </div>
)
