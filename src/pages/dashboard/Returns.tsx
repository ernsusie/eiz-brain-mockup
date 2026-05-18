import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Heart, RefreshCcw, TrendingUp } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const REASON_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#a855f7']

/**
 * Dashboard sub-page · Returns + Retention
 *
 * Replaces the old Retention sub-tab. Combines:
 *  - Return-rate / cancel-rate trend (30 days)
 *  - Top return reasons (pie + ranked bars)
 *  - High-return products
 *  - Cohort retention heatmap (moved from /dashboard/retention)
 *  - Reduction tips
 */
export const Returns = () => {
  const ws = workspaces.current()
  if (!ws) return null

  const products      = dataset.products(ws.id)
  const returnReasons = dataset.returnReasons(ws.id)
  const returnTrend   = dataset.returnTrend(ws.id)
  const cohorts       = dataset.cohorts(ws.id)

  const avgReturn = returnTrend.reduce((s, d) => s + d.returnRate, 0) / returnTrend.length
  const avgCancel = returnTrend.reduce((s, d) => s + d.cancelRate, 0) / returnTrend.length
  const peakDay   = [...returnTrend].sort((a, b) => b.returnRate - a.returnRate)[0]

  const highReturn = products.filter((p) => p.returnRate > 4)
  const totalReturns = products.reduce((s, p) => s + p.returns, 0)
  const totalLoss = products.reduce((s, p) => s + p.returns * p.asp, 0)

  /* Avg M1 retention from cohort data (excludes nulls). */
  const m1Rates = cohorts
    .map((c) => c.retention[1])
    .filter((v): v is number => typeof v === 'number')
  const avgM1 = m1Rates.length ? m1Rates.reduce((s, v) => s + v, 0) / m1Rates.length : 0

  return (
    <div className="space-y-6">
      {/* Chapter 1 — Returns overview */}
      <section className="story-section">
        <div className="story-header">
          <RefreshCcw className="w-5 h-5 text-rose-600" />
          <h2 className="story-title">การคืนสินค้า — Returns Analysis</h2>
          <span className="story-sub">เทรนด์ 30 วัน · เหตุผล · สินค้าคืนสูง · มูลค่าที่เสียไป</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RetStat tone="risk"     label="Return Rate (avg)" value={`${avgReturn.toFixed(2)}%`} sub={`${formatNumber(totalReturns)} ครั้ง ใน 30 วัน`} />
          <RetStat tone="risk"     label="Cancel Rate (avg)" value={`${avgCancel.toFixed(2)}%`} sub="ยกเลิกออเดอร์ก่อนส่ง" />
          <RetStat tone="risk"     label="Lost Revenue"      value={formatTHB(totalLoss, { compact: true })} sub="จากการคืนสินค้า" />
          <RetStat tone="retention" label="Peak Return Day"  value={`${peakDay.returnRate.toFixed(2)}%`}   sub={`วันที่ ${peakDay.label}`} />
        </div>
      </section>

      {/* Chapter 2 — Return rate trend */}
      <section className="story-section">
        <div className="story-header">
          <TrendingUp className="w-5 h-5 text-rose-600" />
          <h3 className="story-title">เทรนด์ Return Rate 30 วัน</h3>
          <span className="story-sub">เปรียบ return rate กับ cancel rate รายวัน</span>
        </div>

        <div className="card tone-retention p-5">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={returnTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cancelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval={2} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, name: string) =>
                  [`${v.toFixed(2)}%`, name === 'returnRate' ? 'Return rate' : 'Cancel rate']
                }
                labelFormatter={(l) => `วันที่ ${l}`}
              />
              <Area type="monotone" dataKey="returnRate" stroke="#ef4444" strokeWidth={2.5} fill="url(#returnGrad)" />
              <Area type="monotone" dataKey="cancelRate" stroke="#f59e0b" strokeWidth={2}   fill="url(#cancelGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chapter 3 — Reasons + High-return products */}
      <section className="story-section">
        <div className="story-header">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="story-title">สาเหตุการคืน + สินค้าคืนสูง</h3>
          <span className="story-sub">รู้สาเหตุก่อน — จะแก้ที่ต้นทางได้</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card tone-risk p-5">
            <div className="font-semibold text-slate-900 mb-3">เหตุผลการคืน (Top {returnReasons.length})</div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={returnReasons}
                    dataKey="share"
                    nameKey="reason"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {returnReasons.map((_, i) => (
                      <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, 'สัดส่วน']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {returnReasons.map((r, i) => (
                  <div key={r.reason} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: REASON_COLORS[i % REASON_COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-slate-700">{r.reason}</span>
                    <span className="font-bold text-slate-900">{r.share.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card tone-retention p-5">
            <div className="font-semibold text-slate-900 mb-3">สินค้าคืนสูง (&gt; 4%)</div>
            {highReturn.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">
                ไม่มีสินค้าคืนเกิน 4% — สถานะดี 👍
              </div>
            ) : (
              <div className="space-y-2">
                {highReturn.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-rose-100"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        Return rate <strong className="text-rose-600">{p.returnRate}%</strong> · เสียโอกาส ~
                        {formatTHB(p.returns * p.asp, { compact: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chapter 4 — Cohort heatmap (moved from Retention) */}
      <section className="story-section">
        <div className="story-header">
          <Heart className="w-5 h-5 text-pink-600" />
          <h3 className="story-title">Cohort Retention Heatmap</h3>
          <span className="story-sub">
            % ของลูกค้าจาก cohort เริ่มต้นที่กลับมาซื้อในเดือนถัด ๆ ไป · Avg M1{' '}
            <strong className={cn(avgM1 >= 8 ? 'text-emerald-700' : 'text-amber-700')}>
              {avgM1.toFixed(1)}%
            </strong>
          </span>
        </div>

        <div className="card tone-retention p-5 overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left p-1.5 text-slate-600 font-semibold">Cohort</th>
                <th className="text-right p-1.5 text-slate-600 font-semibold">ลูกค้า</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="text-center p-1.5 text-slate-600 font-semibold">
                    เดือน {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.slice(-10).map((row) => (
                <tr key={row.cohort}>
                  <td className="p-1.5 font-semibold">{row.cohort}</td>
                  <td className="text-right p-1.5 text-slate-600">{formatNumber(row.customers)}</td>
                  {Array.from({ length: 10 }, (_, i) => {
                    const v = row.retention[i + 1]
                    return (
                      <td
                        key={i}
                        className={cn(
                          'text-center p-1.5 rounded-md font-medium',
                          v == null
                            ? 'text-slate-300'
                            : v >= 8
                              ? 'bg-emerald-500/70 text-white'
                              : v >= 6
                                ? 'bg-emerald-400/60 text-emerald-900'
                                : v >= 4
                                  ? 'bg-emerald-300/50 text-emerald-900'
                                  : v >= 2
                                    ? 'bg-amber-200/60 text-amber-900'
                                    : 'bg-slate-100 text-slate-700',
                        )}
                      >
                        {v != null ? `${v}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
            <span>Legend:</span>
            <Legend swatch="bg-slate-100"            label="< 2%" />
            <Legend swatch="bg-amber-200/60"         label="2-4%" />
            <Legend swatch="bg-emerald-300/50"       label="4-6%" />
            <Legend swatch="bg-emerald-400/60"       label="6-8%" />
            <Legend swatch="bg-emerald-500/70"       label="> 8%" />
          </div>
        </div>
      </section>

      {/* Chapter 5 — Reduction tips */}
      <section className="story-section">
        <div className="story-header">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="story-title">วิธีลด return rate</h3>
          <span className="story-sub">แก้ที่ต้นทาง — แต่ละ root cause มีกลยุทธ์ของตัวเอง</span>
        </div>

        <div className="card tone-retention p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { num: 1, t: 'ของไม่ตรงปก',  a: 'ปรับรูป + รีวิวจริงในหน้าเพจ + วิดีโอ unbox' },
              { num: 2, t: 'จัดส่งช้า',    a: 'ต่อรองกับขนส่ง + บอก ETA ชัดเจน + reminder อัตโนมัติ' },
              { num: 3, t: 'หีบห่อชำรุด', a: 'ปรับ packaging + ตรวจคุณภาพก่อนส่ง' },
              { num: 4, t: 'ใกล้หมดอายุ', a: 'FIFO inventory + clear stock ก่อน 3 เดือน' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/60 border border-pink-100">
                <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {s.num}
                </span>
                <div className="text-sm">
                  <span className="font-semibold text-slate-900">{s.t}:</span>{' '}
                  <span className="text-slate-700">{s.a}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const RetStat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub:   string
  tone:  'risk' | 'retention' | 'revenue' | 'customer'
}) => (
  <div className={`card p-4 tone-${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)

const Legend = ({ swatch, label }: { swatch: string; label: string }) => (
  <div className="flex items-center gap-1">
    <span className={cn('w-3 h-3 rounded', swatch)} /> {label}
  </div>
)
