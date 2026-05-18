import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Search, Sparkles, AlertTriangle, ArrowUpDown, X } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB, statusColor, statusLabel } from '@/lib/utils'
import type { Customer } from '@/types'
import { AIInsightModal } from '@/components/AIInsightModal'
import { analyzeCustomer, AiInsight } from '@/lib/ai-mock'
import { PageInsight } from '@/components/PageInsight'

type SortKey = 'name' | 'orders' | 'totalSpend' | 'lastBuy' | 'riskScore'

/* Recommended action per RFM segment key — keyed off the seg_key
 * URL param when the user arrives via "ดูรายชื่อ" from the Segment
 * Customer page. */
const SEGMENT_RECOMMENDATIONS: Record<string, { title: string; tele: string; sell: string; ads: string }> = {
  big_leaving:      { title: 'P1 · ลูกค้าใหญ่ที่กำลังจะหายไป', tele: 'โทรภายใน 3 วัน · sale คนเดิมถ้ามี history', sell: 'Care package + 25% voucher · กลุ่มสินค้าที่ซื้อบ่อย', ads: 'Pre-launch new product · invite-only' },
  big_lost:         { title: 'P1 · ลูกค้าตัวที่เลิกซื้อไปแล้ว',  tele: 'enroll telesale + ส่ง win-back email',        sell: 'Personal offer 25-30% · best-seller',         ads: 'Retarget 90d · pixel + LINE OA' },
  cust_lost:        { title: 'P1 · ลูกค้าเลิกซื้อไปแล้ว',         tele: 'Re-engage 2 ครั้ง · ถ้าไม่ตอบ archive',          sell: 'Final win-back coupon 40%',                       ads: 'Exclude หลังพยายามรอบสุดท้าย' },
  loyal_drifting:   { title: 'P2 · ลูกค้าชั้นที่เริ่มห่างไป',     tele: 'Auto-touchpoint ไม่ต้อง enroll telesale',         sell: 'Cross-sell + invite VIP membership',              ads: 'Suppress · ใช้ใน look-alike' },
  dead_first_big:   { title: 'P2 · ซื้อครั้งแรกง่ายหนัก (ตายแล้ว)', tele: 'enroll P2 sale ที่ specialize big bills',         sell: 'Welcome call + cross-sell premium',                ads: 'Pre-launch invite' },
  cooling_first_big:{ title: 'P2 · ซื้อครั้งแรกง่ายหนัก (เริ่มห่าง)', tele: 'enroll หาก telesale ว่าง',                       sell: 'Voucher 20% · personalised',                       ads: 'Retarget 60d' },
  mid_value_dead:   { title: 'P2 · ตายแล้วยอดปานกลาง-สูง',     tele: 'enroll ถ้ามี history channel เดิม',              sell: 'Voucher 25%',                                      ads: 'Look-alike retarget' },
  potential_loyal:  { title: 'P3 · มีโอกาสเป็นลูกค้าชั้นเยี่ยม',    tele: 'รอ trigger 30 วันแรก · Nurture',                  sell: 'Cross-sell · loyalty program',                     ads: 'Educational + UGC content' },
  easy_above_avg:   { title: 'P3 · ลูกค้าใหม่ซื้อง่ายหนัก',       tele: 'Auto onboarding sequence',                       sell: 'Coupon ฿200 + sample',                             ads: 'Bundle videos · brand intro' },
  first_warmest:    { title: 'P3 · ซื้อครั้งแรกสูงกว่าปกติ',     tele: 'Auto LINE OA 7 วันแรก',                          sell: 'Bundle ลด 15%',                                    ads: 'Educational content' },
  low_freq_unsold:  { title: 'P3 · กลุ่มลูกค้าที่ไม่ค่อยขาย',     tele: 'ส่ง LINE OA ก่อน · telesale top 30%',           sell: 'Personalised recommend',                           ads: 'Brand-awareness' },
  champion_loyal:   { title: 'P4 · ลูกค้าชั้นเยี่ยม',             tele: 'ขอ review · invite referral',                    sell: 'Premium / new launch first',                       ads: 'Look-alike seed (suppress spend)' },
  first_aging:      { title: 'P4 · ซื้อครั้งแรก ห่างนาน',         tele: 'Final win-back · auto',                          sell: 'Coupon ลด 25%',                                    ads: 'Exclude' },
  first_cooling:    { title: 'P4 · ซื้อครั้งแรก เริ่มห่าง',        tele: 'Auto-onboard ครบ 14 วัน',                       sell: 'Onboard pack + voucher 150',                       ads: 'Educational' },
  low_normal:       { title: 'P4 · ซื้อครั้งแรกง่ายปกติ',        tele: 'Auto-onboard',                                   sell: 'Voucher 100 · low ASP',                            ads: 'Suppress' },
  dead_cheap:       { title: 'P4 · ตาย (ซื้อน้อย)',              tele: 'Archive · suppress ads',                         sell: '—',                                                ads: 'Exclude' },
  aging_60_120:     { title: 'P4 · ยอดต่ำกว่า 1000 ซื้อ 60-120 วัน', tele: 'Auto LINE OA',                                   sell: 'Discount 15%',                                     ads: 'Retarget pixel only' },
  rare_small:       { title: 'P4 · ซื้อเรื่อย ๆ ยอดน้อย',         tele: 'Auto · ไม่ต้อง enroll',                          sell: 'Cross-sell sample',                                ads: 'Suppress' },
  first_small:      { title: 'P4 · ซื้อครั้งแรกง่ายน้อย',         tele: 'Auto onboard 7 วัน',                             sell: 'Sample pack ส่งฟรี',                                ads: 'Awareness' },
  never:            { title: 'P4 · ทดลอง/ดอง',                 tele: 'Archive',                                        sell: '—',                                                ads: 'Exclude' },
}

