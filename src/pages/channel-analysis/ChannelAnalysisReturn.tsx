import { RefreshCcw } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

export const ChannelAnalysisReturn = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const channelSplit = dataset.channelReturnSplit(ws.id)
  const total = channelSplit.reduce((s, c) => s + c.completed + c.cancelled + c.returned, 0)
  const totalReturn = channelSplit.reduce((s, c) => s + c.returned, 0)
  const totalCancel = channelSplit.reduce((s, c) => s + c.cancelled, 0)
  const overallRate = (totalReturn / Math.max(1, total)) * 100
  const worstChannel = [...channelSplit].sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="space-y-5">
      <PageInsight
        kind="warning"
        title="ข้อสังเกตจาก Channel Return"
        items={[
          <>
            Return rate รวม <strong>{overallRate.toFixed(2)}%</strong> — ช่องทางอันตรายที่สุด:{' '}
            <strong>{worstChannel?.channel}</strong> ({worstChannel?.rate.toFixed(2)}%)
          </>,
          <>
            ยกเลิก <strong>{formatNumber(totalCancel)}</strong> orders · คืน <strong>{formatNumber(totalReturn)}</strong> orders
          </>,
        ]}
      />

      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900">Returns &amp; Cancellations by Channel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-2 px-5 font-semibold">Channel</th>
                <th className="text-right py-2 px-3 font-semibold">Completed</th>
                <th className="text-right py-2 px-3 font-semibold">Cancelled</th>
                <th className="text-right py-2 px-3 font-semibold">Returned</th>
                <th className="text-right py-2 px-5 font-semibold">Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channelSplit.map((c) => (
                <tr key={c.channel} className="hover:bg-slate-50">
                  <td className="py-2.5 px-5">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      {c.channel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatNumber(c.completed)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-amber-700">{formatNumber(c.cancelled)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-700 font-bold">{formatNumber(c.returned)}</td>
                  <td className="py-2.5 px-5 text-right font-bold">
                    <span className={cn(
                      'chip',
                      c.rate > 4 ? 'bg-rose-100 text-rose-700' : c.rate > 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                    )}>
                      {c.rate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
