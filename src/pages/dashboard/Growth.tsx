import {
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
import { ArrowUpRight, Clock, RefreshCcw, Users } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { formatNumber, formatPct, formatTHB } from '@/lib/utils'

export const Growth = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const monthly = dataset.monthly(ws.id)
  const weekly = dataset.weekly(ws.id)
  const channels = dataset.channels(ws.id)
  const hourly = dataset.hourly(ws.id)

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
