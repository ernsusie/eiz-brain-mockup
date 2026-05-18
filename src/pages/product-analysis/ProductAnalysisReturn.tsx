import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

/**
 * Product Analysis · Return sub-tab.
 *
 * Pulled out of the main page per feedback. Surfaces the high-return
 * product watch + a wider top-returned-products table for QA work.
 */
export const ProductAnalysisReturn = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const products = dataset.products(ws.id)
  const top = dataset.topReturnedProducts(ws.id)
  const highReturn = products.filter((p) => p.returnRate > 4)
  const totalLost = top.reduce((s, p) => s + p.lost, 0)

  return (
    <div className="space-y-5">
      <PageInsight
        kind="warning"
        title="ข้อสังเกตจาก Product Return"
        items={[
          <>
            สินค้าที่ return rate &gt; 4% มี <strong>{highReturn.length}</strong> SKU — ต้องตรวจคุณภาพ / packaging
          </>,
          <>
            มูลค่าที่เสียไปจาก return รวม <strong>{formatTHB(totalLost, { compact: true })}</strong>
          </>,
        ]}
      />

      {highReturn.length > 0 && (
        <section className="story-section">
          <div className="story-header">
            <RefreshCcw className="w-5 h-5 text-rose-600" />
            <h2 className="story-title">สินค้าคืนสูง — High Return Watch</h2>
            <span className="story-sub">มากกว่า 4% ต้องตรวจคุณภาพ / packaging</span>
          </div>

          <div className="card tone-risk p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highReturn.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-amber-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      Return rate <strong className="text-rose-600">{p.returnRate}%</strong>{' '}
                      · เสียโอกาส ~{formatTHB(p.returns * p.asp, { compact: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-amber-900 bg-amber-50/60 rounded-xl p-3 border border-amber-100">
              💡 <strong>แนะนำ:</strong> ตรวจ packaging + รีวิวจากลูกค้า + คุยกับ supplier ภายใน 7 วัน
            </div>
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900">Top Returned Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-5 font-semibold">Product</th>
                <th className="text-right py-2 px-3 font-semibold">Return</th>
                <th className="text-right py-2 px-5 font-semibold">Lost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-5 font-medium text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-bold">{formatNumber(p.returned)}</td>
                  <td className="py-2.5 px-5 text-right tabular-nums">{formatTHB(p.lost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
