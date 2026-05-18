import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, CalendarDays, Clock, Users } from 'lucide-react'
import { useState } from 'react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatPct, formatTHB } from '@/lib/utils'

type DailyMetric = 'revenue' | 'customers'

export const Growth = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const monthly = dataset.monthly(ws.id)
  const weekly = dataset.weekly(ws.id)
  const channels = dataset.channels(ws.id)
  const hourly = dataset.hourly(ws.id)
  const daily = dataset.daily(ws.id)

  const [dailyMetric, setDailyMetric] = useState<DailyMetric>('revenue')
  const dailyTotal = daily.reduce((acc, d) => acc + d[dailyMetric], 0)
  const dailyAvg = dailyTotal / daily.length
  const dailyLast = daily[daily.length - 1][dailyMetric]
  const dailyPrev = daily[daily.length - 2][dailyMetric]
  const dailyDelta = dailyPrev > 0 ? ((dailyLast - dailyPrev) / dailyPrev) * 100 : 0

  const channelMonthly = monthly.map((m) => {
    const row: Record<string, any> = { month: m.month }
    channels.slice(0, 5).forEach((c) => {
      row[c.channel] = Math.round((m.revenue * c.share) / 100 * (0.85 + Math.random() * 0.3))
    })
    return row
  })

  const growthPct = ((monthly[monthly.length - 1].revenue - monthly[0].revenue) / monthly[0].revenue) * 100
  const latest = monthly[monthly.length - 1]
  const newPct = (latest.newCustomers / (latest.newCustomers + latest.repeatCustomers)) * 100

  return (
    <div className="space-y-6">
      {/* Chapter 1 — How fast are we growing? */}
      <section className="story-section">
        <div className="story-header">
          <ArrowUpRight className="w-5 h-5 text-brand-600" />
          <h2 className="story-title">เติบโตเท่าไร — Growth Velocity</h2>
          <span className="story-sub">เปรียบเทียบรายเดือนและรายสัปดาห์</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StoryStat
            tone="revenue"
            label="MoM Growth"
            value={formatPct(growthPct, 1)}
            sub="vs 6 เดือนย้อนหลัง"
            positive={growthPct >= 0}
          />
          <StoryStat
            tone="customer"
            label="New vs Repeat"
            value={`${formatPct(newPct, 0)} new`}
            sub={`${formatNumber(latest.newCustomers)} ใหม่ · ${formatNumber(latest.repeatCustomers)} ซื้อซ้ำ`}
          />
          <StoryStat
            tone="retention"
            label="Return Rate"
            value="2.0%"
            sub="โดยเฉลี่ยทุกช่องทาง"
          />
          <StoryStat
            tone="neutral"
            label="Active SKU"
            value="20"
            sub="สินค้าที่ยังขายอยู่"
          />
        </div>
      </section>

      {/* Chapter 1b — Daily trend (30D), switchable metric */}
      <section className="story-section">
        <div className="story-header">
          <CalendarDays className="w-5 h-5 text-sky-600" />
          <h2 className="story-title">เทรนด์รายวัน 30 วัน — Daily Trend</h2>
          <span className="story-sub">สลับมุมมองระหว่างยอดขาย / ลูกค้า</span>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <DailyStat
                label="วันล่าสุด"
                value={
                  dailyMetric === 'revenue'
                    ? formatTHB(dailyLast, { compact: true })
                    : formatNumber(dailyLast)
                }
                sub={`${dailyDelta >= 0 ? '+' : ''}${formatPct(dailyDelta, 1)} vs วันก่อน`}
                positive={dailyDelta >= 0}
              />
              <DailyStat
                label="เฉลี่ย/วัน"
                value={
                  dailyMetric === 'revenue'
                    ? formatTHB(dailyAvg, { compact: true })
                    : formatNumber(dailyAvg)
                }
                sub="30 วันล่าสุด"
              />
              <DailyStat
                label="รวม 30 วัน"
                value={
                  dailyMetric === 'revenue'
                    ? formatTHB(dailyTotal, { compact: true })
                    : formatNumber(dailyTotal)
                }
                sub={dailyMetric === 'revenue' ? 'baht' : 'ลูกค้า'}
              />
            </div>
            <MetricToggle value={dailyMetric} onChange={setDailyMetric} />
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={dailyMetric === 'revenue' ? '#ff7a00' : '#0ea5e9'}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={dailyMetric === 'revenue' ? '#ff7a00' : '#0ea5e9'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) =>
                  dailyMetric === 'revenue'
                    ? `${(v / 1000).toFixed(0)}K`
                    : formatNumber(v)
                }
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) =>
                  dailyMetric === 'revenue'
                    ? formatTHB(v, { compact: true })
                    : `${formatNumber(v)} คน`
                }
                labelFormatter={(l) => `วันที่ ${l}`}
              />
              <Area
                type="monotone"
                dataKey={dailyMetric}
                stroke={dailyMetric === 'revenue' ? '#ff7a00' : '#0ea5e9'}
                strokeWidth={2.5}
                fill="url(#dailyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chapter 2 — Where is growth coming from (by channel)? */}
      <section className="story-section">
        <div className="story-header">
          <Users className="w-5 h-5 text-emerald-600" />
          <h2 className="story-title">เติบโตมาจากช่องทางไหน — Channel Mix</h2>
          <span className="story-sub">ยอดขายเฉลี่ยรายเดือนตามแต่ละช่องทาง</span>
        </div>

        <div className="card tone-revenue p-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={channelMonthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatTHB(v, { compact: true })}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {channels.slice(0, 5).map((c) => (
                <Line
                  key={c.channel}
                  type="monotone"
                  dataKey={c.channel}
                  stroke={c.color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chapter 3 — Rhythm: weekly + hourly */}
      <section className="story-section">
        <div className="story-header">
          <Clock className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">จังหวะการขาย — Rhythm</h2>
          <span className="story-sub">12 สัปดาห์ล่าสุด + ช่วงเวลาในวันที่ลูกค้าซื้อ</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card tone-revenue p-5">
            <div className="font-semibold mb-3 text-slate-900">รายสัปดาห์ (12W)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatTHB(v, { compact: true })}
                />
                <Bar dataKey="revenue" fill="#ff7a00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card tone-product p-5">
            <div className="font-semibold mb-3 text-slate-900">ยอดขายตามเวลา (24h)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={2} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => `${v}%`}
                />
                <Bar dataKey="share" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Story note */}
      <div className="card tone-customer p-5">
        <div className="font-semibold text-emerald-800 mb-2">📝 ข้อสังเกตจาก Growth</div>
        <ul className="text-sm text-slate-700 space-y-1.5">
          <li>
            ยอดเติบโต <strong>{formatPct(growthPct)} </strong>ในช่วง 6 เดือน —{' '}
            {growthPct > 5
              ? 'ดี ควรรักษาโมเมนตัม'
              : growthPct > 0
                ? 'พอใช้ ควรเร่งเครื่อง'
                : 'ตก ต้องวิเคราะห์สาเหตุ'}
          </li>
          <li>
            สัดส่วนลูกค้าใหม่ <strong>{formatPct(newPct, 0)}</strong> — ถ้าสูงกว่า 70%
            แปลว่าพึ่งพา ads มาก ควรลงทุน retention เพิ่ม
          </li>
          <li>
            ช่วงเวลาที่ขายดี: <strong>10:00–14:00 และ 19:00–22:00</strong> —
            จัดแคมเปญ flash sale ในช่วงนี้ + ปรับเวลาตอบแชทของแอดมิน
          </li>
        </ul>
      </div>
    </div>
  )
}

