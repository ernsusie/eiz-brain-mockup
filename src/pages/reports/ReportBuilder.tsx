import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart3,
  Download,
  Eye,
  FileText,
  GripVertical,
  Mail,
  PieChart as PieIcon,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

/** Each block is a self-contained chart/stat the user can drag into
 *  the canvas. The mockup doesn't run a real drag library — instead
 *  the picker lets the user click "+ Add" and we append to the list. */
type BlockKind =
  | 'kpi_revenue'
  | 'kpi_customers'
  | 'kpi_aov'
  | 'kpi_orders'
  | 'monthly_revenue'
  | 'channel_pie'
  | 'channel_table'
  | 'top10_products'
  | 'rfm_segments'
  | 'cohort_summary'
  | 'urgent_situations'

interface Block {
  id:    string
  kind:  BlockKind
  width: 'full' | 'half'
}

const BLOCK_LIBRARY: { kind: BlockKind; label: string; icon: any; defaultWidth: 'full' | 'half' }[] = [
  { kind: 'kpi_revenue',       label: 'KPI · Revenue',           icon: TrendingUp, defaultWidth: 'half' },
  { kind: 'kpi_customers',     label: 'KPI · Customers',         icon: Users,      defaultWidth: 'half' },
  { kind: 'kpi_orders',        label: 'KPI · Orders',            icon: Activity,   defaultWidth: 'half' },
  { kind: 'kpi_aov',           label: 'KPI · AOV',               icon: TrendingUp, defaultWidth: 'half' },
  { kind: 'monthly_revenue',   label: 'กราฟยอดขาย 6 เดือน',       icon: BarChart3,  defaultWidth: 'full' },
  { kind: 'channel_pie',       label: 'Channel pie',              icon: PieIcon,    defaultWidth: 'half' },
  { kind: 'channel_table',     label: 'Channel table',            icon: BarChart3,  defaultWidth: 'full' },
  { kind: 'top10_products',    label: 'Top 10 products',          icon: BarChart3,  defaultWidth: 'full' },
  { kind: 'rfm_segments',      label: 'RFM segment summary',      icon: Sparkles,   defaultWidth: 'full' },
  { kind: 'cohort_summary',    label: 'Cohort retention summary', icon: Activity,   defaultWidth: 'full' },
  { kind: 'urgent_situations', label: 'Urgent situations',        icon: Users,      defaultWidth: 'full' },
]

