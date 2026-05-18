import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Send,
  Sparkles,
  X,
  MessageCircle,
  GripVertical,
} from 'lucide-react'
import { workspaces } from '@/lib/workspaces'
import { usePageState } from '@/lib/page-context'
import {
  generateChatReply,
  generatePageSummary,
  type PageSummary,
} from '@/lib/page-summary'
import { Mascot } from './Mascot'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  at: string
}

const SUMMARY_DEFAULTS = { w: 380, h: 540 }
const CHAT_DEFAULTS = { w: 380, h: 520 }

export const AIPanels = () => {
  const loc = useLocation()
  const ws = workspaces.current()
  const { filter } = usePageState()

  /* Hidden on login + workspace picker only. The Brief page now keeps
   *  the floating chat too — users asked for it because the embedded
   *  AI Summary card on Brief is a one-shot read but a chat is the
   *  natural follow-up for "ทำไม?" / "เจาะลึก…" questions. */
  const hide =
    loc.pathname.startsWith('/login') ||
    loc.pathname.startsWith('/workspaces')

  // ---- Summary state (persistent across navigation) ----
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryFull, setSummaryFull] = useState(false)
  const [summarySize, setSummarySize] = useState(SUMMARY_DEFAULTS)
  const [summaryKey, setSummaryKey] = useState(0) // bump to regenerate

  // ---- Chat state ----
  const [chatOpen, setChatOpen] = useState(false)
  const [chatFull, setChatFull] = useState(false)
  const [chatSize, setChatSize] = useState(CHAT_DEFAULTS)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys',
      role: 'ai',
      content:
        'สวัสดีครับ ผมคือ EizBrain AI · ถามได้เลยเกี่ยวกับลูกค้า ยอดขาย สินค้า หรือคำแนะนำเรื่องโปรโมชั่น 🌟',
      at: new Date().toISOString(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const summary = useMemo<PageSummary>(() => {
    if (!ws) {
      return {
        title: '',
        scope: '',
        paragraphs: ['เลือก workspace ก่อน'],
        bullets: [],
        recommendation: '',
      }
    }
    return generatePageSummary(loc.pathname, ws.id, filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, ws?.id, filter, summaryKey])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages, thinking])

  /* Brief page emits this custom event from its "Chat with AI"
   *  callout CTA — open the chat panel and focus it. */
  useEffect(() => {
    const handler = () => setChatOpen(true)
    window.addEventListener('eiz-open-chat', handler)
    return () => window.removeEventListener('eiz-open-chat', handler)
  }, [])

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text || !ws) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      at: new Date().toISOString(),
    }
    setChatMessages((m) => [...m, userMsg])
    setChatInput('')
    setThinking(true)
    setTimeout(() => {
      const reply = generateChatReply(text, loc.pathname, ws.id, filter)
      setChatMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          content: reply,
          at: new Date().toISOString(),
        },
      ])
      setThinking(false)
    }, 800 + Math.random() * 600)
  }

  const resetChat = () => {
    setChatMessages([
      {
        id: `sys-${Date.now()}`,
        role: 'ai',
        content: 'เริ่มสนทนาใหม่แล้วครับ ถามได้เลย 👋',
        at: new Date().toISOString(),
      },
    ])
  }

  if (hide) return null

  return (
    <>
      {/* Floating buttons */}
      {!summaryOpen && (
        <button
          onClick={() => setSummaryOpen(true)}
          className="fixed top-20 right-4 z-40 w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-brand-200 hover:border-brand-400 hover:scale-105 transition-all flex items-center justify-center group"
          title="สรุปหน้านี้ด้วย AI"
        >
          <Mascot size={48} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ✨ สรุปหน้านี้
          </span>
        </button>
      )}

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center group"
          title="Chat กับ AI"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            💬 Chat กับ AI
          </span>
        </button>
      )}

      {/* Summary panel */}
      {summaryOpen && (
        <FloatingPanel
          position={{ top: 76, right: 16 }}
          size={summarySize}
          onResize={setSummarySize}
          fullscreen={summaryFull}
          title={
            <div className="flex items-center gap-2">
              <Mascot size={28} />
              <div>
                <div className="text-sm font-bold text-slate-900">Executive Summary</div>
                <div className="text-[10px] text-slate-500">{summary.title}</div>
              </div>
            </div>
          }
          actions={
            <>
              <button
                onClick={() => setSummaryKey((k) => k + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                title="Reset / regenerate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSummaryFull((f) => !f)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                title={summaryFull ? 'ย่อ' : 'ขยายเต็มจอ'}
              >
                {summaryFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSummaryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          }
          headerTone="bg-gradient-to-r from-brand-50 via-coral-50 to-amber-50"
        >
          <div className="p-4 space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Scope:</span> {summary.scope}
            </div>

            {summary.bullets.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {summary.bullets.map((b) => (
                  <div
                    key={b.label}
                    className="rounded-xl bg-gradient-to-br from-brand-50/60 to-white border border-brand-100 p-2.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      {b.label}
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">{b.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5">
              {summary.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-sm text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: p.replace(
                      /\*\*([^*]+)\*\*/g,
                      '<strong class="text-brand-700 font-bold">$1</strong>',
                    ),
                  }}
                />
              ))}
            </div>

            {summary.recommendation && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold mb-1">
                  คำแนะนำ
                </div>
                <div className="text-sm text-slate-800">{summary.recommendation}</div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100">
              Mock AI · เพื่อ demo เท่านั้น · regenerate เมื่อกด ↻ หรือเปลี่ยน filter
            </div>
          </div>
        </FloatingPanel>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <FloatingPanel
          position={{ bottom: 16, right: 16 }}
          size={chatSize}
          onResize={setChatSize}
          fullscreen={chatFull}
          title={
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Chat with EizBrain</div>
                <div className="text-[10px] text-slate-500">ถามอะไรเกี่ยวกับข้อมูลก็ได้</div>
              </div>
            </div>
          }
          actions={
            <>
              <button
                onClick={resetChat}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                title="Reset chat"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChatFull((f) => !f)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                title={chatFull ? 'ย่อ' : 'ขยายเต็มจอ'}
              >
                {chatFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          }
          headerTone="bg-gradient-to-r from-brand-50 to-coral-50"
        >
          <div className="flex flex-col h-full">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.role === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 text-sm max-w-[80%]',
                      m.role === 'user'
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-800',
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-500 italic">
                    กำลังคิด...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-2.5">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {[
                  'สรุปยอดขาย',
                  'ลูกค้าเสี่ยง',
                  'สินค้าขายดี',
                  'แนะนำโปร',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setChatInput(q)
                      setTimeout(sendChat, 50)
                    }}
                    className="text-[11px] px-2 py-1 rounded-full bg-slate-100 hover:bg-brand-100 hover:text-brand-700 text-slate-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="พิมพ์คำถาม... (กด Enter เพื่อส่ง)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChat()
                    }
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="btn-primary px-3 py-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </FloatingPanel>
      )}
    </>
  )
}