const MetricToggle = ({
  value,
  onChange,
}: {
  value: DailyMetric
  onChange: (m: DailyMetric) => void
}) => (
  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
    <button
      onClick={() => onChange('revenue')}
      className={cn(
        'px-3 py-1.5 rounded-lg transition-colors',
        value === 'revenue'
          ? 'bg-white text-brand-700 shadow-sm'
          : 'text-slate-500 hover:text-slate-900',
      )}
    >
      ยอดขาย
    </button>
    <button
      onClick={() => onChange('customers')}
      className={cn(
        'px-3 py-1.5 rounded-lg transition-colors',
        value === 'customers'
          ? 'bg-white text-sky-700 shadow-sm'
          : 'text-slate-500 hover:text-slate-900',
      )}
    >
      ลูกค้า
    </button>
  </div>
)

const DailyStat = ({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub: string
  positive?: boolean
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </div>
    <div
      className={cn(
        'text-xl font-bold mt-0.5',
        positive == null
          ? 'text-slate-900'
          : positive
            ? 'text-emerald-700'
            : 'text-rose-600',
      )}
    >
      {value}
    </div>
    <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)

const StoryStat = ({
  label,
  value,
  sub,
  tone,
  positive,
}: {
  label: string
  value: string
  sub: string
  tone: 'revenue' | 'customer' | 'product' | 'retention' | 'neutral'
  positive?: boolean
}) => (
  <div className={`card p-4 tone-${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </div>
    <div
      className={`text-2xl font-bold mt-1 ${
        positive == null
          ? 'text-slate-900'
          : positive
            ? 'text-emerald-700'
            : 'text-rose-600'
      }`}
    >
      {value}
    </div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)
