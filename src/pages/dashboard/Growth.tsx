import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, MapPin, Package, ShoppingBag, TrendingDown, Users } from 'lucide-react'
import { useState } from 'react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatPct, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

type Period = 'wow' | 'mom' | 'yoy'

const PERIOD_LABEL: Record<Period, { short: string; long: string }> = {
  wow: { short: 'WoW', long: 'สัปดาห์นี้ vs ก่อน' },
  mom: { short: 'MoM', long: 'เดือนนี้ vs ก่อน' },
  yoy: { short: 'YoY', long: 'ปีนี้ vs ก่อน' },
}

/**
 * Dashboard sub-page · Growth
 *
 * Multi-dimensional growth — overall + by channel / province / product
 * / salesperson. Switch lens with the WoW / MoM / YoY pill at the top.
 * Daily-trend + Channel Mix + Rhythm moved out to Sale Performance.
 */
export const Growth = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const ytd = dataset.ytdGrowth(ws.id)
  const channelReturnSplit = dataset.channelReturnSplit(ws.id)

  const [period, setPeriod] = useState<Period>('mom')

  const overallValue =
    period === 'wow' ? ytd.overall.wow : period === 'mom' ? ytd.overall.mom : ytd.overall.yoy
  const revenueByPeriod =
    period === 'wow'
      ? ytd.overall.weekRevenue
      : period === 'mom'
        ? ytd.overall.monthRevenue
        : ytd.overall.yearRevenue

  /* Total cancellations / returns rollup from channelReturnSplit */
  const totalCancelled = channelReturnSplit.reduce((s, c) => s + c.cancelled, 0)
  const totalReturned  = channelReturnSplit.reduce((s, c) => s + c.returned, 0)
  const totalCompleted = channelReturnSplit.reduce((s, c) => s + c.completed, 0)
  const totalLossRate =
    totalCompleted + totalCancelled + totalReturned > 0
      ? ((totalCancelled + totalReturned) /
          (totalCompleted + totalCancelled + totalReturned)) *
        100
      : 0

  return (
    <div className="space-y-6">
      <PageInsight
        kind="info"
        title="ข้อสังเกตจาก Growth"
        items={[
          <>
            ภาพรวม{' '}
            <strong className={ytd.overall.yoy >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              YoY {ytd.overall.yoy >= 0 ? '+' : ''}{ytd.overall.yoy.toFixed(1)}%
            </strong>{' '}
            ·{' '}
            <strong className={ytd.overall.mom >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              MoM {ytd.overall.mom >= 0 ? '+' : ''}{ytd.overall.mom.toFixed(1)}%
            </strong>{' '}
            — โตเร็วที่สุดจากช่องทาง <strong>{[...ytd.byChannel].sort((a, b) => b.mom - a.mom)[0].name}</strong>
          </>,
          <>
            Return/Cancel rate ขณะนี้ <strong>{totalLossRate.toFixed(2)}%</strong> —{' '}
            {totalLossRate > 4 ? 'ควรตรวจคุณภาพช่องทางและ packaging ด่วน' : 'อยู่ในเกณฑ์ดี'}
          </>,
        ]}
      />

      {/* Overall growth — three pill periods */}
      <section className="story-section">
        <div className="story-header">
          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          <h2 className="story-title">Growth — ภาพรวม</h2>
          <span className="story-sub">
            เลือกช่วงเปรียบเทียบ: WoW · MoM · YoY · ดูยอดรวม + แตกตามแต่ละมิติด้านล่าง
          </span>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['wow', 'mom', 'yoy'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                  period === p
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {PERIOD_LABEL[p].short}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-2">{PERIOD_LABEL[period].long}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <OverallStat
              label="WoW"
              value={ytd.overall.wow}
              revenue={ytd.overall.weekRevenue}
              caption="สัปดาห์นี้"
              active={period === 'wow'}
            />
            <OverallStat
              label="MoM"
              value={ytd.overall.mom}
              revenue={ytd.overall.monthRevenue}
              caption="เดือนนี้"
              active={period === 'mom'}
            />
            <OverallStat
              label="YoY"
              value={ytd.overall.yoy}
              revenue={ytd.overall.yearRevenue}
              caption="ปีนี้ (YTD)"
              active={period === 'yoy'}
            />
            <div className="card tone-risk p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> Return / Cancel
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {totalLossRate.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {formatNumber(totalCancelled)} ยกเลิก · {formatNumber(totalReturned)} คืน
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-sm text-slate-700">
            ในช่วง <strong>{PERIOD_LABEL[period].long}</strong> ยอดขายอยู่ที่{' '}
            <strong className="text-brand-700">
              {formatTHB(revenueByPeriod, { compact: true })}
            </strong>{' '}
            ·{' '}
            <strong className={overallValue >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {overallValue >= 0 ? '▲' : '▼'} {formatPct(Math.abs(overallValue), 1)}
            </strong>{' '}
            จากช่วงก่อน
          </div>
        </div>
      </section>

      {/* By channel */}
      <DimSection
        icon={ShoppingBag}
        iconColor="text-violet-600"
        title="แตกตามช่องทาง — by Channel"
        sub="ช่องทางไหนเติบโตเร็วที่สุด"
        rows={ytd.byChannel.map((r) => ({
          name: r.name,
          revenue: r.revenue,
          value: period === 'wow' ? r.wow : period === 'mom' ? r.mom : r.yoy,
          color: r.color,
        }))}
        period={period}
      />

      {/* By region */}
      <DimSection
        icon={MapPin}
        iconColor="text-emerald-600"
        title="แตกตามพื้นที่ — by Region"
        sub="6 จังหวัด top revenue"
        rows={ytd.byProvince.map((r) => ({
          name: r.name,
          revenue: r.revenue,
          value: period === 'wow' ? r.wow : period === 'mom' ? r.mom : r.yoy,
        }))}
        period={period}
      />

      {/* By product */}
      <DimSection
        icon={Package}
        iconColor="text-amber-600"
        title="แตกตามสินค้า — by Product"
        sub="6 SKU ขายดีสุด"
        rows={ytd.byProduct.map((r) => ({
          name: r.name,
          revenue: r.revenue,
          value: period === 'wow' ? r.wow : period === 'mom' ? r.mom : r.yoy,
        }))}
        period={period}
      />

      {/* By salesperson */}
      <DimSection
        icon={Users}
        iconColor="text-sky-600"
        title="แตกตาม Sale — by Salesperson"
        sub="พนักงานขายที่เติบโตเร็วที่สุด"
        rows={ytd.bySale.map((r) => ({
          name: r.name,
          revenue: r.revenue,
          value: period === 'wow' ? r.wow : period === 'mom' ? r.mom : r.yoy,
        }))}
        period={period}
      />
    </div>
  )
}

const OverallStat = ({
  label,
  value,
  revenue,
  caption,
  active,
}: {
  label:   string
  value:   number
  revenue: number
  caption: string
  active:  boolean
}) => (
  <div
    className={cn(
      'card p-4 transition-all',
      active ? 'tone-revenue ring-2 ring-brand-400' : 'tone-neutral',
    )}
  >
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </div>
    <div
      className={cn(
        'text-2xl font-bold mt-1',
        value >= 0 ? 'text-emerald-700' : 'text-rose-600',
      )}
    >
      {value >= 0 ? '▲' : '▼'} {formatPct(Math.abs(value), 1)}
    </div>
    <div className="text-[11px] text-slate-500 mt-0.5">
      {caption} · {formatTHB(revenue, { compact: true })}
    </div>
  </div>
)

const DimSection = ({
  icon: Icon,
  iconColor,
  title,
  sub,
  rows,
  period,
}: {
  icon:      any
  iconColor: string
  title:     string
  sub:       string
  rows:      { name: string; revenue: number; value: number; color?: string }[]
  period:    Period
}) => {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  return (
    <section className="story-section">
      <div className="story-header">
        <Icon className={cn('w-5 h-5', iconColor)} />
        <h2 className="story-title">{title}</h2>
        <span className="story-sub">{sub}</span>
      </div>

      <div className="card p-5">
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 36)}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
              domain={[
                (min: number) => Math.floor(Math.min(min, 0) - 5),
                (max: number) => Math.ceil(Math.max(max, 0) + 10),
              ]}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: '#334155' }}
              width={140}
              tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + '…' : v)}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              formatter={(v: number, name: string, props: any) => [
                `${v >= 0 ? '+' : ''}${v.toFixed(1)}% (${formatTHB(props.payload.revenue, { compact: true })})`,
                `${PERIOD_LABEL[period].short} · ${name}`,
              ]}
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
            >
              {sorted.map((r, i) => (
                <Cell
                  key={i}
                  fill={r.color ?? (r.value >= 0 ? '#10b981' : '#ef4444')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
