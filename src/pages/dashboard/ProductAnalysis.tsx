import { useState } from 'react'
import { AlertTriangle, Link as LinkIcon, RefreshCcw, Trophy } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

/**
 * Dashboard sub-page · Product Analysis
 *
 * Sibling to Products. Surfaces three deeper lenses:
 *  - Top 20 popular table with single-buy alert
 *  - Co-purchase matrix (bundle candidates)
 *  - High-return product watch
 */
export const ProductAnalysis = () => {
  const ws = workspaces.current()
  const [showMatrix, setShowMatrix] = useState(true)
  if (!ws) return null
  const products = dataset.products(ws.id)
  const top20 = dataset.top20Popular(ws.id)
  const coPurchase = dataset.coPurchase(ws.id)
  const highReturn = products.filter((p) => p.returnRate > 4)
  const maxRevenue = top20[0]?.revenue ?? 1

  return (
    <div className="space-y-6">
      {/* Top 20 Popular */}
      <section className="story-section">
        <div className="story-header">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="story-title">สินค้ายอดนิยม Top 20</h2>
          <span className="story-sub">
            จัดอันดับตามรายได้ · สังเกตอัตรา &quot;ซื้อเดียว&quot; — ยิ่งสูงยิ่งควรทำ bundle
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
                  <tr
                    key={p.id}
                    className="border-t border-brand-100/30 hover:bg-white/60"
                  >
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
                    <td className="px-4 py-2.5 max-w-md truncate font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-brand-700">
                      {formatTHB(p.revenue, { compact: true })}
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.customers)}</td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(p.orders)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">
                          {formatNumber(p.singleBuyCount)}
                        </span>
                        {p.singleBuyPct >= 50 && (
                          <span className="chip bg-rose-100 text-rose-700 text-[10px]">
                            {p.singleBuyPct}%
                          </span>
                        )}
                        {p.singleBuyPct < 50 && p.singleBuyPct >= 25 && (
                          <span className="chip bg-amber-100 text-amber-700 text-[10px]">
                            {p.singleBuyPct}%
                          </span>
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

        <div className="card tone-customer p-4 mt-3">
          <div className="text-sm text-slate-700">
            💡 <strong>ข้อสังเกต:</strong> สินค้าที่มี &quot;ซื้อเดียว&quot; สูง (
            <span className="chip bg-rose-100 text-rose-700 text-[10px]">≥ 50%</span>)
            แปลว่าลูกค้าซื้อแล้วไม่ต่อ — ควรทำ <strong>bundle</strong> หรือ{' '}
            <strong>cross-sell campaign</strong> เพื่อกระตุ้นการซื้อร่วมกับสินค้าอื่น
          </div>
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

      {/* High-return alert */}
      {highReturn.length > 0 && (
        <section className="story-section">
          <div className="story-header">
            <RefreshCcw className="w-5 h-5 text-rose-600" />
            <h2 className="story-title">สินค้าคืนสูง — High Return Watch</h2>
            <span className="story-sub">มากกว่า 4% ต้องตรวจคุณภาพ / packaging</span>
          </div>

          <div className="card tone-risk p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highReturn.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-amber-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Return rate <strong className="text-rose-600">{p.returnRate}%</strong>{' '}
                      · เสียโอกาส ~{formatTHB(p.returns * p.asp, { compact: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-amber-900 bg-amber-50/60 rounded-xl p-3 border border-amber-100">
              💡 <strong>แนะนำ:</strong> ตรวจ packaging + รีวิวจากลูกค้า + คุยกับ supplier
              ภายใน 7 วัน
            </div>
          </div>
        </section>
      )}
    </div>
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
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    height: '100px',
                  }}
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
                if (i === j) {
                  return (
                    <td
                      key={col.id}
                      className="border border-white text-center text-slate-300 bg-slate-50"
                    >
                      —
                    </td>
                  )
                }
                const v = matrix[i][j]
                const { bg, fg } = cellColor(v)
                return (
                  <td
                    key={col.id}
                    className="border border-white text-center font-semibold transition-transform hover:scale-110 hover:z-10 relative cursor-default"
                    style={{
                      background: bg,
                      color: fg,
                      minWidth: 28,
                      height: 24,
                    }}
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

      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span>ความถี่ที่ซื้อร่วมกัน:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200" /> 0
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.18)' }} /> น้อย
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.45)' }} /> ปานกลาง
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.85)' }} /> สูง (Bundle candidate)
        </div>
      </div>
    </div>
  )
}
