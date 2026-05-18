import { ChevronDown, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Visual treatment — info/violet by default. */
  kind?:  'info' | 'success' | 'warning'
  /** Headline line — short and direct. */
  items:  ReactNode[]
  /** Optional title chip shown left of the icon. */
  title?: string
  /** When `true`, defaults to collapsed (only first item visible). */
  collapsible?: boolean
}

const TONE: Record<NonNullable<Props['kind']>, string> = {
  info:    'bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 text-slate-700',
  success: 'bg-emerald-50 border border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border border-amber-200 text-amber-900',
}

/**
 * Top-of-page AI-style observation banner. Lives at the very top of
 * every dashboard sub-page so the operator sees actionable insights
 * before scrolling through charts. Multi-item lists collapse to the
 * first line by default — click to expand.
 */
export const PageInsight = ({ kind = 'info', items, title, collapsible = true }: Props) => {
  const [open, setOpen] = useState(!collapsible || items.length <= 1)
  if (items.length === 0) return null
  return (
    <div className={cn('card px-4 py-3 flex items-start gap-3', TONE[kind])}>
      <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-[10px] uppercase tracking-wider font-semibold text-violet-700 mb-1">
            {title}
          </div>
        )}
        <ul className="space-y-1 text-sm">
          {(open ? items : items.slice(0, 1)).map((it, i) => (
            <li key={i} className="leading-relaxed">{it}</li>
          ))}
        </ul>
        {collapsible && items.length > 1 && !open && (
          <button onClick={() => setOpen(true)} className="text-[11px] text-violet-700 hover:underline mt-1">
            ดูข้อสังเกตเพิ่ม ({items.length - 1})
          </button>
        )}
      </div>
      {collapsible && items.length > 1 && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-400 hover:text-slate-700 shrink-0"
          aria-label="Toggle insights"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </button>
      )}
    </div>
  )
}
