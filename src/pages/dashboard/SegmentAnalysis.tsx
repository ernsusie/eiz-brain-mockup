import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ArrowRight, LayoutGrid, Phone, Table as TableIcon, MoveRight, Sparkles, Users } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

type RfmCell = { r: number; f: number; m: number }

const BAND_COLORS = {
  champion:  '#a855f7',  /* purple — ลูกค้าชั้นเยี่ยม */
  good:      '#10b981',  /* emerald — ดี */
  growing:   '#fbbf24',  /* yellow — เติบโต / ใหม่ */
  alert:     '#f87171',  /* red-ish — เสี่ยง / แจ้งเตือน VIP */
  watch:     '#fb923c',  /* orange — เฝ้าระวัง / เริ่มห่าง */
  lost:      '#fda4af',  /* pink — หายไป */
  inactive:  '#cbd5e1',  /* slate — ไม่ใช้งาน */
  followup:  '#7dd3fc',  /* sky — ดูแล */
} as const

type Band = keyof typeof BAND_COLORS

interface SegSpec {
  key:    string
  label:  string
  rRange: [number, number]
  fRange: [number, number]
  mRange: [number, number]
  band:   Band
  /** Position in the 5-col map grid (1-indexed). */
  col:    number
  row:    number
  rowSpan?: number
}

/* Hand-tuned 5×6 grid layout matching the attached reference image
 * exactly. Each segment occupies one or two rows so the grid mimics
 * a treemap-style visual. The exact placement preserves the user's
 * visual mental model from the original mock. */
const SEGS: SegSpec[] = [
  /* Row 1 (top) — 4 wide cells, 1 huge purple */
  { key: 'big_lost',        label: 'ลูกค้าตัวที่เลิกซื้อไปแล้ว',     rRange: [1,2], fRange: [3,5], mRange: [4,5], band: 'alert',    col: 1, row: 1 },
  { key: 'big_leaving',     label: 'ลูกค้าใหญ่ที่กำลังจะหายไป',   rRange: [2,3], fRange: [3,5], mRange: [4,5], band: 'lost',     col: 2, row: 1 },
  { key: 'loyal_drifting',  label: 'ลูกค้าชั้นที่เริ่มห่างไป',     rRange: [3,4], fRange: [4,5], mRange: [4,5], band: 'champion', col: 3, row: 1 },
  { key: 'champion_loyal',  label: 'ลูกค้าชั้นเยี่ยมที่ยังอยู่กับเรา', rRange: [4,5], fRange: [4,5], mRange: [4,5], band: 'champion', col: 4, row: 1, rowSpan: 2 },
  /* Row 2 */
  { key: 'dead_first_big',  label: '(ตายแล้ว) ซื้อครั้งแรกง่ายหนัก',  rRange: [1,1], fRange: [1,1], mRange: [4,5], band: 'alert',    col: 1, row: 2 },
  { key: 'low_freq_unsold', label: 'กลุ่มลูกค้าที่ไม่ค่อยขาย',         rRange: [2,3], fRange: [2,3], mRange: [2,3], band: 'lost',     col: 2, row: 2 },
  { key: 'cooling_first_big', label: '(เริ่มห่าง) ซื้อครั้งแรกง่ายหนัก', rRange: [2,3], fRange: [1,1], mRange: [4,5], band: 'growing',  col: 3, row: 2 },
  { key: 'easy_above_avg',  label: '(เฝ้าดู) ซื้อครั้งแรกง่ายหนัก',    rRange: [4,5], fRange: [1,1], mRange: [4,5], band: 'followup', col: 5, row: 1, rowSpan: 2 },
  /* Row 3 */
  { key: 'mid_value_dead',  label: 'ลูกค้าที่ตายแล้วที่มียอดปานกลาง-สูง', rRange: [1,2], fRange: [1,2], mRange: [3,4], band: 'lost',     col: 1, row: 3 },
  { key: 'potential_loyal', label: 'มีโอกาสเป็นลูกค้าชั้นเยี่ยม',     rRange: [4,5], fRange: [2,3], mRange: [3,4], band: 'champion', col: 3, row: 3 },
  { key: 'first_warmest',   label: '(ดูแล) ซื้อครั้งแรกสูงกว่าปกติ',  rRange: [3,5], fRange: [1,1], mRange: [3,4], band: 'followup', col: 4, row: 3 },
  /* Row 4 */
  { key: 'cust_lost',       label: 'ลูกค้าเลิกซื้อไปแล้ว',           rRange: [1,2], fRange: [2,3], mRange: [1,2], band: 'lost',     col: 1, row: 4 },
  { key: 'first_aging',     label: 'ซื้อครั้งแรก — ห่างนาน',          rRange: [1,2], fRange: [1,1], mRange: [2,3], band: 'growing',  col: 2, row: 4 },
  { key: 'first_cooling',   label: 'ซื้อครั้งแรก — เริ่มห่าง',         rRange: [2,3], fRange: [1,1], mRange: [2,3], band: 'followup', col: 3, row: 4 },
  { key: 'low_normal',      label: '(ดูแล) ซื้อครั้งแรกง่ายปกติ',     rRange: [3,5], fRange: [1,1], mRange: [1,2], band: 'followup', col: 4, row: 4 },
  /* Row 5 */
  { key: 'dead_cheap',      label: 'ตาย (ซื้อน้อย)',                  rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'lost',     col: 1, row: 5 },
  { key: 'aging_60_120',    label: 'ยอดต่ำกว่า 1000 ซื้อครั้งแรก 60-120 วัน (มียอดกลับได้)', rRange: [2,3], fRange: [1,1], mRange: [1,1], band: 'watch', col: 2, row: 5 },
  { key: 'rare_small',      label: 'ซื้อเรื่อยจัดน้อยๆ',               rRange: [2,3], fRange: [2,3], mRange: [1,2], band: 'growing',  col: 3, row: 5 },
  { key: 'first_small',     label: '(ดูแล) ซื้อครั้งแรกง่ายน้อย',      rRange: [4,5], fRange: [1,1], mRange: [1,1], band: 'followup', col: 4, row: 5 },
  /* Row 6 — bottom-right corner */
  { key: 'never',           label: 'ทดลอง/ดอง/ยังไม่มีการสั่งซื้อ',    rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'inactive', col: 5, row: 6 },
]

