import { createContext, useContext, useState, ReactNode } from 'react'
import type { FilterValue } from '@/components/FilterBar'
import { defaultFilter } from '@/components/FilterBar'

interface PageState {
  filter: FilterValue
  setFilter: (next: FilterValue | ((prev: FilterValue) => FilterValue)) => void
}

const PageContext = createContext<PageState>({
  filter: defaultFilter,
  setFilter: () => {},
})

export const PageContextProvider = ({ children }: { children: ReactNode }) => {
  const [filter, setFilterRaw] = useState<FilterValue>(defaultFilter)
  const setFilter = (
    next: FilterValue | ((prev: FilterValue) => FilterValue),
  ) => {
    setFilterRaw((prev) =>
      typeof next === 'function' ? (next as (p: FilterValue) => FilterValue)(prev) : next,
    )
  }
  return (
    <PageContext.Provider value={{ filter, setFilter }}>{children}</PageContext.Provider>
  )
}

export const usePageState = () => useContext(PageContext)
