import {
  TrendingUp,
  Users,
  ShoppingCart,
  AlertCircle,
  Repeat,
  Crown,
  Ghost,
  Wallet,
  Clock,
  AlertTriangle,
  MousePointerClick,
  ArrowRight,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB, statusColor, statusLabel } from '@/lib/utils'
import {
  applyCustomerFilter,
  isFilterActive,
  toggleArray,
  useDashboardFilter,
} from '@/lib/dashboard-filter'

interface Props {
  compact?: boolean
}

export const SalePerformance = ({ compact }: Props = {}) => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  // useDashboardFilter only works inside Dashboard's <Outlet>. In compare-view's compact mode
  // we don't have access — provide a no-op fallback.
  let outletCtx: ReturnType<typeof useDashboardFilter> | null = null
  try {
    outletCtx = useDashboardFilter()
  } catch {
    outletCtx = null
  }
  const filter = outletCtx?.filter
  const setFilter = outletCtx?.setFilter
  const filterActive = filter ? isFilterActive(filter) : false

  if (!ws) return null
  const monthly = dataset.monthly(ws.id)
  const allChannels = dataset.channels(ws.id)
  const allCustomers = dataset.customersWithOverlay(ws.id)
  const daily6m = dataset.daily6m(ws.id)
  const channelReturnSplit = dataset.channelReturnSplit(ws.id)
  const topRiskCustomers = dataset.topRiskCustomers(ws.id)
  const weekly = dataset.weekly(ws.id)
  const hourly = dataset.hourly(ws.id)

  // Apply cross-filter to customers
  const customers = filter ? applyCustomerFilter(allCustomers, filter) : allCustomers
  const filterRatio = customers.length / Math.max(1, allCustomers.length)

  // Channels — show all but visually highlight filtered
  const channels = filter && filter.channels.length > 0
    ? allChannels.filter((c) => filter.channels.includes(c.channel))
    : allChannels

  // Filter ratio applied to revenue / orders for visual consistency
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0) * filterRatio
  const totalCustomers = Math.round(customers.length * 200)
  const atRisk = customers.filter((c) => c.status === 'at_risk' || c.status === 'lost').length
  const ghosts = customers.filter((c) => c.status === 'ghost').length
  const bestCustomers = customers.filter(
    (c) => c.status === 'champion' || c.status === 'loyal',
  )
  const totalRisk = customers
    .filter((c) => c.status === 'at_risk' || c.status === 'lost')
    .reduce((s, c) => s + c.totalSpend, 0)

  /* Channel-mix monthly — moved from Growth. Aggregates each channel's
   * revenue across the 6 months for the LineChart. */
  const channelMonthly = useMemo(() => {
    const seed = ws.id.length
    return monthly.map((m, i) => {
      const row: Record<string, any> = { month: m.month }
      allChannels.slice(0, 5).forEach((c, j) => {
        const drift = ((seed + i * 7 + j * 3) % 10) / 30
        row[c.channel] = Math.round((m.revenue * c.share / 100) * (0.85 + drift))
      })
      return row
    })
  }, [monthly, allChannels, ws.id])

  const toggleChannel = (channel: string) => {
    if (!setFilter) return
    setFilter((prev) => ({
      ...prev,
      channels: toggleArray(prev.channels, channel),
    }))
  }
  const toggleStatus = (status: string) => {
    if (!setFilter) return
    setFilter((prev) => ({
      ...prev,
      status: toggleArray(prev.status, status),
    }))
  }
  const toggleRange = (range: '7d' | '30d' | '90d' | 'all') => {
    if (!setFilter) return
    setFilter((prev) => ({ ...prev, range }))
  }

  return (
    <div className="space-y-6">
      {/* Cross-filter hint */}
      {!compact && !filterActive && (
        <div className="card tone-neutral p-3 flex items-center gap-2 text-xs text-slate-600">
          <MousePointerClick className="w-4 h-4 text-brand-500" />
          <span>
            <strong className="text-slate-800">เคล็ดลับ:</strong> คลิกที่{' '}
            <span className="font-semibold">bar / pie / status card / channel row</span>{' '}
            เพื่อ cross-filter หน้านี้ทั้งหน้า
          </span>
        </div>
      )}

      {/* Health summary */}
      {!compact && (
        <section className="story-section">
          <div className="story-header">
            <Wallet className="w-5 h-5 text-brand-600" />
            <h2 className="story-title">สุขภาพธุรกิจ — Business Health</h2>
          </div>

          <div className="card tone-revenue p-4">
            <div className="text-sm font-semibold text-slate-900">
              📊 มูลค่าเสี่ยง {formatTHB(totalRisk, { compact: true })} ·{' '}
              <span className="text-emerald-700">ลูกค้าสุขภาพดี</span>{' '}
              {(((bestCustomers.length / Math.max(1, customers.length)) * 100) || 0).toFixed(1)}% ·{' '}
              <span className="text-rose-700">ลูกค้าวิกฤต</span>{' '}
              {formatNumber(customers.filter((c) => c.status === 'lost').length * 50)} ราย
              {filterActive && (
                <span className="ml-2 chip bg-brand-100 text-brand-700 text-[10px]">· filtered</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="story-section">
        {!compact && (
          <div className="story-header">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="story-title">KPIs หลัก</h2>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat icon={Users}        label="Total Customers" value={formatNumber(totalCustomers, { compact: true })} sub={`Repeat ${(((bestCustomers.length + customers.filter((c) => c.status === 'potential').length) / Math.max(1, customers.length)) * 100).toFixed(1)}%`} tone="customer" />
          <BigStat icon={TrendingUp}   label="Total Revenue"   value={formatTHB(totalRevenue, { compact: true })} sub="excl. cancelled & returned" trend={8.2} tone="revenue" />
          <BigStat icon={ShoppingCart} label="Orders (7d)"     value={formatNumber((monthly[monthly.length - 1].orders / 4) * filterRatio, { compact: true })} sub="ออเดอร์ในสัปดาห์นี้" tone="neutral" />
          <BigStat icon={Repeat}       label="Repeat Rate"     value="18.83%" sub="ลูกค้าซื้อซ้ำ" trend={-1.4} tone="retention" />
        </div>
      </section>

      {/* Customer status buckets */}
      <section className="story-section">
        {!compact && (
          <div className="story-header">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="story-title">สุขภาพลูกค้า — Customer Status</h2>
            <span className="story-sub">คลิกการ์ดเพื่อ filter เฉพาะกลุ่มนั้น</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BucketCard icon={AlertCircle} tone="bg-amber-50 border-amber-200 text-amber-900"   iconBg="bg-amber-100 text-amber-700"
            title={`${formatNumber(atRisk * 80)} at-risk`} value={formatTHB(totalRisk, { compact: true })}
            sub="ลูกค้าใกล้หาย · เร่งดึงกลับ" active={filter?.status.includes('at_risk') ?? false} onClick={() => toggleStatus('at_risk')} />
          <BucketCard icon={Crown}       tone="bg-emerald-50 border-emerald-200 text-emerald-900" iconBg="bg-emerald-100 text-emerald-700"
            title={`${formatNumber(bestCustomers.length * 30)} best`} value={formatTHB(bestCustomers.reduce((s, c) => s + c.totalSpend, 0) * 20, { compact: true })}
            sub="VIP & loyal · ขอรีวิว + แนะนำเพื่อน" active={filter?.status.includes('champion') ?? false} onClick={() => toggleStatus('champion')} />
          <BucketCard icon={Ghost}       tone="bg-slate-50 border-slate-200 text-slate-700"      iconBg="bg-slate-100 text-slate-600"
            title={`${ghosts} ghosts`} value={formatTHB(ghosts * 10000, { compact: true })}
            sub="หายไป 509+ วัน · re-engage หรือ archive" active={filter?.status.includes('ghost') ?? false} onClick={() => toggleStatus('ghost')} />
        </div>
      </section>

      {compact ? null : (
        <>
          {/* Revenue trend — 6 months monthly + 6 months daily side-by-side */}
          <section className="story-section">
            <div className="story-header">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h2 className="story-title">ยอดขาย 6 เดือนล่าสุด</h2>
              <span className="story-sub">ดูภาพรวมรายเดือน + รายวันคู่กัน · คลิกเพื่อ filter</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="card tone-revenue p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">รายเดือน (6M)</div>
                  <div className="flex gap-1">
                    {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                      <button key={r} onClick={() => toggleRange(r)}
                        className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold',
                          filter?.range === r ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                        {r === 'all' ? 'ทั้งหมด' : r}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatTHB(v, { compact: true })} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Net Revenue" stackId="a" fill="#ff7a00" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }}
                      onClick={() => toggleRange(filter?.range === '30d' ? 'all' : '30d')} />
                    <Bar dataKey="returned" name="Returned" stackId="a" fill="#f59e0b" style={{ cursor: 'pointer' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card tone-revenue p-5">
                <div className="font-semibold text-sm mb-2">รายวัน 6 เดือน (Daily)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={daily6m} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="daily6mGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#ff7a00" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ff7a00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={(v: string) => v.slice(5)} interval={Math.floor(daily6m.length / 6)} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => formatTHB(v, { compact: true })}
                      labelFormatter={(l) => `วันที่ ${l}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#ff7a00" strokeWidth={2} fill="url(#daily6mGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Channel split */}
          <section className="story-section">
            <div className="story-header">
              <ShoppingCart className="w-5 h-5 text-violet-600" />
              <h2 className="story-title">ช่องทางการขาย — Channel Split</h2>
              <span className="story-sub">คลิกแถวเพื่อ filter</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card tone-product p-5 lg:col-span-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-600 border-b border-violet-100">
                      <th className="text-left py-2 font-semibold">ช่องทาง</th>
                      <th className="text-right py-2 font-semibold">ออเดอร์</th>
                      <th className="text-right py-2 font-semibold">ลูกค้า</th>
                      <th className="text-right py-2 font-semibold">ยอดขาย</th>
                      <th className="text-right py-2 font-semibold">Cancel</th>
                      <th className="text-right py-2 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allChannels.map((c) => {
                      const isActive = filter?.channels.includes(c.channel) ?? false
                      return (
                        <tr key={c.channel} onClick={() => toggleChannel(c.channel)}
                          className={cn('border-b border-violet-100/40 cursor-pointer transition-colors',
                            isActive ? 'bg-brand-50' : 'hover:bg-white/70')}>
                          <td className="py-2 font-medium">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                              {c.channel}
                              {isActive && <span className="chip bg-brand-100 text-brand-700 text-[9px]">✓ filtered</span>}
                            </span>
                          </td>
                          <td className="text-right">{formatNumber(c.orders)}</td>
                          <td className="text-right">{formatNumber(c.customers)}</td>
                          <td className="text-right font-semibold text-brand-700">{formatTHB(c.revenue, { compact: true })}</td>
                          <td className="text-right text-rose-600">{c.cancelRate.toFixed(2)}%</td>
                          <td className="text-right text-slate-500">{c.share.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card tone-product p-5">
                <div className="font-semibold mb-3">สัดส่วนช่องทาง</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={allChannels} dataKey="revenue" nameKey="channel" innerRadius={50} outerRadius={90} paddingAngle={2}
                      onClick={(d: any) => toggleChannel(d.channel)} style={{ cursor: 'pointer' }}>
                      {allChannels.map((c) => {
                        const isActive = filter?.channels.includes(c.channel)
                        return (
                          <Cell key={c.channel} fill={c.color} stroke={isActive ? '#0f172a' : 'white'} strokeWidth={isActive ? 3 : 1}
                            opacity={filter?.channels.length === 0 || !filter?.channels.length || isActive ? 1 : 0.25} />
                        )
                      })}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatTHB(v, { compact: true })} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Channel Mix (moved from Growth) */}
          <section className="story-section">
            <div className="story-header">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="story-title">เติบโตมาจากช่องทางไหน — Channel Mix</h2>
              <span className="story-sub">ยอดขายเฉลี่ยรายเดือนตามแต่ละช่องทาง</span>
            </div>
            <div className="card tone-revenue p-5">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={channelMonthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatTHB(v, { compact: true })} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {allChannels.slice(0, 5).map((c) => (
                    <Line key={c.channel} type="monotone" dataKey={c.channel} stroke={c.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Cancellations & Returns by Channel (NEW) */}
          <section className="story-section">
            <div className="story-header">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="story-title">Cancellations &amp; Returns by Channel</h2>
              <span className="story-sub">คลิกแถวเพื่อ filter ช่องทาง</span>
            </div>
            <div className="card tone-risk overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-rose-50/40 text-xs text-slate-600">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Channel</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Completed</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Cancelled</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Returned</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Rate %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelReturnSplit.map((c) => {
                      const isActive = filter?.channels.includes(c.channel) ?? false
                      return (
                        <tr key={c.channel} onClick={() => toggleChannel(c.channel)}
                          className={cn('border-t border-rose-100/40 cursor-pointer transition-colors',
                            isActive ? 'bg-brand-50' : 'hover:bg-white/70')}>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-2 font-medium">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                              {c.channel}
                            </span>
                          </td>
                          <td className="text-right px-3 tabular-nums">{formatNumber(c.completed)}</td>
                          <td className="text-right px-3 tabular-nums text-amber-700">{formatNumber(c.cancelled)}</td>
                          <td className="text-right px-3 tabular-nums text-rose-700">{formatNumber(c.returned)}</td>
                          <td className="text-right px-3 font-bold">
                            <span className={cn('chip', c.rate > 4 ? 'bg-rose-100 text-rose-700' : c.rate > 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
                              {c.rate.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* High-Risk Customers (NEW) */}
          <section className="story-section">
            <div className="story-header">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h2 className="story-title">High-Risk Customers</h2>
              <span className="story-sub">คลิกชื่อ → ดู profile เต็มที่ Customer Center</span>
            </div>
            <div className="card tone-retention overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-rose-50/40 text-xs text-slate-600">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">ลูกค้า</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Segment</th>
                      <th className="text-left py-2.5 px-3 font-semibold">สถานะ</th>
                      <th className="text-right py-2.5 px-3 font-semibold">% Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRiskCustomers.map((c) => (
                      <tr key={c.id} onClick={() => navigate(`/customer-center/customers/${encodeURIComponent(c.id)}`)}
                        className="border-t border-rose-100/40 cursor-pointer hover:bg-white/70">
                        <td className="py-2.5 px-4 font-medium text-slate-900 flex items-center gap-2">
                          {c.name}
                          <ArrowRight className="w-3.5 h-3.5 text-rose-400 opacity-0 group-hover:opacity-100" />
                        </td>
                        <td className="px-3"><span className="chip bg-slate-100 text-slate-700 max-w-[180px] truncate">{c.segment}</span></td>
                        <td className="px-3"><span className={cn('chip', statusColor[c.status as keyof typeof statusColor])}>{statusLabel[c.status as keyof typeof statusLabel]}</span></td>
                        <td className="text-right px-3 font-bold tabular-nums">
                          <span className={cn(c.risk >= 70 ? 'text-rose-600' : c.risk >= 50 ? 'text-amber-600' : 'text-slate-600')}>
                            {c.risk}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Rhythm — weekly + hourly (moved from Growth) */}
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
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatTHB(v, { compact: true })} />
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
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="share" fill="#a855f7" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Story note */}
          <div className="card tone-customer p-5">
            <div className="font-semibold text-emerald-800 mb-2">📝 ข้อสังเกตจาก Performance</div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>ช่องทางหลักคือ <strong>{allChannels[0].channel}</strong> ({allChannels[0].share.toFixed(1)}%) — กระจุกมากเกินไป ควร diversify</li>
              <li>Repeat rate <strong>18.8%</strong> ยังต่ำ — ดูที่ tab <strong>ความถี่ & ซื้อซ้ำ</strong> เพื่อวางแผน win-back</li>
              <li>มูลค่าเสี่ยง <strong>{formatTHB(totalRisk, { compact: true })}</strong> — เร่ง telesale contact ภายใน 14 วัน</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

const BigStat = ({
  icon: Icon, label, value, sub, trend, tone,
}: {
  icon: any; label: string; value: string; sub: string; trend?: number;
  tone: 'revenue' | 'customer' | 'retention' | 'neutral' | 'product' | 'risk'
}) => {
  const iconTones: Record<string, string> = {
    revenue: 'bg-brand-100 text-brand-700',
    customer: 'bg-emerald-100 text-emerald-700',
    retention: 'bg-pink-100 text-pink-700',
    neutral: 'bg-slate-100 text-slate-600',
    product: 'bg-violet-100 text-violet-700',
    risk: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className={`card p-4 tone-${tone}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconTones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{label}</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</div>
          {trend != null && (
            <div className={cn('inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold',
              trend >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BucketCard = ({
  icon: Icon, tone, iconBg, title, value, sub, active, onClick,
}: {
  icon: any; tone: string; iconBg: string; title: string; value: string; sub: string;
  active?: boolean; onClick?: () => void
}) => (
  <button onClick={onClick}
    className={cn('card border-2 p-4 text-left transition-all w-full', tone,
      active ? 'ring-2 ring-brand-500 ring-offset-2 -translate-y-0.5 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-sm')}>
    <div className="flex items-start gap-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm flex items-center gap-1.5">
          {title}
          {active && <span className="chip bg-brand-100 text-brand-700 text-[10px]">✓ filtered</span>}
        </div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs opacity-80 mt-0.5">{sub}</div>
      </div>
    </div>
  </button>
)
