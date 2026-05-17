import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Search, Sparkles, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB, statusColor, statusLabel } from '@/lib/utils'
import type { Customer } from '@/types'
import { AIInsightModal } from '@/components/AIInsightModal'
import { analyzeCustomer, AiInsight } from '@/lib/ai-mock'

type SortKey = 'name' | 'orders' | 'totalSpend' | 'lastBuy' | 'riskScore'

export const Customers = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const segmentFilter = params.get('segment') ?? ''
  const segmentKind = (params.get('kind') ?? 'marketing') as 'marketing' | 'telesale' | 'ads'

  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<string>('')
  const [tab, setTab] = useState<'all' | 'flagged' | 'excluded'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('totalSpend')
  const [page, setPage] = useState(1)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTarget, setAiTarget] = useState<Customer | null>(null)
  const [insight, setInsight] = useState<AiInsight | null>(null)

  if (!ws) return null

  const all = dataset.customersWithOverlay(ws.id)

  const filtered = useMemo(() => {
    let list = all
    if (segmentFilter) {
      const key =
        segmentKind === 'marketing'
          ? 'segmentMarketing'
          : segmentKind === 'telesale'
            ? 'segmentTelesale'
            : 'segmentAds'
      list = list.filter((c) => c[key as keyof Customer] === segmentFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.province.includes(search),
      )
    }
    if (statusF) list = list.filter((c) => c.status === statusF)
    if (tab === 'flagged') list = list.filter((c) => c.highAov)
    if (tab === 'excluded') list = list.filter((c) => c.status === 'ghost')

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'orders':
          return b.orders - a.orders
        case 'lastBuy':
          return new Date(b.lastBuy).getTime() - new Date(a.lastBuy).getTime()
        case 'riskScore':
          return b.riskScore - a.riskScore
        default:
          return b.totalSpend - a.totalSpend
      }
    })
    return list
  }, [all, search, statusF, tab, sortBy, segmentFilter, segmentKind])

  const pageSize = 12
  const totalPages = Math.ceil(filtered.length / pageSize)
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openAi = (c: Customer) => {
    setAiTarget(c)
    setInsight(analyzeCustomer(c))
    setAiOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ลูกค้าทั้งหมด</h1>
          <p className="muted">
            {filtered.length.toLocaleString()} ราย{segmentFilter ? ` · กรอง: ${segmentFilter}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs">
            <Download className="w-3.5 h-3.5" /> ส่งออก CSV
          </button>
          <button className="btn-ghost text-xs">📥 Import conditions</button>
        </div>
      </div>

      <div className="card p-3 bg-amber-50/40 border-amber-200 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800">
          832 outlier customers detected (AOV above ฿2,790.3 fence) — 0 excluded from RFM scoring
        </div>
        <button className="ml-auto btn-ghost text-xs border-amber-300">View flagged</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสลูกค้า..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={statusF}
          onChange={(e) => {
            setStatusF(e.target.value)
            setPage(1)
          }}
        >
          <option value="">สถานะทั้งหมด</option>
          {Object.entries(statusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="totalSpend">ยอดรวม (มาก → น้อย)</option>
          <option value="orders">จำนวนออเดอร์</option>
          <option value="lastBuy">ซื้อล่าสุด</option>
          <option value="riskScore">Risk Score</option>
          <option value="name">ชื่อ A-Z</option>
        </select>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 mb-2">
        {(['all', 'flagged', 'excluded'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setPage(1)
            }}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px',
              tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900',
            )}
          >
            {t === 'all'
              ? 'All Customers'
              : t === 'flagged'
                ? `⚠ Flagged (${all.filter((c) => c.highAov).length})`
                : `🚫 Excluded from RFM (${all.filter((c) => c.status === 'ghost').length})`}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">ลูกค้า</th>
                <th className="text-right px-3 py-2.5 font-medium">
                  <button
                    onClick={() => setSortBy('orders')}
                    className="inline-flex items-center gap-1"
                  >
                    ออเดอร์ <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right px-3 py-2.5 font-medium">ยอดรวม (THB)</th>
                <th className="text-left px-3 py-2.5 font-medium">กลุ่ม</th>
                <th className="text-left px-3 py-2.5 font-medium">สถานะ</th>
                <th className="text-right px-3 py-2.5 font-medium">AI</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => navigate(`/customers/${encodeURIComponent(c.id)}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      {c.name}
                      {c.highAov && (
                        <span className="chip bg-amber-100 text-amber-700 text-[10px]">
                          ⚠ High AOV
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{c.phone} · {c.province}</div>
                  </td>
                  <td className="text-right px-3 py-3 font-semibold">{c.orders}</td>
                  <td className="text-right px-3 py-3 font-semibold text-brand-700">
                    {formatTHB(c.totalSpend)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="chip bg-slate-100 text-slate-700 max-w-[200px] truncate">
                      {c.segmentMarketing}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('chip', statusColor[c.status])}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openAi(c)
                      }}
                      className="btn-soft text-xs"
                    >
                      <Sparkles className="w-3 h-3" /> AI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            แสดง {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} จาก{' '}
            {formatNumber(filtered.length)}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-ghost text-xs"
            >
              ←
            </button>
            <span className="px-2">
              หน้า {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-ghost text-xs"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <AIInsightModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        insight={insight}
        title={aiTarget?.name ?? ''}
        subtitle={aiTarget ? `${aiTarget.phone} · ${aiTarget.province}` : undefined}
      />
    </div>
  )
}