// =====================================================
// Floating panel shell (resizable + fullscreen)
// =====================================================

interface FloatingPanelProps {
  position: { top?: number; right?: number; bottom?: number; left?: number }
  size: { w: number; h: number }
  onResize: (s: { w: number; h: number }) => void
  fullscreen?: boolean
  title: React.ReactNode
  actions: React.ReactNode
  headerTone?: string
  children: React.ReactNode
}

const FloatingPanel = ({
  position,
  size,
  onResize,
  fullscreen,
  title,
  actions,
  headerTone,
  children,
}: FloatingPanelProps) => {
  const [resizing, setResizing] = useState(false)
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  useEffect(() => {
    if (!resizing) return
    const move = (e: MouseEvent) => {
      if (!startRef.current) return
      // Bottom-right resize from top-left position would be normal; here panels
      // are anchored top-right or bottom-right, so dx grows the panel leftward (negative).
      const dx = startRef.current.x - e.clientX
      const dy =
        position.top != null ? e.clientY - startRef.current.y : startRef.current.y - e.clientY
      onResize({
        w: Math.max(320, Math.min(900, startRef.current.w + dx)),
        h: Math.max(360, Math.min(900, startRef.current.h + dy)),
      })
    }
    const up = () => setResizing(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [resizing, onResize, position.top])

  const style: React.CSSProperties = fullscreen
    ? {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16,
        width: 'auto',
        height: 'auto',
      }
    : {
        ...position,
        width: size.w,
        height: size.h,
      }

  // Resize handle position depends on anchor
  const handleClass = position.top != null ? 'bottom-1 left-1' : 'top-1 left-1'

  return (
    <div
      className="fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in"
      style={style}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100 shrink-0',
          headerTone ?? 'bg-slate-50',
        )}
      >
        <div className="min-w-0 flex-1">{title}</div>
        <div className="flex items-center gap-0.5 shrink-0">{actions}</div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize handle (corner) */}
      {!fullscreen && (
        <div
          className={cn(
            'absolute w-5 h-5 cursor-nwse-resize flex items-center justify-center text-slate-400 hover:text-brand-600',
            handleClass,
          )}
          onMouseDown={(e) => {
            e.preventDefault()
            startRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
            setResizing(true)
          }}
          title="ลากเพื่อเปลี่ยนขนาด"
        >
          <GripVertical className="w-3.5 h-3.5 rotate-45" />
        </div>
      )}
    </div>
  )
}
