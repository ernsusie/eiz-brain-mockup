import { useState } from 'react'
import { BarChart3, Repeat, TrendingDown } from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

type Tab = 'repeat' | 'lost'

/**
 * Retention Analysis · Cohort page.
 *
 * Three blocks:
 *   1. Cohort heatmap (% returning) — toggle between "ที่กลับมาซื้อ"
 *      and "ที่ไม่กลับมาซื้อ" (the complement) per the user's request.
 *   2. How to read this & what to do — Thai-first.
 *   3. ยอดซื้อซ้ำต่อครั้งจากลูกค้าแต่ละเดือน — the per-visit revenue
 *      matrix from image 2.
 */
export const CohortPage = () => {
  const ws = workspaces.current()
  const [tab, setTab] = useState<Tab>('repeat')
  const [showRevenue, setShowRevenue] = useState(false)
  if (!ws) return null

  const cohorts = dataset.cohorts(ws.id).slice(-12)
  const cohortRepeat = dataset.cohortRepeatRevenue(ws.id).slice(-11)

  /* Avg retention by month-index across cohorts (excludes nulls). */
  const colAverages: number[] = []
  for (let m = 1; m <= 12; m++) {
    const vals = cohorts.map((c) => c.retention[m]).filter((v): v is number => typeof v === 'number')
    colAverages.push(vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0)
  }
  const avgM1 = colAverages[1] ?? 0
  const avgM3 = colAverages[3] ?? 0

  const heatColor = (v: number | null | undefined) => {
    if (v == null) return 'bg-white text-slate-300'
    if (v >= 8)    return 'bg-emerald-500/70 text-white'
    if (v >= 6)    return 'bg-emerald-400/60 text-emerald-900'
    if (v >= 4)    return 'bg-emerald-300/50 text-emerald-900'
    if (v >= 2)    return 'bg-amber-200/60 text-amber-900'
    return         'bg-slate-100 text-slate-700'
  }
  const lostColor = (v: number | null | undefined) => {
    if (v == null) return 'bg-white text-slate-300'
    if (v <= 92)   return 'bg-emerald-500/70 text-white'
    if (v <= 94)   return 'bg-emerald-300/50 text-emerald-900'
    if (v <= 96)   return 'bg-amber-200/60 text-amber-900'
    if (v <= 98)   return 'bg-orange-300/60 text-orange-900'
    return         'bg-rose-400/60 text-white'
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setTab('repeat')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                tab === 'repeat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <Repeat className="w-3.5 h-3.5" /> ตารางซื้อซ้ำรายรุ่น (% ที่กลับมาซื้อ)
            </button>
            <button
              onClick={() => setTab('lost')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                tab === 'lost' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <TrendingDown className="w-3.5 h-3.5" /> ตารางลูกค้าหาย (% ที่ไม่กลับมาซื้อ)
            </button>
          </div>
          <button
            onClick={() => setShowRevenue((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold',
              showRevenue
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" /> {showRevenue ? 'ซ่อนยอดขาย' : 'แสดงยอดขาย'}
          </button>
        </div>

        <header className="pt-1">
          <h3 className="font-bold text-slate-900">
            {tab === 'repeat'
              ? 'ตารางซื้อซ้ำรายรุ่น (% ที่กลับมาซื้อ)'
              : 'ตารางลูกค้าหาย (% ที่ไม่กลับมาซื้อ)'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            แต่ละแถวคือลูกค้ารุ่นที่ซื้อครั้งแรกในเดือนนั้น · แต่ละคอลัมน์คือเดือนถัดมา
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr>
                <th className="text-left p-1.5 text-slate-600 font-semibold">Cohort</th>
                <th className="text-right p-1.5 text-slate-600 font-semibold">ลูกค้า</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="text-center p-1.5 text-slate-600 font-semibold">เดือน {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row) => (
                <tr key={row.cohort}>
                  <td className="p-1.5 font-semibold tabular-nums">{row.cohort}</td>
                  <td className="text-right p-1.5 text-slate-600 tabular-nums">{formatNumber(row.customers)}</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const v = row.retention[i + 1]
                    if (tab === 'repeat') {
                      return (
                        <td key={i} className={cn('text-center p-1.5 rounded-md font-medium', heatColor(v))}>
                          {v != null ? `${v}%` : '—'}
                        </td>
                      )
                    }
                    /* Lost = 100 - retention */
                    const lost = v != null ? 100 - v : null
                    return (
                      <td key={i} className={cn('text-center p-1.5 rounded-md font-medium', lostColor(lost))}>
                        {lost != null ? `${lost}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
          <span>{tab === 'repeat' ? 'ต่ำ' : 'หายน้อย'}</span>
          {tab === 'repeat' ? (
            <>
              <span className="w-3 h-3 rounded bg-slate-100" />
              <span className="w-3 h-3 rounded bg-amber-200/60" />
              <span className="w-3 h-3 rounded bg-emerald-300/50" />
              <span className="w-3 h-3 rounded bg-emerald-400/60" />
              <span className="w-3 h-3 rounded bg-emerald-500/70" />
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded bg-emerald-500/70" />
              <span className="w-3 h-3 rounded bg-emerald-300/50" />
              <span className="w-3 h-3 rounded bg-amber-200/60" />
              <span className="w-3 h-3 rounded bg-orange-300/60" />
              <span className="w-3 h-3 rounded bg-rose-400/60" />
            </>
          )}
          <span>{tab === 'repeat' ? 'สูง' : 'หายมาก'}</span>
        </div>
      </div>

      {/* How to read */}
      <section className="card p-5 bg-blue-50 border-blue-200">
        <header className="mb-3">
          <h3 className="font-bold text-slate-900">How to read this &amp; what to do</h3>
          <p className="text-xs text-slate-500">คำนวณจากข้อมูล cohort โดยตรง · ไม่ใช่การประมาณ</p>
        </header>

        <div className="space-y-3 text-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">
              👁 ภาพรวม
            </div>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Avg M1 retention <strong>{avgM1.toFixed(1)}%</strong> — เฉลี่ยลูกค้ากลับมาซื้อภายในเดือนที่ 2
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Avg M3 retention <strong>{avgM3.toFixed(1)}%</strong> — หลัง 3 เดือนเหลือเท่านี้ของแต่ละ cohort
                </span>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">
              ✨ สิ่งที่น่าสังเกต
            </div>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <span className="text-emerald-600">•</span>
                <span>
                  {avgM1 >= 8
                    ? 'M1 retention อยู่ในเกณฑ์ดี (>8%) ของอุตสาหกรรม FMCG'
                    : avgM1 >= 5
                      ? 'M1 retention พอใช้ แต่ยังต่ำกว่าเป้า 8%'
                      : 'M1 retention ต่ำกว่าเกณฑ์มาก ต้องเริ่ม win-back ในเดือนแรก'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Cohort ใหม่กว่ามักเริ่มต้น repeat % ต่ำ — ปกติ ใช้เวลา 30-60 วันถึงจะเห็นรูปแบบ</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 mb-1">
              ✅ ควรทำอะไรต่อ
            </div>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <span className="text-rose-600">•</span>
                <span>ส่ง coupon ส่วนลด <strong>วันที่ 14 หลังซื้อครั้งแรก</strong> เพื่อ trigger M1 retention</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-600">•</span>
                <span>ส่ง onboarding LINE OA <strong>3 ข้อความใน 14 วัน</strong> สำหรับ cohort ใหม่</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-600">•</span>
                <span>ดูยอดซื้อซ้ำต่อครั้งด้านล่าง — ถ้า drop เยอะระหว่างครั้งที่ 1→2 ต้องเน้น cross-sell</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Revenue per visit table */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">ยอดซื้อซ้ำต่อครั้งจากลูกค้าแต่ละเดือน</h3>
          <p className="text-xs text-slate-500">
            แต่ละแถวคือลูกค้ารุ่นที่เริ่มซื้อในเดือนนั้น · ดูว่าแต่ละครั้งที่ซื้อยังถือลูกค้าไว้แค่ไหน
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
              <tr>
                <th rowSpan={2} className="text-left p-2 font-semibold">เดือนที่เริ่มซื้อ</th>
                <th rowSpan={2} className="text-right p-2 font-semibold">จำนวนลูกค้า</th>
                <th colSpan={7} className="text-center p-2 font-semibold border-l border-slate-200">
                  จำนวนที่เคยซื้อ Frequency Segments
                </th>
              </tr>
              <tr>
                {Array.from({ length: 7 }, (_, i) => (
                  <th key={i} className="text-right p-2 font-semibold border-l border-slate-100">
                    ครั้งที่{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohortRepeat.map((row) => (
                <tr key={row.cohort} className="hover:bg-slate-50/60">
                  <td className="p-2 font-semibold text-slate-900 whitespace-nowrap">{row.cohort}</td>
                  <td className="p-2 text-right tabular-nums">{formatNumber(row.total)}</td>
                  {row.cells.map((cell) => {
                    const empty = cell.reached === 0
                    return (
                      <td
                        key={cell.visit}
                        className={cn(
                          'p-2 align-top border-l border-slate-100 text-[10px] leading-tight',
                          empty ? 'text-slate-300' : 'bg-violet-50/40',
                        )}
                      >
                        {empty ? (
                          <span>—</span>
                        ) : (
                          <>
                            <div>ยอด: {showRevenue ? formatTHB(cell.value, { compact: true }) : formatNumber(cell.reached)}</div>
                            <div>Avg.b: {formatTHB(cell.avgBasket, { compact: true })}</div>
                            <div>%ลึก็ว: {cell.share.toFixed(2)}%</div>
                            <div>#ลูกค้า: {formatNumber(cell.reached)}</div>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5 bg-blue-50 border-blue-200">
        <header className="mb-3">
          <h3 className="font-bold text-slate-900">How to read this &amp; what to do</h3>
          <p className="text-xs text-slate-500">ข้อมูลจากตารางด้านบนโดยตรง</p>
        </header>
        <ul className="space-y-1.5 text-sm">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span><strong>ครั้งที่ 1</strong> = ลูกค้ารุ่นนั้นทุกคน · ดูเลขสูงสุด</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span><strong>ครั้งที่ 2 ↓</strong> = ลูกค้าที่กลับมาซื้อ · ดู drop จากครั้งที่ 1→2 ถ้าหลุดเยอะแสดงว่า onboarding ไม่ work</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600">•</span>
            <span>%ลึก็ว = สัดส่วนลูกค้าที่เคยถึงครั้งนั้น (จาก cohort) · ถ้าครั้งที่ 4 มี &gt;10% ถือว่า loyal</span>
          </li>
          <li className="flex gap-2">
            <span className="text-rose-600">•</span>
            <span>Avg.b เพิ่มขึ้นตามจำนวนครั้ง = สัญญาณดี ลูกค้าซื้อเยอะขึ้น · ถ้าลดลงต้องตรวจการ upsell</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
