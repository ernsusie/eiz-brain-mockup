import { cn, formatNumber, formatTHB } from '@/lib/utils'

type UrgentColor = 'red' | 'orange' | 'green' | 'blue'

interface UrgentItem {
  key:        string
  color:      string         /* "red" | "orange" | … */
  icon:       string
  title:      string
  desc:       string
  count:      number
  impactBaht: number
}

interface Props {
  data: UrgentItem[]
  onClickItem?: (key: string) => void
}

const TONE: Record<UrgentColor, {
  border:   string
  iconBg:   string
  iconText: string
  chip:     string
  chipText: string
}> = {
  red:    { border: 'border-l-red-500',     iconBg: 'bg-red-100',     iconText: 'text-red-600',     chip: 'bg-red-50',     chipText: 'text-red-700' },
  orange: { border: 'border-l-orange-500',  iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  chip: 'bg-orange-50',  chipText: 'text-orange-700' },
  green:  { border: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', chip: 'bg-emerald-50', chipText: 'text-emerald-700' },
  blue:   { border: 'border-l-blue-500',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    chip: 'bg-blue-50',    chipText: 'text-blue-700' },
}

/**
 * Four colour-coded urgency cards — VIP กำลังหลุด / ลูกค้าเสี่ยงหลุด /
 * ดาวรุ่ง / ลูกค้าใหม่รอ Follow-up. Direct the operator to the highest-
 * leverage group of customers today.
 */
export const UrgentSituations = ({ data, onClickItem }: Props) => {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">สถานการณ์เร่งด่วน</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((u) => {
          const tone = TONE[(u.color as UrgentColor) ?? 'blue']
          const clickable = !!onClickItem
          const inner = (
            <>
              <div className="flex items-center gap-2">
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base', tone.iconBg, tone.iconText)}>
                  {u.icon}
                </span>
                <h3 className="font-bold text-sm text-slate-900 flex-1">{u.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{u.desc}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-full', tone.chip, tone.chipText)}>
                  กระทบ {u.impactBaht === 0 ? '฿0' : formatTHB(u.impactBaht, { compact: true })}
                </span>
                <span className="text-2xl font-bold text-slate-300 tabular-nums">{formatNumber(u.count)}</span>
              </div>
            </>
          )
          const cls = cn(
            'rounded-xl bg-white border border-slate-200 border-l-4 p-4 shadow-sm flex flex-col gap-2',
            tone.border,
            clickable && 'hover:shadow-md hover:border-slate-300 cursor-pointer text-left',
          )
          return clickable ? (
            <button key={u.key} onClick={() => onClickItem!(u.key)} className={cls}>{inner}</button>
          ) : (
            <div key={u.key} className={cls}>{inner}</div>
          )
        })}
      </div>
    </section>
  )
}
