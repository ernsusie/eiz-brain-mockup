import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface SubTabItem {
  to: string
  label: string
  end?: boolean
  badge?: string | number
}

export const SubTabs = ({ items }: { items: SubTabItem[] }) => (
  <div className="card p-1 inline-flex gap-1">
    {items.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        className={({ isActive }) =>
          cn(
            'px-4 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2',
            isActive
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50',
          )
        }
      >
        {it.label}
        {it.badge != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30">{it.badge}</span>
        )}
      </NavLink>
    ))}
  </div>
)