const LEGEND_GROUPS = [
  { band: 'champion' as const, label: 'ลูกค้าชั้นเยี่ยม / ขั้นดี' },
  { band: 'growing' as const,  label: 'เติบโต / ใหม่' },
  { band: 'alert' as const,    label: 'เสี่ยง / แจ้งเตือน VIP' },
  { band: 'watch' as const,    label: 'เฝ้าระวัง / เริ่มห่าง' },
  { band: 'lost' as const,     label: 'หายไป / ไม่ใช้งาน' },
]

const scoreCustomers = (customers: Customer[]): (Customer & RfmCell)[] => {
  if (customers.length === 0) return []
  const today = Date.now()
  const recDays = customers.map((c) => (today - new Date(c.lastBuy).getTime()) / 86400_000)
  const freq    = customers.map((c) => c.orders)
  const money   = customers.map((c) => c.totalSpend)
  const quintile = (v: number, sorted: number[], reverse = false) => {
    const idx = sorted.findIndex((x) => x >= v)
    const pct = idx / Math.max(1, sorted.length - 1)
    const q = Math.min(5, Math.max(1, Math.ceil(pct * 5)))
    return reverse ? 6 - q : q
  }
  const sR = [...recDays].sort((a, b) => a - b)
  const sF = [...freq].sort((a, b) => a - b)
  const sM = [...money].sort((a, b) => a - b)
  return customers.map((c, i) => ({
    ...c,
    r: quintile(recDays[i], sR, true),
    f: quintile(freq[i], sF),
    m: quintile(money[i], sM),
  }))
}

const matches = (c: Customer & RfmCell, s: SegSpec): boolean =>
  c.r >= s.rRange[0] && c.r <= s.rRange[1] &&
  c.f >= s.fRange[0] && c.f <= s.fRange[1] &&
  c.m >= s.mRange[0] && c.m <= s.mRange[1]

/**
 * Dashboard sub-page · วิเคราะห์กลุ่มลูกค้า (RFM map)
 *
 * Rebuilt with a deterministic 5×6 CSS grid matching the user's
 * reference design. The Recharts Treemap version was unreliable —
 * sizes flickered and labels disappeared under some viewport widths.
 * This version pins each segment to a fixed col/row so the layout
 * is stable and the labels always show.
 */
