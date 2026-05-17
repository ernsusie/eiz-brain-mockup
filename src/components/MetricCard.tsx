import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  trend?: number
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand'
  className?: string
}

const toneStyles: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  brand: 'bg-brand-100 text-brand-700',
}

export const MetricCard = ({ icon: Icon, label, value, hint, trend, tone = 'default', className }: Props) => (
  <div className={cn('card card-hover p-4', className)}>
    <div className="flex items-start gap-3">
      {Icon && (
        <div
          className={cn(
            'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center',
            toneStyles[tone],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-xl font-bold text-slate-900 mt-1 truncate">{value}</div>
        {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
        {trend != null && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 mt-1 text-[11px] font-semibold',
              trend >= 0 ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}% vs prev
          </div>
        )}
      </div>
    </div>
  </div>
)
