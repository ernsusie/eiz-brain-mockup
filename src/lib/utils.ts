import clsx, { ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

export const formatTHB = (value: number, opts: { compact?: boolean } = {}) => {
  if (opts.compact) {
    if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
  }
  return `฿${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export const formatNumber = (value: number, opts: { compact?: boolean } = {}) => {
  if (opts.compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString('en-US')
}

export const formatPct = (value: number, digits = 1) =>
  `${value.toFixed(digits)}%`

export const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'เมื่อสักครู่'
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  const months = Math.floor(days / 30)
  return `${months} เดือนที่แล้ว`
}

// Deterministic seeded random — same output across reloads
export const seededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) | 0
    return ((state >>> 0) / 0xffffffff)
  }
}

export const pick = <T,>(arr: T[], rand: () => number) =>
  arr[Math.floor(rand() * arr.length)]

export const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export const statusColor: Record<string, string> = {
  champion: 'bg-emerald-100 text-emerald-700',
  loyal: 'bg-sky-100 text-sky-700',
  potential: 'bg-amber-100 text-amber-700',
  new: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-orange-100 text-orange-700',
  lost: 'bg-rose-100 text-rose-700',
  ghost: 'bg-slate-200 text-slate-600',
}

export const statusLabel: Record<string, string> = {
  champion: 'แชมป์เปี้ยน',
  loyal: 'ลูกค้าประจำ',
  potential: 'มีศักยภาพ',
  new: 'ลูกค้าใหม่',
  at_risk: 'เริ่มห่าง',
  lost: 'หายไป',
  ghost: 'หายขาด',
}