export const Customers = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const segmentFilter = params.get('segment') ?? ''
  const segKey       = params.get('seg_key') ?? ''
  const segmentKind = (params.get('kind') ?? 'marketing') as 'marketing' | 'telesale' | 'ads'
  const recommendation = segKey ? SEGMENT_RECOMMENDATIONS[segKey] : null

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

  /* Map an RFM seg_key → a (very rough) predicate on the customer's
   * status/orders/totalSpend so the Customer Master shows a plausible
   * filtered list. Mockup-level fidelity. */
  const segPredicate = useMemo((): (c: Customer) => boolean => {
    if (!segKey) return () => true
    const map: Record<string, (c: Customer) => boolean> = {
      big_leaving:       (c) => c.status === 'at_risk' && c.totalSpend > 5000,
      big_lost:          (c) => c.status === 'lost' && c.totalSpend > 5000,
      cust_lost:         (c) => c.status === 'lost',
      dead_first_big:    (c) => c.status === 'lost' && c.orders === 1 && c.totalSpend > 5000,
      dead_cheap:        (c) => c.status === 'lost' && c.totalSpend < 1000,
      mid_value_dead:    (c) => c.status === 'lost' && c.totalSpend >= 1000 && c.totalSpend <= 5000,
      aging_60_120:      (c) => c.status === 'at_risk' && c.totalSpend < 1000,
      loyal_drifting:    (c) => c.status === 'loyal',
      champion_loyal:    (c) => c.status === 'champion',
      potential_loyal:   (c) => c.status === 'potential' && c.totalSpend > 1000,
      easy_above_avg:    (c) => c.status === 'new' && c.totalSpend > 1000,
      first_warmest:     (c) => c.status === 'new' && c.orders === 1 && c.totalSpend > 3000,
      first_cooling:     (c) => c.status === 'new' && c.orders === 1 && c.totalSpend < 3000,
      first_aging:       (c) => c.status === 'at_risk' && c.orders === 1,
      first_small:       (c) => c.status === 'new' && c.totalSpend < 1000,
      low_normal:        (c) => c.status === 'new' && c.orders === 1 && c.totalSpend > 500,
      cooling_first_big: (c) => c.status === 'at_risk' && c.orders === 1 && c.totalSpend > 3000,
      low_freq_unsold:   (c) => c.orders >= 2 && c.orders <= 3 && c.totalSpend < 2000,
      rare_small:        (c) => c.orders >= 2 && c.totalSpend < 1500,
      never:             (c) => c.status === 'ghost',
    }
    return map[segKey] ?? (() => true)
  }, [segKey])

  const filtered = useMemo(() => {
    let list = all
    if (segKey) {
      list = list.filter(segPredicate)
    } else if (segmentFilter) {
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
  }, [all, search, statusF, tab, sortBy, segmentFilter, segmentKind, segKey, segPredicate])

  const pageSize = 12
  const totalPages = Math.ceil(filtered.length / pageSize)
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openAi = (c: Customer) => {
    setAiTarget(c)
    setInsight(analyzeCustomer(c))
    setAiOpen(true)
  }

  const exportCsv = () => {
    /* Mockup-only: surface a confirmation toast and trigger a tiny
     * CSV download so the action feels real. */
    const headers = ['id', 'name', 'phone', 'province', 'status', 'orders', 'totalSpend', 'lastBuy']
    const rows = filtered.map((c) =>
      [c.id, c.name, c.phone, c.province, c.status, c.orders, c.totalSpend, c.lastBuy].join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `customers-${segKey || 'all'}-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <PageInsight
        kind="info"
        title="AI สรุปกลุ่มลูกค้านี้"
        items={[
          recommendation ? (
            <>
              ใน segment <strong>{recommendation.title}</strong> มีลูกค้า <strong>{formatNumber(filtered.length)} ราย</strong> —
              วันนี้ควรเริ่มที่ทีม telesale {recommendation.tele.split('·')[0].trim()}
            </>
          ) : (
            <>มีลูกค้า <strong>{formatNumber(filtered.length)} ราย</strong> ตรงเงื่อนไขที่กรอง · ใช้ฟิลเตอร์ด้านล่างเพื่อเจาะลึก</>
          ),
          <>กดปุ่ม <strong>ส่งออก CSV</strong> มุมขวาบนเพื่อ export รายชื่อ filter ปัจจุบัน · กดปุ่ม <strong>AI</strong> ต่อแต่ละแถวเพื่อดู insight รายคน</>,
        ]}
      />

      {recommendation && (
        <div className="card bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-rose-700 font-bold">Recommended Actions</div>
              <h2 className="text-lg font-bold text-slate-900">{recommendation.title}</h2>
              <p className="text-xs text-slate-600 mt-0.5">{formatNumber(filtered.length)} ราย · {formatTHB(filtered.reduce((s, c) => s + c.totalSpend, 0), { compact: true })}</p>
            </div>
            <button
              onClick={() => navigate('/customer-center/customers')}
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" /> ล้างฟิลเตอร์
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">📞 Telesale</div>
              <div className="text-sm text-slate-700">{recommendation.tele}</div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">🛒 ควรขายอะไร</div>
              <div className="text-sm text-slate-700">{recommendation.sell}</div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">📣 Ads / Reach</div>
              <div className="text-sm text-slate-700">{recommendation.ads}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ลูกค้าทั้งหมด</h1>
          <p className="muted">
            {filtered.length.toLocaleString()} ราย{segmentFilter ? ` · กรอง: ${segmentFilter}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-ghost text-xs">
            <Download className="w-3.5 h-3.5" /> ส่งออก CSV ({formatNumber(filtered.length)})
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