const PALETTE = ['#ff7a00', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

export const ReportBuilder = () => {
  const ws = workspaces.current()
  const [title, setTitle] = useState('Sabuy Skincare — Monthly Performance Review')
  const [subtitle, setSubtitle] = useState('Monthly Performance Review')
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', kind: 'kpi_revenue',     width: 'half' },
    { id: '2', kind: 'kpi_orders',      width: 'half' },
    { id: '3', kind: 'monthly_revenue', width: 'full' },
    { id: '4', kind: 'channel_table',   width: 'full' },
  ])
  const [delivery, setDelivery] = useState<'pdf' | 'link' | 'email' | 'schedule'>('pdf')
  const [theme, setTheme] = useState<'light' | 'brand'>('brand')
  const [brandColor, setBrandColor] = useState('#ec4899')

  if (!ws) return null

  const addBlock = (kind: BlockKind) => {
    const meta = BLOCK_LIBRARY.find((b) => b.kind === kind)!
    setBlocks((bs) => [...bs, { id: `b${Date.now()}`, kind, width: meta.defaultWidth }])
  }
  const removeBlock = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id))
  const toggleWidth = (id: string) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, width: b.width === 'full' ? 'half' : 'full' } : b)))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => history.back()} className="text-xs text-slate-500 hover:text-slate-900">
            Reports ›
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-slate-900 bg-transparent focus:outline-none focus:bg-slate-50 rounded px-2 py-1 -ml-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">
            <Send className="w-3.5 h-3.5" /> Send to Client
          </button>
        </div>
      </div>

      <PageInsight
        kind="info"
        title="AI สรุปการสร้างรายงาน"
        items={[
          <>ลากบล็อกจาก <strong>Block library</strong> ด้านซ้ายมาที่ canvas — แต่ละบล็อกเลือกความกว้างได้ (เต็ม / ครึ่งคอลัมน์)</>,
          <>เลือก theme/brand color + logo + delivery (PDF / link / email / schedule) ก่อนกด <strong>Send to Client</strong></>,
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Left rail */}
        <div className="space-y-3">
          <Panel title="🎨 Theme">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={theme === 'light'} onChange={() => setTheme('light')} /> Light (default)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={theme === 'brand'} onChange={() => setTheme('brand')} /> Client brand
              </label>
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Brand color</div>
              <div className="flex gap-2">
                {['#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={cn('w-7 h-7 rounded-full transition-transform', brandColor === c && 'ring-2 ring-slate-900 ring-offset-2 scale-110')}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Logo</div>
              <div className="border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 py-3 hover:border-slate-400 cursor-pointer">
                + Upload logo
              </div>
            </div>
          </Panel>

          <Panel title="📄 Block library">
            <p className="text-[11px] text-slate-500 mb-2">คลิก + เพื่อเพิ่มเข้า canvas</p>
            <div className="space-y-1">
              {BLOCK_LIBRARY.map((b) => {
                const Icon = b.icon
                return (
                  <button
                    key={b.kind}
                    onClick={() => addBlock(b.kind)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="flex-1 truncate">{b.label}</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )
              })}
            </div>
          </Panel>

          <Panel title="🚚 Delivery">
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={delivery === 'pdf'}      onChange={() => setDelivery('pdf')} />
                <Download className="w-3.5 h-3.5" /> Export PDF
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={delivery === 'link'}     onChange={() => setDelivery('link')} />
                🔗 Shareable link
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={delivery === 'email'}    onChange={() => setDelivery('email')} />
                <Mail className="w-3.5 h-3.5" /> Email to client
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={delivery === 'schedule'} onChange={() => setDelivery('schedule')} />
                ⏰ Schedule recurring
              </label>
            </div>
          </Panel>
        </div>

        {/* Canvas */}
        <div className="space-y-3">
          {/* Cover banner */}
          <div
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{
              background: theme === 'brand'
                ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                : 'linear-gradient(135deg, #0f172a, #334155)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold">
              {ws.icon}
            </div>
            <div className="absolute top-5 right-6 text-right text-xs opacity-80">
              <div>Monthly Report</div>
              <div>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <h2 className="text-2xl font-bold mt-12">{title}</h2>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="text-sm bg-transparent border-b border-white/30 mt-2 focus:outline-none focus:border-white/60 px-0 w-full"
            />
            <p className="text-[11px] opacity-70 mt-2">
              Prepared by Aria Agency · {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocks.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                onRemove={() => removeBlock(b.id)}
                onToggleWidth={() => toggleWidth(b.id)}
              />
            ))}
          </div>

          {/* Drop zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-sm text-slate-500 hover:border-slate-400 cursor-pointer bg-white">
            + Drag block here to add new section
          </div>
        </div>
      </div>
    </div>
  )
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
)

const BlockCard = ({
  block,
  onRemove,
  onToggleWidth,
}: {
  block:          Block
  onRemove:       () => void
  onToggleWidth:  () => void
}) => {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group relative', block.width === 'full' && 'md:col-span-2')}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={onToggleWidth}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          title="Toggle width"
        >
          {block.width === 'full' ? '½' : '◻'}
        </button>
        <button
          onClick={onRemove}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-50">
        <GripVertical className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <BlockContent kind={block.kind} />
    </div>
  )
}

const BlockContent = ({ kind }: { kind: BlockKind }) => {
  const ws = workspaces.current()
  if (!ws) return null
  const monthly = dataset.monthly(ws.id)
  const channels = dataset.channels(ws.id)
  const products = dataset.products(ws.id)
  const customers = dataset.customersWithOverlay(ws.id)
  const urgent = dataset.urgent(ws.id)

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
  const totalOrders = monthly.reduce((s, m) => s + m.orders, 0)
  const totalCustomers = customers.length
  const aov = Math.round(totalRevenue / Math.max(1, totalOrders))

  switch (kind) {
    case 'kpi_revenue':
      return (
        <Stat label="Total Revenue"   value={formatTHB(totalRevenue, { compact: true })} sub="ผลรวม 6 เดือน" tone="brand" />
      )
    case 'kpi_customers':
      return (
        <Stat label="Total Customers" value={formatNumber(totalCustomers)} sub="ทั้งหมด" tone="emerald" />
      )
    case 'kpi_orders':
      return (
        <Stat label="Total Orders"    value={formatNumber(totalOrders, { compact: true })} sub="ผลรวม 6 เดือน" tone="sky" />
      )
    case 'kpi_aov':
      return (
        <Stat label="AOV"             value={formatTHB(aov)} sub="เฉลี่ยต่อออเดอร์" tone="violet" />
      )
    case 'monthly_revenue':
      return (
        <BlockShell title="ยอดขายรายเดือน">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatTHB(v, { compact: true })} />
              <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </BlockShell>
      )
    case 'channel_pie':
      return (
        <BlockShell title="Channel breakdown">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={channels} dataKey="revenue" nameKey="channel" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {channels.map((c) => <Cell key={c.channel} fill={c.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatTHB(v, { compact: true })} />
            </PieChart>
          </ResponsiveContainer>
        </BlockShell>
      )
    case 'channel_table':
      return (
        <BlockShell title="CHANNEL BREAKDOWN" upper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {channels.slice(0, 4).map((c) => (
              <div key={c.channel} className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                <div className="w-6 h-6 mx-auto rounded-full mb-1" style={{ background: c.color }} />
                <div className="text-xs font-bold text-slate-900">{c.channel}</div>
                <div className="text-[10px] text-slate-500">฿{(c.revenue / 1000).toFixed(0)}K · {c.share.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </BlockShell>
      )
    case 'top10_products':
      return (
        <BlockShell title="Top 10 products">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={100} tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 11) + '…' : v} />
              <Tooltip formatter={(v: number) => formatTHB(v, { compact: true })} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {products.slice(0, 10).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BlockShell>
      )
    case 'rfm_segments':
      return (
        <BlockShell title="RFM Segments">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {['champion', 'loyal', 'at_risk'].map((s) => {
              const count = customers.filter((c) => c.status === s).length
              return (
                <div key={s} className="rounded-xl bg-slate-50 p-2 text-center">
                  <div className="font-bold text-slate-900">{count}</div>
                  <div className="text-[10px] text-slate-500">{s}</div>
                </div>
              )
            })}
          </div>
        </BlockShell>
      )
    case 'cohort_summary':
      return (
        <BlockShell title="Cohort retention">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Avg M1" value="6.4%" tone="emerald" sub="กลับมาเดือนถัดไป" />
            <Stat label="Avg M3" value="4.1%" tone="sky" sub="กลับมา 3 เดือน" />
          </div>
        </BlockShell>
      )
    case 'urgent_situations':
      return (
        <BlockShell title="Urgent situations">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {urgent.map((u) => (
              <div key={u.key} className="rounded-xl bg-slate-50 p-2">
                <div className="text-lg">{u.icon}</div>
                <div className="font-bold text-slate-900">{formatNumber(u.count)}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{u.title}</div>
              </div>
            ))}
          </div>
        </BlockShell>
      )
    default:
      return <div className="text-xs text-slate-400">Unknown block</div>
  }
}

const BlockShell = ({ title, upper, children }: { title: string; upper?: boolean; children: React.ReactNode }) => (
  <div>
    <div className={cn('text-[10px] uppercase tracking-wider font-semibold mb-2', upper ? 'text-rose-700' : 'text-slate-500')}>
      {title}
    </div>
    {children}
  </div>
)

const Stat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) => {
  const toneCls: Record<string, string> = {
    brand:   'text-brand-700',
    emerald: 'text-emerald-700',
    sky:     'text-sky-700',
    violet:  'text-violet-700',
  }
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={cn('text-2xl font-bold mt-0.5', toneCls[tone])}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

/* Unused import keeper — FileText is referenced by the sidebar entry. */
export const ReportBuilderIcon = FileText
