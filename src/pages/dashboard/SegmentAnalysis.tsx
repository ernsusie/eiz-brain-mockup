import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  Tooltip,
  Treemap,
} from 'recharts'
import { LayoutGrid, Table as TableIcon, MoveRight } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import type { Customer } from '@/types'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

type RfmCell = { r: number; f: number; m: number }

/** 6 colour bands matching the legend in the attached design. */
const BAND_COLORS = {
  champion:  '#a855f7',  /* purple — ลูกค้าชั้นเยี่ยม */
  good:      '#10b981',  /* emerald — ดี */
  growing:   '#fbbf24',  /* yellow — เติบโต / ใหม่ */
  alert:     '#ec4899',  /* pink — เสี่ยง / แจ้งเตือน VIP */
  watch:     '#f97316',  /* orange — เฝ้าระวัง / เริ่มห่าง */
  lost:      '#fecaca',  /* light red — หายไป */
  inactive:  '#cbd5e1',  /* slate — ไม่ใช้งาน */
  followup:  '#06b6d4',  /* cyan — ดูแล */
} as const

type Band = keyof typeof BAND_COLORS

interface SegSpec {
  key:    string
  label:  string
  rRange: [number, number]
  fRange: [number, number]
  mRange: [number, number]
  band:   Band
}

/* 19 behavioural segments mirroring the attached design.
 * The label text follows the Thai phrasing in the image. */
const SEGS: SegSpec[] = [
  { key: 'champion_loyal',     label: 'ลูกค้าชั้นเยี่ยมที่ยังอยู่กับเรา', rRange: [4,5], fRange: [4,5], mRange: [4,5], band: 'champion' },
  { key: 'loyal_drifting',     label: 'ลูกค้าชั้นเยี่ยมที่เริ่มห่างไป',   rRange: [3,4], fRange: [4,5], mRange: [4,5], band: 'champion' },
  { key: 'big_leaving',        label: 'ลูกค้าใหญ่ที่กำลังจะหายไป',     rRange: [2,3], fRange: [3,5], mRange: [4,5], band: 'alert' },
  { key: 'big_lost',           label: 'ลูกค้าตัวที่เลิกซื้อไปแล้ว',     rRange: [1,2], fRange: [3,5], mRange: [4,5], band: 'alert' },
  { key: 'dead_first_big',     label: '(ตายแล้ว) ซื้อครั้งแรกง่ายหนัก',  rRange: [1,1], fRange: [1,1], mRange: [4,5], band: 'alert' },
  { key: 'low_freq_unsold',    label: 'กลุ่มลูกค้าที่ไม่ค่อยขาย',         rRange: [2,3], fRange: [2,3], mRange: [2,3], band: 'watch' },
  { key: 'cooling_first_big',  label: '(เริ่มห่าง) ซื้อครั้งแรกง่ายหนัก', rRange: [2,3], fRange: [1,1], mRange: [4,5], band: 'growing' },
  { key: 'mid_value_dead',     label: 'ลูกค้าที่ตายแล้วที่มียอดปานกลาง-สูง', rRange: [1,2], fRange: [1,2], mRange: [3,4], band: 'alert' },
  { key: 'potential_loyal',    label: 'มีโอกาสเป็นลูกค้าชั้นเยี่ยม',     rRange: [4,5], fRange: [2,3], mRange: [3,4], band: 'followup' },
  { key: 'warmest_first_big',  label: '(เฝ้าดู) ซื้อครั้งแรกง่ายหนัก',    rRange: [4,5], fRange: [1,1], mRange: [4,5], band: 'followup' },
  { key: 'easy_above_avg',     label: '(ดูแล) ซื้อครั้งแรกสูงกว่าปกติ',   rRange: [3,5], fRange: [1,1], mRange: [3,4], band: 'followup' },
  { key: 'first_aging',        label: 'ซื้อครั้งแรก — ห่างนาน',          rRange: [1,2], fRange: [1,1], mRange: [2,3], band: 'growing' },
  { key: 'first_cooling',      label: 'ซื้อครั้งแรก — เริ่มห่าง',         rRange: [2,3], fRange: [1,1], mRange: [2,3], band: 'followup' },
  { key: 'cust_lost',          label: 'ลูกค้าเลิกซื้อแล้ว',               rRange: [1,2], fRange: [2,3], mRange: [1,2], band: 'lost' },
  { key: 'low_value_normal',   label: '(ดูแล) ซื้อครั้งแรกง่ายปกติ',      rRange: [3,5], fRange: [1,1], mRange: [1,2], band: 'followup' },
  { key: 'lost_cheap',         label: 'ตาย (ซื้อน้อย)',                  rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'lost' },
  { key: 'aging_60_120',       label: 'ยอดต่ำกว่า 1000 ซื้อครั้งแรก 60-120 วัน', rRange: [2,3], fRange: [1,1], mRange: [1,1], band: 'watch' },
  { key: 'rare_small',         label: 'ซื้อเรื่อยจัดน้อยๆ',               rRange: [2,3], fRange: [2,3], mRange: [1,2], band: 'growing' },
  { key: 'first_small',        label: '(ดูแล) ซื้อครั้งแรกง่ายน้อย',      rRange: [4,5], fRange: [1,1], mRange: [1,1], band: 'followup' },
  { key: 'never',              label: 'ทดลอง/ดอง/ยังไม่มีการสั่งซื้อ',    rRange: [1,1], fRange: [1,1], mRange: [1,1], band: 'inactive' },
]

