import { ReactNode, useState } from 'react'
import { Columns2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  render: (side: 'A' | 'B') => ReactNode
}

export const CompareView = ({ render }: Props) => {
  const [active, setActive] = useState(false)

  return (
    <>
      <button
        onClick={() => setActive((a) => !a)}
        className={cn(
          'btn-ghost text-xs',
          active && 'bg-brand-50 border-brand-200 text-brand-700',
        )}
      >
        <Columns2 className="w-3.5 h-3.5" />
        {active ? 'ออกจาก Compare' : 'Compare'}
      </button>

      {active && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col">
          <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700">
                <Columns2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">โหมดเปรียบเทียบ</div>
                <div className="text-xs text-slate-500">
                  ปรับ filter ของแต่ละฝั่งเพื่อเทียบ — ปิดเพื่อกลับ
                </div>
              </div>
            </div>
            <button onClick={() => setActive(false)} className="btn-ghost text-xs">
              <X className="w-3.5 h-3.5" /> ปิด
            </button>
          </div>
          <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-brand-50 to-white px-4 py-2 border-b border-slate-100 text-xs font-semibold text-brand-700">
                ฝั่ง A
              </div>
              <div className="p-4">{render('A')}</div>
            </div>
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-white px-4 py-2 border-b border-slate-100 text-xs font-semibold text-purple-700">
                ฝั่ง B
              </div>
              <div className="p-4">{render('B')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
