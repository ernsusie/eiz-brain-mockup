import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterValue {
  range: '7d' | '30d' | '90d' | 'ytd' | 'all'
  channels: string[]
  status: string[]
  province: string
  search: string
}

export const defaultFilter: FilterValue = {
  range: '90d',
  channels: [],
  status: [],
  province: '',
  search: '',
}

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
  channels?: string[]
  statuses?: string[]
  provinces?: string[]
  compact?: boolean
}

const RANGES: { v: FilterValue['range']; label: string }[] = [
  { v: '7d', label: '7 วัน' },
  { v: '30d', label: '30 วัน' },
  { v: '90d', label: '90 วัน' },
  { v: 'ytd', label: 'YTD' },
  { v: 'all', label: 'ทั้งหมด' },
]

export const FilterBar = ({ value, onChange, channels = [], statuses = [], provinces = [], compact }: Props) => {
  const [open, setOpen] = useState(false)
  const togglePill = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

  const activeCount =
    (value.channels.length > 0 ? 1 : 0) +
    (value.status.length > 0 ? 1 : 0) +
    (value.province ? 1 : 0) +
    (value.search ? 1 : 0) +
    (value.range !== 'all' ? 1 : 0)

  return (
    <div className={cn('relative', compact && 'inline-block')}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost text-xs"
      >
        <Filter className="w-3.5 h-3.5" />
        ตัวกรอง
        {activeCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-brand-600 text-white rounded-full">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-2 left-0 w-[420px] card p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm">ตัวกรองข้อมูล</div>
              <button onClick={() => onChange(defaultFilter)} className="text-xs text-brand-600 hover:underline">
                ล้างทั้งหมด
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1.5">ช่วงเวลา</div>
                <div className="flex flex-wrap gap-1.5">
                  {RANGES.map((r) => (
                    <button
                      key={r.v}
                      onClick={() => onChange({ ...value, range: r.v })}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        value.range === r.v
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {channels.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">ช่องทาง</div>
                  <div className="flex flex-wrap gap-1.5">
                    {channels.map((c) => (
                      <button
                        key={c}
                        onClick={() => onChange({ ...value, channels: togglePill(value.channels, c) })}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          value.channels.includes(c)
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {statuses.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">สถานะลูกค้า</div>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => onChange({ ...value, status: togglePill(value.status, s) })}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          value.status.includes(s)
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {provinces.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">จังหวัด</div>
                  <select
                    className="input"
                    value={value.province}
                    onChange={(e) => onChange({ ...value, province: e.target.value })}
                  >
                    <option value="">ทุกจังหวัด</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1.5">ค้นหา</div>
                <input
                  className="input"
                  placeholder="ชื่อลูกค้า, เบอร์โทร, สินค้า..."
                  value={value.search}
                  onChange={(e) => onChange({ ...value, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {activeCount > 0 && (
        <div className="inline-flex items-center gap-1 ml-2">
          {value.range !== 'all' && (
            <Chip onClear={() => onChange({ ...value, range: 'all' })}>
              {RANGES.find((r) => r.v === value.range)?.label}
            </Chip>
          )}
          {value.channels.map((c) => (
            <Chip key={c} onClear={() => onChange({ ...value, channels: value.channels.filter((x) => x !== c) })}>
              {c}
            </Chip>
          ))}
          {value.status.map((s) => (
            <Chip key={s} onClear={() => onChange({ ...value, status: value.status.filter((x) => x !== s) })}>
              {s}
            </Chip>
          ))}
          {value.province && (
            <Chip onClear={() => onChange({ ...value, province: '' })}>
              {value.province}
            </Chip>
          )}
        </div>
      )}
    </div>
  )
}

const Chip = ({ children, onClear }: { children: React.ReactNode; onClear: () => void }) => (
  <span className="chip bg-brand-50 text-brand-700">
    {children}
    <button onClick={onClear}>
      <X className="w-3 h-3" />
    </button>
  </span>
)
