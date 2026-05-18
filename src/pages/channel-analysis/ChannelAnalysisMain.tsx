import { useMemo, useState } from 'react'
import {
  Cell,
  Layer,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from 'recharts'
import { Workflow, BarChart3 } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'
import { PageInsight } from '@/components/PageInsight'

type Metric = 'count' | 'revenue'

export const ChannelAnalysisMain = () => {
  const ws = workspaces.current()
  const [metric, setMetric] = useState<Metric>('count')
  if (!ws) return null
  const channels = dataset.channels(ws.id)
  const sankey = dataset.channelSankey(ws.id)

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
        title="ข้อสังเกตจาก Channel Analysis"
        items={[
          <>
            ดู cross-channel journey ด้านล่าง — ลูกค้าเริ่มซื้อจาก channel A แล้วย้ายไป channel ไหน
          </>,
          <>
            สลับมุมมองได้ทั้ง <strong>จำนวนลูกค้า</strong> และ <strong>ยอดขาย</strong> เพื่อเข้าใจ acquisition value
          </>,
        ]}
      />

      {/* Cross-channel Sankey */}
      <section className="story-section">
        <div className="story-header">
          <Workflow className="w-5 h-5 text-cyan-600" />
          <h2 className="story-title">พฤติกรรมการซื้อข้ามช่องทางขาย — Cross-channel Journey</h2>
          <span className="story-sub">ลูกค้าเริ่มจาก channel ไหน · แล้วย้ายไปไหน</span>
        </div>
        <div className="card tone-product p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setMetric('count')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold',
                  metric === 'count' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                จำนวนลูกค้า
              </button>
              <button
                onClick={() => setMetric('revenue')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold',
                  metric === 'revenue' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                ยอดขาย
              </button>
            </div>
            <span className="text-xs text-slate-500">ซ้าย = channel ที่ซื้อแรก · ขวา = channel ถัดไป</span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <Sankey
              data={sankeyData}
              node={(<SankeyNode metric={metric} />) as any}
              nodePadding={20}
              margin={{ top: 12, right: 120, bottom: 12, left: 12 }}
              link={{ stroke: '#06b6d4', strokeOpacity: 0.25, fill: '#06b6d4', fillOpacity: 0.18 } as any}
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

      {/* Channel performance */}
      <section className="story-section">
        <div className="story-header">
          <BarChart3 className="w-5 h-5 text-cyan-600" />
          <h2 className="story-title">Channel Performance</h2>
          <span className="story-sub">ออเดอร์ · ลูกค้า · ยอดขาย · cancel rate ต่อ channel</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card tone-product p-5 lg:col-span-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-600 border-b border-cyan-100">
                  <th className="text-left py-2 font-semibold">Channel</th>
                  <th className="text-right py-2 font-semibold">Orders</th>
                  <th className="text-right py-2 font-semibold">Customers</th>
                  <th className="text-right py-2 font-semibold">Revenue</th>
                  <th className="text-right py-2 font-semibold">AOV</th>
                  <th className="text-right py-2 font-semibold">Cancel</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel} className="border-b border-cyan-100/40 hover:bg-white/70">
                    <td className="py-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        {c.channel}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{formatNumber(c.orders)}</td>
                    <td className="text-right tabular-nums">{formatNumber(c.customers)}</td>
                    <td className="text-right font-semibold text-cyan-700 tabular-nums">{formatTHB(c.revenue, { compact: true })}</td>
                    <td className="text-right tabular-nums">{formatTHB(Math.round(c.revenue / Math.max(1, c.orders)))}</td>
                    <td className="text-right text-rose-600 tabular-nums">{c.cancelRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card tone-product p-5">
            <div className="font-semibold mb-3">สัดส่วน channel</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={channels} dataKey="revenue" nameKey="channel" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {channels.map((c) => (
                    <Cell key={c.channel} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatTHB(v, { compact: true })} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

const SankeyNode = ({ x, y, width, height, payload, metric }: any) => (
  <Layer>
    <Rectangle x={x} y={y} width={width} height={height} fill="#06b6d4" fillOpacity={0.85} />
    <text x={x + width + 6} y={y + height / 2} textAnchor="start" dy={4} fontSize={11} fill="#0f172a">
      {payload?.name}
    </text>
    <text x={x + width + 6} y={y + height / 2 + 14} textAnchor="start" fontSize={9} fill="#64748b">
      {metric === 'count' ? `${formatNumber(payload?.value ?? 0)} ราย` : formatTHB(payload?.value ?? 0, { compact: true })}
    </text>
  </Layer>
)
