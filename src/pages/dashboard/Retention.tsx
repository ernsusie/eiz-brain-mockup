import { Repeat, Heart, RefreshCcw, TrendingUp } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

export const Retention = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const cohorts = dataset.cohorts(ws.id)
  const customers = dataset.customersWithOverlay(ws.id)
  const returnReasons = dataset.returnReasons(ws.id)

  const repeatRate =
    (customers.filter((c) => c.orders > 1).length / customers.length) * 100
  const championShare =
    (customers.filter((c) => c.status === 'champion').length / customers.length) * 100

  // Avg M1 retention across recent cohorts (excluding incomplete latest)
  const m1Rates = cohorts
    .map((c) => c.retention[1])
    .filter((v): v is number => typeof v === 'number')
  const avgM1 = m1Rates.length ? m1Rates.reduce((s, v) => s + v, 0) / m1Rates.length : 0

  return (
    <div className="space-y-6">
      {/* Chapter 1 — Retention overview */}
      <section className="story-section">
        <div className="story-header">
          <Repeat className="w-5 h-5 text-pink-600" />
          <h2 className="story-title">การกลับมาซื้อซ้ำ — Retention</h2>
          <span className="story-sub">วัดว่า cohort ลูกค้าใหม่กลับมาซื้อในเดือนต่อไปแค่ไหน</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RetStat tone="retention" label="Repeat Rate" value={`${repeatRate.toFixed(1)}%`} sub="ลูกค้าซื้อ ≥ 2 ครั้ง" />
          <RetStat tone="retention" label="Avg M1 Retention" value={`${avgM1.toFixed(1)}%`} sub="กลับมาซื้อในเดือนที่ 2" />
          <RetStat tone="customer" label="Champion Share" value={`${championShare.toFixed(1)}%`} sub="VIP ของแบรนด์" />
          <RetStat tone="risk" label="Return Rate (สินค้า)" value="2.0%" sub="ทุกช่องทาง" />
        </div>
      </section>

      {/* Chapter 2 — Cohort heatmap */}
      <section className="story-section">
        <div className="story-header">
          <Heart className="w-5 h-5 text-pink-600" />
          <h2 className="story-title">Cohort Retention Heatmap</h2>
          <span className="story-sub">% ลูกค้าจาก cohort เริ่มต้น ที่ยังกลับมาซื้อในเดือนถัด ๆ ไป</span>
        </div>

        <div className="card tone-retention p-5 overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left p-1.5 text-slate-600 font-semibold">Cohort</th>
                <th className="text-right p-1.5 text-slate-600 font-semibold">ลูกค้า</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="text-center p-1.5 text-slate-600 font-semibold">
                    เดือน {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.slice(-10).map((row) => (
                <tr key={row.cohort}>
                  <td className="p-1.5 font-semibold">{row.cohort}</td>
                  <td className="text-right p-1.5 text-slate-600">
                    {formatNumber(row.customers)}
                  </td>
                  {Array.from({ length: 10 }, (_, i) => {
                    const v = row.retention[i + 1]
                    return (
                      <td
                        key={i}
                        className={cn(
                          'text-center p-1.5 rounded-md font-medium',
                          v == null
                            ? 'text-slate-300'
                            : v >= 8
                              ? 'bg-emerald-500/70 text-white'
                              : v >= 6
                                ? 'bg-emerald-400/60 text-emerald-900'
                                : v >= 4
                                  ? 'bg-emerald-300/50 text-emerald-900'
                                  : v >= 2
                                    ? 'bg-amber-200/60 text-amber-900'
                                    : 'bg-slate-100 text-slate-700',
                        )}
                      >
                        {v != null ? `${v}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
            <span>Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100" /> &lt; 2%
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-200/60" /> 2-4%
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-300/50" /> 4-6%
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-400/60" /> 6-8%
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500/70" /> &gt; 8%
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3 — Return analysis */}
      <section className="story-section">
        <div className="story-header">
          <RefreshCcw className="w-5 h-5 text-rose-600" />
          <h2 className="story-title">การคืนสินค้า — Returns Analysis</h2>
          <span className="story-sub">เหตุผลที่ลูกค้าคืนสินค้า / ยกเลิกออเดอร์</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card tone-risk p-5">
            <div className="font-semibold text-slate-900 mb-3">เหตุผลการคืน</div>
            <div className="space-y-3">
              {returnReasons.map((r, i) => (
                <div key={r.reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">
                      {i + 1}. {r.reason}
                    </span>
                    <span className="font-bold text-rose-700">{r.share.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-300 to-rose-500"
                      style={{ width: `${r.share * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card tone-retention p-5">
            <div className="font-semibold text-slate-900 mb-3">วิธีลด return rate</div>
            <div className="space-y-2 text-sm">
              {[
                { num: 1, t: 'ของไม่ตรงปก', a: 'ปรับรูป + รีวิวจริงในหน้าเพจ + วิดีโอ unbox' },
                { num: 2, t: 'จัดส่งช้า', a: 'ต่อรองกับขนส่ง + บอก ETA ชัดเจน + reminder อัตโนมัติ' },
                { num: 3, t: 'หีบห่อชำรุด', a: 'ปรับ packaging + ตรวจคุณภาพก่อนส่ง' },
                { num: 4, t: 'ใกล้หมดอายุ', a: 'FIFO inventory + clear stock ก่อน 3 เดือน' },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {s.num}
                  </span>
                  <div>
                    <span className="font-semibold">{s.t}:</span>{' '}
                    <span className="text-slate-700">{s.a}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 4 — Insight */}
      <div className="card tone-customer p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-800 mb-2">📈 ข้อสังเกตจาก Retention</div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>
                Avg M1 retention <strong>{avgM1.toFixed(1)}%</strong> —{' '}
                {avgM1 >= 8
                  ? 'อยู่ในเกณฑ์ดี (>8%) สำหรับ industry นี้'
                  : avgM1 >= 5
                    ? 'พอใช้ ต้องเพิ่มการดูแลใน M1'
                    : 'ต่ำกว่าเป้า ควรเริ่ม win-back campaign'}
              </li>
              <li>
                Champion share <strong>{championShare.toFixed(1)}%</strong> —
                เป็น base ที่สำคัญ ใช้สร้าง lookalike + referral
              </li>
              <li>
                แนะนำ: ส่งโค้ดส่วนลด <strong>วันที่ 14 หลังซื้อครั้งแรก</strong> เพื่อ trigger M1
                และส่ง onboarding LINE ภายใน 24 ชั่วโมงแรก
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const RetStat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: 'retention' | 'customer' | 'risk' | 'revenue'
}) => (
  <div className={`card p-4 tone-${tone}`}>
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
  </div>
)