export const SegmentAnalysis = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [view, setView] = useState<'map' | 'table'>('map')
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const statusBuckets = dataset.customerStatusBuckets(ws.id)
  const patternBuckets = dataset.purchasePattern(ws.id)
  const scored = useMemo(() => scoreCustomers(customers), [customers])

  const buckets = useMemo(
    () =>
      SEGS.map((seg) => {
        const list = scored.filter((c) => matches(c, seg))
        const value = list.reduce((s, c) => s + c.totalSpend, 0)
        return { seg, count: list.length, value }
      }),
    [scored],
  )

  const total = scored.length || 1
  const healthy = buckets
    .filter((b) => ['champion', 'good', 'followup'].includes(b.seg.band))
    .reduce((s, b) => s + b.count, 0)
  const healthyPct = (healthy / total) * 100
  const biggest = [...buckets].sort((a, b) => b.count - a.count)[0]

  const handleClick = (segKey: string, label: string) => {
    navigate(
      `/customer-center/segments?seg=${segKey}&label=${encodeURIComponent(label)}`,
    )
  }

  return (
    <div className="space-y-5">
      <PageInsight
        kind="info"
        items={[
          `ลูกค้าสุขภาพดี ${healthyPct.toFixed(0)}% (${formatNumber(healthy)} ราย) · กลุ่มใหญ่สุด: ${biggest?.seg.label ?? '—'} (${formatNumber(biggest?.count ?? 0)} ราย)`,
          `ฐานลูกค้าทั้งหมด ${formatNumber(total)} ราย แบ่งเป็น ${buckets.filter((b) => b.count > 0).length} เซกเมนต์ — ควรเน้นการรักษาและขยายกลุ่ม healthy เพื่อเพิ่มรายได้`,
        ]}
      />

      {/* Shortcut to Customer Center · drill-in for action */}
      <div className="card bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">ทางลัด → Customer Center</div>
          <p className="text-xs text-slate-600">
            กดการ์ด/แถวด้านล่างเพื่อเปิด detail ของแต่ละ segment ใน Customer Center · หรือเปิดหน้า Segment Customer
            (priority-sorted, AI recommended actions, call list) ที่นี่
          </p>
        </div>
        <button
          onClick={() => navigate('/customer-center/segments')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 shrink-0"
        >
          <Phone className="w-4 h-4" /> เปิด Segment Customer <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-900">วิเคราะห์กลุ่มลูกค้า</h3>
            <p className="text-xs text-slate-500">
              แผนที่กลุ่มลูกค้า RFM · คลิก tile เพื่อดูรายชื่อใน Customer Center
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setView('map')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                view === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> แผนที่กลุ่ม
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                view === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <TableIcon className="w-3.5 h-3.5" /> ตาราง
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500">
          <span>นานแล้ว →</span>
          <span className="font-bold text-slate-700">แผนที่กลุ่มลูกค้า RFM</span>
          <span>← เพิ่งซื้อ</span>
        </div>

        {view === 'map' ? (
          <div
            className="grid grid-cols-5 gap-2"
            style={{ gridAutoRows: '78px' }}
          >
            {buckets.map(({ seg, count, value }) => {
              const pct = (count / total) * 100
              return (
                <button
                  key={seg.key}
                  onClick={() => handleClick(seg.key, seg.label)}
                  className="group rounded-2xl border border-white text-left p-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-between relative"
                  style={{
                    gridColumn: `${seg.col} / span 1`,
                    gridRow: `${seg.row} / span ${seg.rowSpan ?? 1}`,
                    background: BAND_COLORS[seg.band],
                  }}
                  title={`คลิกเพื่อเปิด ${seg.label} ใน Customer Center · ${formatNumber(count)} ราย · ${formatTHB(value, { compact: true })}`}
                >
                  <div className="text-[10px] font-medium text-slate-900/80 leading-tight line-clamp-2">
                    {seg.label}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums leading-none">
                      {formatNumber(count)}
                    </div>
                    <div className="text-[9px] text-slate-700/70 mt-0.5">{pct.toFixed(1)}%</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-slate-900/0 group-hover:text-slate-900/80 transition-colors" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Segment</th>
                  <th className="text-right py-2 px-3 font-semibold">Customers</th>
                  <th className="text-right py-2 px-3 font-semibold">%</th>
                  <th className="text-right py-2 px-3 font-semibold">LTV</th>
                  <th className="px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...buckets].sort((a, b) => b.count - a.count).map((b) => (
                  <tr key={b.seg.key} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: BAND_COLORS[b.seg.band] }} />
                        {b.seg.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatNumber(b.count)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{((b.count / total) * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-brand-700">{formatTHB(b.value, { compact: true })}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => handleClick(b.seg.key, b.seg.label)}
                        className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">
                        ดูรายชื่อ <MoveRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
          <span>← นาน (R ต่ำ)</span>
          <span>ความถี่ซื้อล่าสุด</span>
          <span>เร็ว (R สูง) →</span>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-slate-600 justify-center border-t border-slate-100 pt-3">
          {LEGEND_GROUPS.map((g) => (
            <span key={g.band} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: BAND_COLORS[g.band] }} />
              {g.label}
            </span>
          ))}
        </div>
      </section>

      {/* Bottom — สถานะลูกค้า + รูปแบบการซื้อ donuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DonutCard
          title="สถานะลูกค้า"
          sub="ดี = ซื้อสม่ำเสมอ · เฝ้าระวัง = เริ่มห่าง · วิกฤต = นานไม่ซื้อ · หายไป = ไม่กลับมาซื้อ"
          data={statusBuckets.map((b) => ({ name: b.label, value: b.count, color: b.color }))}
        />
        <DonutCard
          title="รูปแบบการซื้อ"
          data={patternBuckets.map((b) => ({ name: b.label, value: b.count, color: b.color }))}
        />
      </div>
    </div>
  )
}

const DonutCard = ({
  title,
  sub,
  data,
}: {
  title: string
  sub?:  string
  data:  { name: string; value: number; color: string }[]
}) => (
  <section className="card p-5">
    <div className="flex items-center gap-2 mb-1">
      <Sparkles className="w-4 h-4 text-violet-500" />
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    {sub && <p className="text-[11px] text-slate-500 mb-2">{sub}</p>}
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
          formatter={(v: number) => [formatNumber(v), 'ลูกค้า']}
        />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-3 justify-center text-[11px] text-slate-600 mt-2">
      {data.map((d) => (
        <span key={d.name} className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
          {d.name}
        </span>
      ))}
    </div>
  </section>
)