const LEGEND_GROUPS = [
  { band: 'champion' as const, label: 'ลูกค้าชั้นเยี่ยม / ดี' },
  { band: 'good' as const,     label: 'ดี' },
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
 * Dashboard sub-page · วิเคราะห์กลุ่มลูกค้า (RFM treemap)
 *
 * Rebuilt per attached design — colour-banded segments sized by
 * customer count. Click any tile to jump into the Customer Center
 * segment view with the segment pre-selected.
 */
export const SegmentAnalysis = () => {
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [view, setView] = useState<'tree' | 'table'>('tree')
  if (!ws) return null

  const customers = dataset.customersWithOverlay(ws.id)
  const scored = useMemo(() => scoreCustomers(customers), [customers])
  const buckets = useMemo(
    () =>
      SEGS.map((seg) => {
        const list = scored.filter((c) => matches(c, seg))
        const value = list.reduce((s, c) => s + c.totalSpend, 0)
        return { seg, count: list.length, value }
      })
        .filter((b) => b.count > 0)
        .sort((a, b) => b.count - a.count),
    [scored],
  )

  const total = scored.length || 1
  const healthy = buckets
    .filter((b) => b.seg.band === 'champion' || b.seg.band === 'good' || b.seg.band === 'followup')
    .reduce((s, b) => s + b.count, 0)
  const healthyPct = (healthy / total) * 100
  const biggest = buckets[0]

  const treemapData = buckets.map((b) => ({
    name: b.seg.label,
    size: b.count,
    fill: BAND_COLORS[b.seg.band],
    seg: b.seg,
    pct: (b.count / total) * 100,
    value: b.value,
  }))

  const handleClick = (segKey: string) => {
    navigate(`/customer-center/segments?seg=${segKey}`)
  }

  return (
    <div className="space-y-5">
      <div className="card bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 text-sm">
        <span className="text-emerald-700">🟢</span>
        <span className="text-slate-700">
          ลูกค้าสุขภาพดี <strong>{healthyPct.toFixed(0)}%</strong> ({formatNumber(healthy)} ราย) · กลุ่มใหญ่สุด:{' '}
          <strong>{biggest?.seg.label ?? '—'}</strong>{' '}
          ({formatNumber(biggest?.count ?? 0)} ราย)
        </span>
      </div>

      <div className="card bg-violet-50 border border-violet-200 px-4 py-3 flex items-center gap-2 text-sm">
        <span>✨ Casper กำลังวิเคราะห์หน้านี้…</span>
      </div>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-900">วิเคราะห์กลุ่มลูกค้า</h3>
            <p className="text-xs text-slate-500">แผนที่กลุ่มลูกค้า RFM · คลิก tile เพื่อดูรายชื่อใน Customer Center</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setView('tree')}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                  view === 'tree' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
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
        </div>

        <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500">
          <span>นานแล้ว →</span>
          <span className="font-bold text-slate-700">แผนที่กลุ่มลูกค้า RFM</span>
          <span>← เพิ่งซื้อ</span>
        </div>

        {view === 'tree' ? (
          <ResponsiveContainer width="100%" height={420}>
            <Treemap
              data={treemapData as any}
              dataKey="size"
              stroke="#fff"
              fill="#a855f7"
              content={((p: any) => <CustomTile {...p} onClick={handleClick} />) as any}
            >
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                content={(p: any) => {
                  if (!p.active || !p.payload?.[0]) return null
                  const d = p.payload[0].payload
                  return (
                    <div className="bg-white rounded-xl shadow-md p-2 text-xs border border-slate-200">
                      <div className="font-semibold text-slate-900">{d.name}</div>
                      <div className="text-slate-600">{formatNumber(d.size)} ราย · {d.pct.toFixed(1)}%</div>
                      <div className="text-slate-500">LTV: {formatTHB(d.value, { compact: true })}</div>
                    </div>
                  )
                }}
              />
            </Treemap>
          </ResponsiveContainer>
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
                {buckets.map((b) => (
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
                      <button onClick={() => handleClick(b.seg.key)}
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

        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
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
    </div>
  )
}

const CustomTile = (p: any) => {
  const { x, y, width, height, payload, name, fill } = p
  /* Recharts can pass values via either `payload` or top-level keys
   * depending on version. */
  const d = payload ?? { name }
  const showLabel = width > 60 && height > 40
  const showCount = width > 90 && height > 50
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => p.onClick?.(d.seg?.key)}>
      <rect x={x} y={y} width={width} height={height}
        style={{ fill: fill ?? d.fill, stroke: '#fff', strokeWidth: 2 }} />
      {showLabel && (
        <text x={x + 6} y={y + 14} fontSize={10} fill="#0f172a" fontWeight={500}>
          {(d.name || '').length > Math.floor(width / 6)
            ? (d.name || '').slice(0, Math.floor(width / 6) - 1) + '…'
            : d.name}
        </text>
      )}
      {showCount && (
        <>
          <text x={x + 6} y={y + height - 22} fontSize={12} fill="#0f172a" fontWeight={700}>
            {formatNumber(d.size)}
          </text>
          <text x={x + 6} y={y + height - 8} fontSize={9} fill="#475569">
            {(d.pct ?? 0).toFixed(1)}%
          </text>
        </>
      )}
    </g>
  )
}
