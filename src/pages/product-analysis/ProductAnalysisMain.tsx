import { useMemo, useState } from 'react'
import {
  Layer,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from 'recharts'
import { Link as LinkIcon, Trophy, Workflow } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

type Metric = 'count' | 'revenue'

export const ProductAnalysisMain = () => {
  const ws = workspaces.current()
  const [showMatrix, setShowMatrix] = useState(true)
  const [metric, setMetric] = useState<Metric>('count')
  if (!ws) return null
  const top20 = dataset.top20Popular(ws.id)
  const coPurchase = dataset.coPurchase(ws.id)
  const sankey = dataset.productSankey(ws.id)
  const maxRevenue = top20[0]?.revenue ?? 1

  /* Recharts Sankey reads `value` on each link — remap based on the
   *  metric toggle so the same data structure serves both views. */
  const sankeyData = useMemo(() => ({
    nodes: sankey.nodes,
    links: sankey.links.map((l) => ({
      source: l.source,
      target: l.target,
      value:  metric === 'count' ? l.value : l.revenue,
    })),
  }), [sankey, metric])

  return (
    <div className="space-y-6">
      <PageInsight
        kind="info"
        title="ข้อสังเกตจาก Product Analysis"
        items={[
          <>
            Sankey ด้านล่างแสดง <strong>journey</strong> ของลูกค้า — ซื้อสินค้า A แล้วซื้ออะไรต่อ
            สลับมุมมองระหว่าง <strong>จำนวนลูกค้า</strong> กับ <strong>ยอดขาย</strong> ได้
          </>,
          <>
            Co-purchase matrix ช่วยหาคู่ที่ขายดีพร้อมกัน — ใช้สร้าง bundle / cross-sell campaign
          </>,
        ]}
      />

      {/* Cross-product Sankey */}
      <section className="story-section">
        <div className="story-header">
          <Workflow className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">พฤติกรรมการซื้อข้ามสินค้า — Cross-product Journey</h2>
          <span className="story-sub">ลูกค้าซื้อสินค้า A แล้วซื้ออะไรต่อ · เลือกหน่วยวัด</span>
        </div>
        <div className="card tone-product p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setMetric('count')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold',
                  metric === 'count' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                จำนวนลูกค้า
              </button>
              <button
                onClick={() => setMetric('revenue')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold',
                  metric === 'revenue' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                ยอดขาย
              </button>
            </div>
            <span className="text-xs text-slate-500">ซ้าย = สินค้าที่ซื้อแรก · ขวา = สินค้าที่ซื้อถัดไป</span>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <Sankey
              data={sankeyData}
              node={(<SankeyNode metric={metric} />) as any}
              nodePadding={18}
              margin={{ top: 12, right: 120, bottom: 12, left: 12 }}
              link={{ stroke: '#a855f7', strokeOpacity: 0.25, fill: '#a855f7', fillOpacity: 0.18 } as any}
            >
              <Tooltip
                content={(p: any) => {
                  if (!p.active || !p.payload?.[0]) return null
                  const link = p.payload[0]
                  return (
                    <div className="bg-white rounded-xl shadow-md p-2 text-xs border border-slate-200">
                      <div className="font-semibold text-slate-900">
                        {sankey.nodes[link.payload?.source?.index ?? 0]?.name} →{' '}
                        {sankey.nodes[link.payload?.target?.index ?? 0]?.name}
                      </div>
                      <div className="text-slate-600">
                        {metric === 'count' ? `${formatNumber(link.value)} ราย` : formatTHB(link.value, { compact: true })}
                      </div>
                    </div>
                  )
                }}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Co-purchase matrix */}
      <section className="story-section">
        <div className="story-header">
          <LinkIcon className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">เมทริกซ์สินค้าที่ซื้อร่วมกัน</h2>
          <span className="story-sub">
            ตัวเลข = จำนวนลูกค้าที่ซื้อทั้ง 2 สินค้า · เซลล์เขียวเข้ม = คู่ขายดี (ทำ bundle ได้)
          </span>
        </div>

        <div className="card tone-product p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-500">
              สินค้า {coPurchase.products.length} ตัว · เลื่อนเพื่อดูทั้งหมด
            </div>
            <button
              onClick={() => setShowMatrix((s) => !s)}
              className="text-xs text-violet-700 hover:underline"
            >
              {showMatrix ? 'ซ่อนเมทริกซ์' : 'แสดงเมทริกซ์'}
            </button>
          </div>
          {showMatrix && <CoPurchaseMatrix data={coPurchase} />}
        </div>
      </section>

      {/* Top 20 Popular */}
      <section className="story-section">
        <div className="story-header">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="story-title">สินค้ายอดนิยม Top 20</h2>
          <span className="story-sub">
            เรียงตามรายได้ · ดู &quot;ซื้อเดียว&quot; — ยิ่งสูงยิ่งควรทำ bundle
          </span>
        </div>

        <div className="card tone-revenue overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60 text-xs text-slate-600">
                <tr>
                  <th className="text-center px-3 py-2.5 font-semibold w-10">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold">สินค้า</th>
                  <th className="text-right px-3 py-2.5 font-semibold">รายได้</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ออเดอร์</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ซื้อเดียว</th>
                  <th className="text-left px-3 py-2.5 font-semibold w-40">สัดส่วนรายได้</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((p, i) => (
                  <tr key={p.id} className="border-t border-brand-100/30 hover:bg-white/60">
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                          i < 3
                            ? 'bg-brand-500 text-white'
                            : i < 10
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-md truncate font-medium text-slate-800">{p.name}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-brand-700">{formatTHB(p.revenue, { compact: true })}</td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.customers)}</td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.orders)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">{formatNumber(p.singleBuyCount)}</span>
                        {p.singleBuyPct >= 50 && (
                          <span className="chip bg-rose-100 text-rose-700 text-[10px]">{p.singleBuyPct}%</span>
                        )}
                        {p.singleBuyPct < 50 && p.singleBuyPct >= 25 && (
                          <span className="chip bg-amber-100 text-amber-700 text-[10px]">{p.singleBuyPct}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-400 to-coral-500"
                          style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

const SankeyNode = ({ x, y, width, height, index, payload, metric }: any) => {
  const isSrc = index < ((payload?.totalNodes ?? 12) / 2)
  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isSrc ? '#7c3aed' : '#a855f7'}
        fillOpacity={0.85}
      />
      <text
        x={x + width + 6}
        y={y + height / 2}
        textAnchor="start"
        dy={4}
        fontSize={11}
        fill="#0f172a"
      >
        {payload?.name}
      </text>
      <text
        x={x + width + 6}
        y={y + height / 2 + 14}
        textAnchor="start"
        fontSize={9}
        fill="#64748b"
      >
        {metric === 'count' ? `${formatNumber(payload?.value ?? 0)} ราย` : formatTHB(payload?.value ?? 0, { compact: true })}
      </text>
    </Layer>
  )
}

const CoPurchaseMatrix = ({
  data,
}: {
  data: { products: { id: string; name: string }[]; matrix: number[][] }
}) => {
  const { products, matrix } = data
  const max = Math.max(...matrix.flat(), 1)

  const cellColor = (v: number) => {
    if (v === 0) return { bg: 'transparent', fg: '#cbd5e1' }
    const t = v / max
    if (t >= 0.5) return { bg: 'rgba(16, 185, 129, 0.85)', fg: 'white' }
    if (t >= 0.25) return { bg: 'rgba(16, 185, 129, 0.45)', fg: '#065f46' }
    if (t >= 0.1) return { bg: 'rgba(16, 185, 129, 0.18)', fg: '#0f766e' }
    return { bg: 'rgba(148, 163, 184, 0.12)', fg: '#475569' }
  }
  const short = (s: string, n = 14) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

  return (
    <div className="overflow-auto max-w-full">
      <table className="text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 p-1 text-left w-40 max-w-40" />
            {products.map((p, i) => (
              <th key={p.id} className="p-1 align-bottom min-w-[28px]" title={p.name}>
                <div
                  className="text-[9px] text-slate-500 font-medium whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '100px' }}
                >
                  {i + 1}. {short(p.name, 18)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((row, i) => (
            <tr key={row.id}>
              <td
                className="sticky left-0 bg-white z-10 p-1 pr-2 font-medium text-slate-700 text-[10px] whitespace-nowrap truncate w-40 max-w-40"
                title={row.name}
              >
                {i + 1}. {short(row.name, 22)}
              </td>
              {products.map((col, j) => {
                if (i === j) return (
                  <td key={col.id} className="border border-white text-center text-slate-300 bg-slate-50">—</td>
                )
                const v = matrix[i][j]
                const { bg, fg } = cellColor(v)
                return (
                  <td
                    key={col.id}
                    className="border border-white text-center font-semibold transition-transform hover:scale-110 hover:z-10 relative cursor-default"
                    style={{ background: bg, color: fg, minWidth: 28, height: 24 }}
                    title={`${row.name} × ${col.name}: ${v}`}
                  >
                    {v > 0 ? v : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
