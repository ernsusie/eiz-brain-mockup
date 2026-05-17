import { useOutletContext } from 'react-router-dom'
import type { Customer } from '@/types'
import type { FilterValue } from '@/components/FilterBar'

export interface DashboardOutletContext {
  filter: FilterValue
  setFilter: (next: FilterValue | ((prev: FilterValue) => FilterValue)) => void
}

export const useDashboardFilter = () =>
  useOutletContext<DashboardOutletContext>()

// Toggle helpers for chart cross-filter clicks
export const toggleArray = (arr: string[], v: string): string[] =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

// Apply filter to a customer list — used by all sub-pages
export const applyCustomerFilter = (
  customers: Customer[],
  filter: FilterValue,
): Customer[] => {
  let list = customers
  if (filter.channels.length) {
    list = list.filter((c) => filter.channels.includes(c.channel))
  }
  if (filter.status.length) {
    list = list.filter((c) => filter.status.includes(c.status))
  }
  if (filter.province) {
    list = list.filter((c) => c.province === filter.province)
  }
  if (filter.range !== 'all') {
    const days =
      filter.range === '7d'
        ? 7
        : filter.range === '30d'
          ? 30
          : filter.range === '90d'
            ? 90
            : filter.range === 'ytd'
              ? 138 // mock — days since Jan 1 of current year
              : Infinity
    const cutoff = Date.now() - days * 86400_000
    list = list.filter((c) => new Date(c.lastBuy).getTime() >= cutoff)
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.province.includes(filter.search),
    )
  }
  return list
}

export const isFilterActive = (f: FilterValue): boolean =>
  f.channels.length > 0 ||
  f.status.length > 0 ||
  f.province !== '' ||
  f.range !== 'all' ||
  f.search !== ''
