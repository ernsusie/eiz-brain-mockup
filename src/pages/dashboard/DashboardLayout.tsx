import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { AlertTriangle, X, Filter as FilterIcon } from 'lucide-react'
import { SubTabs } from '@/components/SubTabs'
import { FilterBar, FilterValue, defaultFilter } from '@/components/FilterBar'
import { CompareView } from '@/components/CompareView'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { isFilterActive, toggleArray } from '@/lib/dashboard-filter'
import { usePageState } from '@/lib/page-context'
import { SalePerformance } from './SalePerformance'

export const DashboardLayout = () => {
  const { filter, setFilter } = usePageState()
  const ws = workspaces.current()
  if (!ws) return null
  const channels = dataset.channels(ws.id).map((c) => c.channel)

  const removeFilter = (key: keyof FilterValue, value?: string) => {
    setFilter((prev) => {
      if (key === 'channels' && value) {
        return { ...prev, channels: prev.channels.filter((x) => x !== value) }
      }
      if (key === 'status' && value) {
        return { ...prev, status: prev.status.filter((x) => x !== value) }
      }
      if (key === 'province') return { ...prev, province: '' }
      if (key === 'range') return { ...prev, range: 'all' }
      if (key === 'search') return { ...prev, search: '' }
      return prev
    })
  }

  const clearAll = () => setFilter(defaultFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard · <span className="gradient-text">{ws.nameTh}</span>
          </h1>
          <p className="muted">ภาพรวมผลประกอบการ · คลิกที่ chart ใดก็ได้เพื่อ cross-filter</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterBar
            value={filter}
            onChange={setFilter}
            channels={channels}
            provinces={[
              'กรุงเทพมหานคร',
              'ชลบุรี',
              'นนทบุรี',
              'สมุทรปราการ',
              'ปทุมธานี',
              'เชียงใหม่',
            ]}
          />
          <CompareView
            render={(side) => <CompareSide side={side} channels={channels} />}
          />
        </div>
      </div>

      {/* Active cross-filter chips bar */}
      {isFilterActive(filter) && (
        <div className="card p-3 bg-gradient-to-r from-brand-50 to-coral-50 border-brand-200 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-800 mr-1">
            <FilterIcon className="w-3.5 h-3.5" /> Cross-filter ใช้งานอยู่:
          </span>
          {filter.range !== 'all' && (
            <CrossChip onClear={() => removeFilter('range')}>{filter.range}</CrossChip>
          )}
          {filter.channels.map((c) => (
            <CrossChip key={c} onClear={() => removeFilter('channels', c)}>
              📡 {c}
            </CrossChip>
          ))}
          {filter.status.map((s) => (
            <CrossChip key={s} onClear={() => removeFilter('status', s)}>
              👤 {s}
            </CrossChip>
          ))}
          {filter.province && (
            <CrossChip onClear={() => removeFilter('province')}>
              📍 {filter.province}
            </CrossChip>
          )}
          {filter.search && (
            <CrossChip onClear={() => removeFilter('search')}>
              🔍 {filter.search}
            </CrossChip>
          )}
          <button
            onClick={clearAll}
            className="ml-auto text-xs font-semibold text-brand-700 hover:underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      <div className="card tone-risk p-3 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-900">
          <span className="font-semibold">832 outliers detected</span> — 0 excluded from RFM for accuracy
        </div>
        <button className="ml-auto text-xs text-amber-700 hover:underline">Manage</button>
      </div>

      <SubTabs
        items={[
          { to: '/dashboard', label: '📊 Sale Performance', end: true },
          { to: '/dashboard/growth', label: '📈 Growth' },
          { to: '/dashboard/geography', label: '🗺️ Geography' },
          { to: '/dashboard/products', label: '📦 Products' },
          { to: '/dashboard/retention', label: '💞 Retention' },
        ]}
      />

      <Outlet context={{ filter, setFilter }} />
    </div>
  )
}

const CrossChip = ({
  children,
  onClear,
}: {
  children: React.ReactNode
  onClear: () => void
}) => (
  <span className="chip bg-white text-brand-700 border border-brand-200 text-xs px-2.5 py-1">
    {children}
    <button onClick={onClear} className="ml-1 hover:text-rose-600">
      <X className="w-3 h-3" />
    </button>
  </span>
)

const CompareSide = ({ side, channels }: { side: 'A' | 'B'; channels: string[] }) => {
  const [filter, setFilter] = useState<FilterValue>({
    ...defaultFilter,
    range: side === 'A' ? '30d' : '90d',
  })
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-700">
          {side === 'A' ? 'มุมมอง A' : 'มุมมอง B'} ·{' '}
          <span className="text-slate-500 font-normal">
            ตั้ง filter อิสระแล้วเทียบด้วยตา
          </span>
        </div>
        <FilterBar value={filter} onChange={setFilter} channels={channels} compact />
      </div>
      <SalePerformance compact />
    </div>
  )
}

// Helper exposed for SalePerformance click handlers
export const useToggleChannel = (
  setFilter: (next: FilterValue | ((p: FilterValue) => FilterValue)) => void,
) => (channel: string) =>
  setFilter((prev) => ({ ...prev, channels: toggleArray(prev.channels, channel) }))

export const useToggleStatus = (
  setFilter: (next: FilterValue | ((p: FilterValue) => FilterValue)) => void,
) => (status: string) =>
  setFilter((prev) => ({ ...prev, status: toggleArray(prev.status, status) }))
