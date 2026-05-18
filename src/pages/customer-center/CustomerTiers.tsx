import { useState } from 'react'
import { BarChart3, DollarSign, Filter, Info, Phone } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber } from '@/lib/utils'

type View = 'freq_recency' | 'freq_spend' | 'spend_recency'

const VIEWS: { key: View; label: string }[] = [
  { key: 'freq_recency',  label: 'Freq × Recency' },
  { key: 'freq_spend',    label: 'Freq × Spend' },
  { key: 'spend_recency', label: 'Spend × Recency' },
]

const DENSITY_COLORS = {
  veryDense: 'bg-rose-200 text-rose-900',
  dense:     'bg-orange-100 text-orange-900',
  medium:    'bg-amber-100 text-amber-900',
  light:     'bg-emerald-50 text-emerald-900',
  veryFew:   'bg-slate-50 text-slate-600',
  empty:     'bg-white text-slate-300',
}

/**
 * Customer Center · RFM (Customer Tiers).
 *
 * Three pairwise heatmaps mirroring the attached design — each grid
 * counts customers in the (row × col) bucket. Cell colour reflects
 * density relative to the max in the same grid. Each view ships with
 * its own "How to read this & what to do" block (Thai-first).
 */
export const CustomerTiers = () => {
  const ws = workspaces.current()
  const [view, setView] = useState<View>('freq_recency')
  if (!ws) return null
  const tiers = dataset.customerTiers(ws.id)

  const cfg = view === 'freq_recency'  ? { grid: tiers.freqRecency,  title: 'Frequency × Recency Grid',  sub: 'Top row = most frequent · rightmost col = longest gap · top-left = champions · top-right = at-risk loyalists' }
            : view === 'freq_spend'    ? { grid: tiers.freqSpend,    title: 'Frequency × Monetary Grid', sub: 'Top row = most frequent · rightmost col = highest spend · top-right = big VIPs' }
            :                            { grid: tiers.spendRecency, title: 'Monetary × Recency Grid',   sub: 'Top row = highest spend · rightmost col = longest gap · top-right = VIPs about to slip away' }

  /* Compute density classes from the data so colours auto-scale. */
  const maxCell = Math.max(...cfg.grid.data.flat(), 1)
  const cellTone = (v: number) => {
    if (v === 0) return DENSITY_COLORS.empty
    const t = v / maxCell
    if (t > 0.6)  return DENSITY_COLORS.veryDense
    if (t > 0.3)  return DENSITY_COLORS.dense
    if (t > 0.12) return DENSITY_COLORS.medium
    if (t > 0.04) return DENSITY_COLORS.light
    return DENSITY_COLORS.veryFew
  }

  /* Row/col totals + grand total. */
  const rowTotals = cfg.grid.data.map((row: number[]) => row.reduce((s: number, v: number) => s + v, 0))
  const colTotals = cfg.grid.cols.map((_: any, ci: number) => cfg.grid.data.reduce((s: number, row: number[]) => s + (row[ci] ?? 0), 0))
  const grand = rowTotals.reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Tiers</h1>
        <p className="text-sm text-slate-500">Compare customers across frequency, spend, and recency — pick a view below</p>
      </div>

      {/* View switcher */}
      <div className="flex flex-wrap gap-1 bg-slate-50 rounded-2xl border border-slate-200 p-1 w-full md:w-fit">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={cn(
              'flex-1 md:flex-initial px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              view === v.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{cfg.sub}</p>

      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 w-fit">
        <Filter className="w-3.5 h-3.5" /> ตัวกรอง ▼
      </button>

      <div className="card bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-blue-500" />
        <span className="text-slate-700">
          Showing {formatNumber(grand)} customers ({formatNumber(tiers.excluded)} with no orders excluded)
        </span>
      </div>

      {/* Grid */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900">{cfg.title}</h3>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            ☐ Select multiple
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-500 flex-wrap">
          <span>Cell colors:</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-300" /> Very dense</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-200" /> Dense</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-200" /> Medium</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-100" /> Light</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-100" /> Very few</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-slate-200 bg-white" /> Empty</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs text-slate-500 font-semibold uppercase">
                  {view === 'spend_recency' ? 'Spend' : 'Freq'}
                </th>
                {cfg.grid.cols.map((c: any) => (
                  <th key={c.key} className="text-center p-2 text-xs text-slate-500 font-semibold">{c.key}</th>
                ))}
                <th className="text-center p-2 text-xs text-slate-500 font-semibold bg-slate-100 rounded-l-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {cfg.grid.rows.map((r: any, ri: number) => (
                <tr key={r.key} className="border-t border-slate-100">
                  <td className="p-2 font-semibold text-slate-700">{r.key}</td>
                  {cfg.grid.data[ri].map((v: number, ci: number) => (
                    <td key={ci} className="p-1.5 text-center">
                      <div className={cn('rounded-lg py-2 px-1 font-semibold tabular-nums', cellTone(v))}>
                        {v > 0 ? formatNumber(v) : '—'}
                      </div>
                    </td>
                  ))}
                  <td className="p-1.5 text-center bg-slate-50 font-bold tabular-nums">{formatNumber(rowTotals[ri])}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50/60">
                <td className="p-2 font-bold text-slate-700">Total</td>
                {colTotals.map((t: number, ci: number) => (
                  <td key={ci} className="p-2 text-center font-bold tabular-nums">{formatNumber(t)}</td>
                ))}
                <td className="p-2 text-center font-bold tabular-nums bg-slate-100">{formatNumber(grand)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How to read */}
      <ReadGuide view={view} grid={cfg.grid} grand={grand} rowTotals={rowTotals} colTotals={colTotals} />
    </div>
  )
}

const ReadGuide = ({
  view,
  grid,
  grand,
  rowTotals,
  colTotals,
}: {
  view:      View
  grid:     any
  grand:    number
  rowTotals: number[]
  colTotals: number[]
}) => {
  /* Pick out the largest cell for a fact-based observation. */
  let largestVal = 0
  let largestRi = 0
  let largestCi = 0
  grid.data.forEach((row: number[], ri: number) => {
    row.forEach((v: number, ci: number) => {
      if (v > largestVal) {
        largestVal = v
        largestRi = ri
        largestCi = ci
      }
    })
  })
  const largestPct = ((largestVal / Math.max(1, grand)) * 100).toFixed(0)
  const largestLabel = `${grid.rows[largestRi].key} × ${grid.cols[largestCi].key}`

  const repeatSum = rowTotals.slice(0, rowTotals.length - 1).reduce((s, v) => s + v, 0)
  const repeatPct = ((repeatSum / Math.max(1, grand)) * 100).toFixed(0)
  const oneTimers = rowTotals[rowTotals.length - 1] ?? 0
  const oneTimersPct = ((oneTimers / Math.max(1, grand)) * 100).toFixed(0)

  /* Sub-text by view */
  const overview = view === 'freq_recency' ? [
    <>{formatNumber(grand)} ราย — ลูกค้าซื้อซ้ำ {formatNumber(repeatSum)} ราย ({repeatPct}%) เทียบกับซื้อครั้งเดียว {formatNumber(oneTimers)} ราย ({oneTimersPct}%)</>,
    <>ซื้อใน 30 วันล่าสุด {formatNumber(colTotals[0])} ราย · เงียบนานกว่า 120 วัน {formatNumber(colTotals[colTotals.length - 1] + (colTotals[colTotals.length - 2] ?? 0))} ราย</>,
  ] : view === 'freq_spend' ? [
    <>{formatNumber(grand)} ราย — แบ่งตามความถี่และยอดซื้อรวม</>,
    <>ยอดซื้อ ฿5,000+ {formatNumber((colTotals[0] ?? 0) + (colTotals[1] ?? 0))} ราย ({(((colTotals[0] ?? 0) + (colTotals[1] ?? 0)) / Math.max(1, grand) * 100).toFixed(0)}%) · ≤฿1,000 {formatNumber(grand - ((colTotals[0] ?? 0) + (colTotals[1] ?? 0) + (colTotals[2] ?? 0) + (colTotals[3] ?? 0)))} ราย</>,
  ] : [
    <>{formatNumber(grand)} ราย — แบ่งตามยอดซื้อและความล่าสุด</>,
    <>VIP (฿5K+) {formatNumber((rowTotals[0] ?? 0) + (rowTotals[1] ?? 0))} ราย · active ใน 30d {formatNumber(colTotals[0])} ราย · เงียบ &gt;120d {formatNumber((colTotals[colTotals.length - 1] ?? 0) + (colTotals[colTotals.length - 2] ?? 0))} ราย</>,
  ]

  const interesting = view === 'freq_recency' ? [
    { dot: 'text-blue-600',    text: <>เซลล์ใหญ่ที่สุด: <strong>{largestLabel}</strong> — {formatNumber(largestVal)} ราย ({largestPct}%)</>, hint: '% = สัดส่วนลูกค้าในเซลล์นี้เทียบกับทั้งหมด' },
    { dot: 'text-emerald-600', text: <><strong>{formatNumber(grid.data[0][0])} champion</strong> ({((grid.data[0][0] / Math.max(1, grand)) * 100).toFixed(0)}%) — ซื้อ ≥ 3 ครั้ง และล่าสุดภายใน 30 วัน</>, hint: 'มุมบนซ้ายของ grid' },
    { dot: 'text-rose-600',    text: <><strong>{formatNumber(grid.data[2]?.[5] ?? 0)} loyal ที่กำลังหลุด</strong> ({(((grid.data[2]?.[5] ?? 0) / Math.max(1, grand)) * 100).toFixed(0)}%) — เคยซื้อบ่อยแต่เงียบเกิน 120 วัน</>, hint: 'มุมบนขวา — กลุ่มเร่งด่วนที่สุด' },
    { dot: 'text-amber-600',   text: <><strong>ลูกค้าใหม่หลุดสูง</strong> — {formatNumber(grid.data[4]?.[5] ?? 0)} ราย ซื้อครั้งเดียวแล้วเงียบเกิน 90 วัน</>, hint: 'มุมล่างขวา — น่าจะหายไปแล้ว' },
  ] : view === 'freq_spend' ? [
    { dot: 'text-blue-600',    text: <>เซลล์ใหญ่ที่สุด: <strong>{largestLabel}</strong> — {formatNumber(largestVal)} ราย ({largestPct}%)</>, hint: '% = สัดส่วนลูกค้าในเซลล์นี้' },
    { dot: 'text-emerald-600', text: <><strong>VIP มูลค่าสูง</strong> — {formatNumber(grid.data[0][grid.cols.length - 1])} ราย ซื้อ ≥ 6 ครั้ง และยอด ≥ ฿5,000</>, hint: 'มุมบนขวา — เสาหลักของรายได้' },
    { dot: 'text-amber-600',   text: <><strong>ซื้อครั้งเดียวบิลใหญ่</strong> — {formatNumber(grid.data[grid.rows.length - 1][grid.cols.length - 1])} ราย บิล ≥ ฿3,000 (VIP potential)</>, hint: 'มุมล่างขวา — เป้า win-back มูลค่าสูง' },
    { dot: 'text-blue-600',    text: <><strong>ภักดีแต่บิลเล็ก</strong> — {formatNumber(grid.data[0][0])} ราย ซื้อ ≥ 6 ครั้ง แต่ยอด ≤ ฿1,000 (upsell ได้)</>, hint: 'มุมบนซ้าย — แนะนำสินค้าระดับสูงขึ้น' },
  ] : [
    { dot: 'text-blue-600',    text: <>เซลล์ใหญ่ที่สุด: <strong>{largestLabel}</strong> — {formatNumber(largestVal)} ราย ({largestPct}%)</>, hint: '% = สัดส่วนลูกค้าในเซลล์นี้' },
    { dot: 'text-rose-600',    text: <><strong>VIP เงียบ</strong> — {formatNumber(grid.data[0][grid.cols.length - 1])} ราย ({((grid.data[0][grid.cols.length - 1] / Math.max(1, grand)) * 100).toFixed(0)}%) ยอดสูงแต่เงียบเกิน 120 วัน</>, hint: 'มุมบนขวา — เร่งด่วน ROI สูงสุด' },
    { dot: 'text-emerald-600', text: <><strong>VIP active</strong> — {formatNumber(grid.data[0][0])} ราย ({((grid.data[0][0] / Math.max(1, grand)) * 100).toFixed(0)}%) ยอดสูงและซื้อใน 30 วัน</>, hint: 'มุมบนซ้าย — รักษาให้ดี' },
    { dot: 'text-amber-600',   text: <><strong>ระดับกลาง</strong> ({grid.rows[3]?.key}) กำลังหลุด — เงียบ 91-180 วัน</>, hint: 'แถวกลาง × คอลัมน์ก่อนสุดท้าย — จะกลายเป็น VIP เงียบ ถ้าไม่ทำอะไร' },
  ]

  const actions = view === 'spend_recency'
    ? [<>โทรหา VIP เงียบวันนี้ — ROI สูงสุดของการ win-back <Phone className="w-3 h-3 inline" /></>,
       <>ส่ง loyalty perks ให้ VIP active เพื่อกระชับความสัมพันธ์</>]
    : view === 'freq_spend'
      ? [<>Upsell ลูกค้าภักดีบิลเล็ก ด้วยสินค้าระดับ premium</>,
         <>Auto win-back ลูกค้าบิลใหญ่ที่ซื้อครั้งเดียว ภายใน 60 วัน</>]
      : [<>Onboard ลูกค้าซื้อครั้งเดียว ภายใน 14 วัน — coupon สำหรับ order #2</>,
         <>Re-engage loyal ที่เริ่มหลุด ด้วย personal telesale call</>]

  return (
    <section className="card p-5">
      <header className="mb-3">
        <h3 className="font-bold text-slate-900">วิธีอ่านและสิ่งที่ควรทำ</h3>
        <p className="text-xs text-slate-500">คำนวณจากเซลล์ด้านบนโดยตรง · ไม่ใช่การคาดเดา</p>
      </header>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">👁 ภาพรวม</div>
          <ul className="space-y-1 text-sm">
            {overview.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-600">•</span><span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">✨ สิ่งที่น่าสังเกต</div>
          <ul className="space-y-1.5 text-sm">
            {interesting.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className={item.dot}>•</span>
                <div>
                  <div>{item.text}</div>
                  <div className="text-[11px] text-slate-500">{item.hint}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">✅ ควรทำอะไรต่อ</div>
          <ul className="space-y-1 text-sm">
            {actions.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-rose-600">•</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100 mt-3">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">
          <DollarSign className="w-3 h-3" /> <Phone className="w-3 h-3" /> เปิดรายชื่อ →
        </button>
      </div>
    </section>
  )
}
