import { useEffect, useState } from 'react'
import { Sparkles, X, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiInsight } from '@/lib/ai-mock'

interface Props {
  title: string
  subtitle?: string
  insight: AiInsight | null
  open: boolean
  onClose: () => void
}

export const AIInsightModal = ({ title, subtitle, insight, open, onClose }: Props) => {
  const [phase, setPhase] = useState<'thinking' | 'ready'>('thinking')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setPhase('thinking')
    const t = setTimeout(() => setPhase('ready'), 1100)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-brand-50 via-coral-50 to-amber-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                AI วิเคราะห์
                <span className="text-[10px] uppercase tracking-wider bg-brand-600 text-white px-1.5 py-0.5 rounded">
                  Mock
                </span>
              </div>
              <div className="text-sm text-slate-600">{title}</div>
              {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {phase === 'thinking' || !insight ? (
            <ThinkingSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-coral-50/60 border border-brand-100 p-4">
                <div className="text-xs uppercase tracking-wider text-brand-700 font-bold">
                  สรุป
                </div>
                <div className="text-sm text-slate-900 mt-1">{insight.summary}</div>
              </div>

              {insight.blocks.map((b, i) => (
                <div key={i}>
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">{b.title}</div>
                  <ul className="space-y-1.5">
                    {b.bullets.map((bullet, j) => (
                      <li key={j} className="text-sm text-slate-700 flex gap-2">
                        <span className="text-brand-500 mt-0.5">▸</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4">
                <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold mb-1">
                  คำแนะนำ (Action)
                </div>
                <div className="text-sm text-slate-800">{insight.recommendation}</div>
              </div>

              {insight.promotion && insight.promotion.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">โปรโมชั่นที่แนะนำ</div>
                  <div className="space-y-2">
                    {insight.promotion.map((p, i) => (
                      <div key={i} className="card-hover p-3 rounded-xl border border-slate-200 bg-white">
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-600">{p.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.callScript && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-semibold text-slate-700">สคริปต์โทร (แนะนำ)</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(insight.callScript ?? '')
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      }}
                      className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 leading-relaxed">
                    “{insight.callScript}”
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Mock LLM — เพื่อ demo เท่านั้น ยังไม่ได้เชื่อม API จริง</span>
          <button onClick={onClose} className="btn-soft text-xs">
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

const ThinkingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="text-sm text-slate-500 flex items-center gap-2">
      <span className={cn('inline-block w-2 h-2 rounded-full bg-brand-500 animate-pulse')}></span>
      AI กำลังวิเคราะห์ข้อมูล...
    </div>
    <div className="h-4 bg-slate-100 rounded w-3/4" />
    <div className="h-4 bg-slate-100 rounded w-full" />
    <div className="h-4 bg-slate-100 rounded w-5/6" />
    <div className="h-20 bg-slate-100 rounded-xl mt-4" />
    <div className="h-4 bg-slate-100 rounded w-2/3" />
    <div className="h-4 bg-slate-100 rounded w-4/5" />
  </div>
)
