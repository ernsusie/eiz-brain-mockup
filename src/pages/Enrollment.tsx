import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Target,
  CheckCircle2,
  Users,
  Edit3,
  Search,
  Download,
  X,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { useAuth, can } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import {
  CALL_PRIORITY_META,
  computeCallPriority,
  customerOverlay,
  dataset,
  distributeCustomers,
  kpiStore,
  lastDistributedAt,
  salesStore,
  toggleCustomerLock,
  type CallPriority,
} from '@/lib/mock-data'
import { cn, formatNumber, formatTHB, relativeTime } from '@/lib/utils'
import type { Customer, KpiConfig, Sale } from '@/types'
import { RoleHint } from '@/components/RoleGuard'

type Tab = 'pipeline' | 'config' | 'enrolled'

const CALLABLE_STATUS = ['champion', 'loyal', 'potential', 'at_risk', 'new']

export const Enrollment = () => {
  const { user } = useAuth()
  const ws = workspaces.current()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pipeline')
  const [sales, setSales] = useState<Sale[]>(() => (ws ? salesStore.get(ws.id) : []))
  const [kpi, setKpi] = useState<KpiConfig | null>(() => (ws ? kpiStore.get(ws.id) : null))
  const [editing, setEditing] = useState<Sale | null>(null)
  const [showAddSale, setShowAddSale] = useState(false)
  const [overlayVersion, setOverlayVersion] = useState(0)

  if (!ws || !user || !kpi) return null

  const isAdmin = can(user.role, 'admin')

  const allCustomers = useMemo(() => dataset.customers(ws.id), [ws.id])
  const overlay = useMemo(
    () => customerOverlay.get(ws.id),
    [ws.id, overlayVersion],
  )
  const distributed = lastDistributedAt(ws.id)

  const saveSale = (s: Sale) => {
    const next = sales.some((x) => x.id === s.id)
      ? sales.map((x) => (x.id === s.id ? s : x))
      : [...sales, s]
    setSales(next)
    salesStore.set(ws.id, next)
    setEditing(null)
    setShowAddSale(false)
  }

  const removeSale = (id: string) => {
    const next = sales.filter((s) => s.id !== id)
    setSales(next)
    salesStore.set(ws.id, next)
  }

  const saveKpi = (next: KpiConfig) => {
    setKpi(next)
    kpiStore.set(ws.id, next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Enrollment
            {!isAdmin && (
              <span className="chip bg-amber-100 text-amber-700 text-[10px]">read-only</span>
            )}
          </h1>
          <p className="muted">
            🔀 สุ่มเขย่าและกระจายลูกค้าให้ทีม telesale · 🔒 ลูกค้าที่ lock จะไม่ถูกสลับ
          </p>
        </div>
      </div>

      <div className="card p-1 inline-flex gap-1 flex-wrap">
        {(
          [
            { v: 'pipeline', label: '📋 Pipeline by Sale', highlight: true },
            { v: 'config', label: '⚙️ Sales + KPI Config' },
            { v: 'enrolled', label: '👥 All Enrolled' },
          ] as { v: Tab; label: string; highlight?: boolean }[]
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2',
              tab === t.v
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {t.label}
            {t.highlight && tab !== t.v && (
              <span className="text-[9px] uppercase font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                main
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <PipelineBySale
          ws={ws}
          sales={sales}
          allCustomers={allCustomers}
          overlay={overlay}
          isAdmin={isAdmin}
          adminName={user.name}
          distributed={distributed}
          onChanged={() => setOverlayVersion((v) => v + 1)}
        />
      )}

      {tab === 'config' && (
        <ConfigTab
          sales={sales}
          kpi={kpi}
          isAdmin={isAdmin}
          user={user}
          setShowAddSale={setShowAddSale}
          setEditing={setEditing}
          saveKpi={saveKpi}
          removeSale={removeSale}
        />
      )}

      {tab === 'enrolled' && (
        <EnrolledFlat ws={ws} sales={sales} navigate={navigate} />
      )}

      {(editing || showAddSale) && (
        <SaleEditor
          initial={
            editing ??
            {
              id: `${ws.id}-s-${Date.now()}`,
              name: '',
              type: 'telesale',
              channel: 'Telesale',
              avatar: '#ff7a00',
              active: true,
              kpiMonthly: kpi.monthlyRevenueTarget / 10,
              achievedMonthly: 0,
              customersAssigned: 0,
              customersEnrolled: 0,
              returnRate: 0,
              joinedAt: new Date().toISOString(),
            }
          }
          onClose={() => {
            setEditing(null)
            setShowAddSale(false)
          }}
          onSave={saveSale}
        />
      )}
    </div>
  )
}

// ============================================================
//  PIPELINE BY SALE — main tab with Reshuffle + Lock logic
// ============================================================

const PipelineBySale = ({
  ws,
  sales,
  allCustomers,
  overlay,
  isAdmin,
  adminName,
  distributed,
  onChanged,
}: {
  ws: { id: string; nameTh: string }
  sales: Sale[]
  allCustomers: Customer[]
  overlay: Record<string, any>
  isAdmin: boolean
  adminName: string
  distributed: { at: string; count: number; reshuffled?: number; kept?: number } | null
  onChanged: () => void
}) => {
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const activeSales = useMemo(() => sales.filter((s) => s.active), [sales])

  const callable = useMemo(
    () => allCustomers.filter((c) => CALLABLE_STATUS.includes(c.status)),
    [allCustomers],
  )

  // Assignment map
  const assignmentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        customer: Customer
        priority: CallPriority
        locked: boolean
        badge: 'new' | 'kept' | null
      }[]
    >()
    activeSales.forEach((s) => map.set(s.name, []))
    callable.forEach((c) => {
      const ov = overlay[c.id]
      const saleName = ov?.saleName
      if (!saleName || !map.has(saleName)) return
      const priority: CallPriority =
        (ov?.callPriority as CallPriority) ?? computeCallPriority(c)
      map.get(saleName)!.push({
        customer: c,
        priority,
        locked: ov?.locked ?? false,
        badge: ov?.assignmentBadge ?? null,
      })
    })
    return map
  }, [callable, overlay, activeSales])

  const totalAssigned = Array.from(assignmentMap.values()).reduce(
    (s, list) => s + list.length,
    0,
  )
  const unassigned = callable.length - totalAssigned
  const avgPerSale = activeSales.length
    ? Math.round(totalAssigned / activeSales.length)
    : 0

  // Distribution balance
  const loads = Array.from(assignmentMap.values()).map((l) => l.length)
  const maxLoad = Math.max(...loads, 0)
  const minLoad = Math.min(...loads, 0)
  const balance =
    activeSales.length === 0
      ? 100
      : Math.max(0, 100 - ((maxLoad - minLoad) / (avgPerSale || 1)) * 50)

  // Total locked count
  const lockedCount = Object.values(overlay).filter((o: any) => o?.locked).length

  // === RESHUFFLE: shake all customers and redistribute evenly ===
  // Locked customers stay. Everyone else gets randomized → distributed round-robin
  // to least-loaded active sale. Each assignment is marked 'new' or 'kept'.
  const runReshuffle = () => {
    if (!isAdmin) return

    let reshuffled = 0
    let kept = 0

    // 1. Keep locked first
    const lockedAssignments: any[] = []
    const load = new Map<string, number>()
    activeSales.forEach((s) => load.set(s.id, 0))

    callable.forEach((c) => {
      const ov = overlay[c.id]
      if (ov?.locked) {
        const sale = activeSales.find((s) => s.name === ov.saleName)
        if (sale) {
          lockedAssignments.push({
            customerId: c.id,
            saleId: sale.id,
            saleName: sale.name,
            enrolledAt: ov.enrolledAt,
            enrolledByAdmin: ov.enrolledByAdmin,
            callPriority: computeCallPriority(c),
            locked: true,
            assignmentBadge: 'kept' as const,
            previousSaleName: ov.previousSaleName ?? ov.saleName,
          })
          load.set(sale.id, (load.get(sale.id) ?? 0) + 1)
          kept++
        }
      }
    })

    // 2. Shuffle unlocked customers
    const unlocked = callable.filter((c) => !overlay[c.id]?.locked)
    const shuffled = [...unlocked].sort(() => Math.random() - 0.5)

    // 3. Round-robin distribute to least-loaded sale
    const newAssignments: any[] = []
    shuffled.forEach((c) => {
      const sorted = [...activeSales].sort(
        (a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0),
      )
      const target = sorted[0]
      if (!target) return
      load.set(target.id, (load.get(target.id) ?? 0) + 1)
      const prevSaleName = overlay[c.id]?.saleName
      const isKept = prevSaleName === target.name
      newAssignments.push({
        customerId: c.id,
        saleId: target.id,
        saleName: target.name,
        enrolledAt: new Date().toISOString(),
        enrolledByAdmin: adminName,
        callPriority: computeCallPriority(c),
        locked: false,
        assignmentBadge: isKept ? 'kept' : 'new',
        previousSaleName: prevSaleName,
      })
      if (isKept) kept++
      else reshuffled++
    })

    const allAssignments = [...lockedAssignments, ...newAssignments]

    // Store with reshuffle/kept counts
    distributeCustomers(ws.id, allAssignments)
    // Also store summary metrics
    const distKey = `customers.distributed.${ws.id}`
    const summary = {
      at: new Date().toISOString(),
      count: allAssignments.length,
      reshuffled,
      kept,
    }
    try {
      localStorage.setItem('eiz-brain:' + distKey, JSON.stringify(summary))
    } catch {
      /* ignore */
    }
    onChanged()
  }

  const handleLockToggle = (
    customerId: string,
    saleId: string,
    saleName: string,
  ) => {
    if (!isAdmin) return
    toggleCustomerLock(ws.id, customerId, saleId, saleName, adminName)
    onChanged()
  }

  return (
    <div className="space-y-4">
      {/* 1. Distribution status */}
      <div className="card tone-revenue p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="md:col-span-2">
            <div className="text-xs uppercase font-bold tracking-wider text-brand-700">
              สถานะการกระจาย
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {formatNumber(totalAssigned)} / {formatNumber(callable.length)}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              ลูกค้าที่กระจายแล้ว · เหลือ{' '}
              <strong className="text-rose-600">{formatNumber(unassigned)}</strong>{' '}
              รายที่ยังไม่มีคนดูแล
            </div>
            {distributed && (
              <div className="text-[11px] text-slate-500 mt-2">
                Reshuffle ล่าสุด {relativeTime(distributed.at)} ·{' '}
                <span className="text-emerald-700 font-semibold">
                  เก่า {distributed.kept ?? 0}
                </span>{' '}
                ·{' '}
                <span className="text-brand-700 font-semibold">
                  ใหม่ {distributed.reshuffled ?? 0}
                </span>
              </div>
            )}
          </div>

          <Stat label="เฉลี่ย/sale" value={String(avgPerSale)} sub={`max ${maxLoad} · min ${minLoad}`} />
          <Stat
            label="🔒 Locked"
            value={String(lockedCount)}
            sub="จะไม่ถูกสลับ"
          />

          <div>
            <div className="text-xs text-slate-500 mb-1">ความสมดุล</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      balance > 80
                        ? 'bg-emerald-500'
                        : balance > 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                    style={{ width: `${balance}%` }}
                  />
                </div>
              </div>
              <span className="font-bold text-sm">{balance.toFixed(0)}%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {balance > 80 ? 'กระจายดี' : balance > 50 ? 'พอใช้' : 'ไม่สมดุล'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Reshuffle primary CTA */}
      <div className="card tone-customer p-5 border-2 border-emerald-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-emerald-900">
                🔀 Monthly Reshuffle — สุ่มเขย่าและกระจายใหม่ทั้งหมด
              </div>
              <div className="text-sm text-slate-700 mt-1">
                สุ่มลูกค้าทั้งหมดและจัดสรรใหม่ให้ {activeSales.length} sale อย่างเท่าๆกัน
              </div>
              <ul className="text-xs text-slate-600 mt-2 space-y-0.5">
                <li>
                  🔒 ลูกค้าที่ <strong>locked</strong> จะอยู่กับ sale คนเดิม ไม่ถูกสลับ
                </li>
                <li>
                  🎲 ลูกค้าที่ไม่ locked จะถูก <strong>shuffle</strong> และกระจายใหม่หมด —
                  อาจจะอยู่กับคนเดิม (badge "เก่า") หรือเปลี่ยน sale (badge "ใหม่")
                </li>
                <li>📞 ระบบจะคำนวณ call priority (🔥 Hot / 🌡️ Warm / ❄️ Cold) ให้อัตโนมัติ</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {isAdmin ? (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Reshuffle ลูกค้า ${formatNumber(callable.length)} ราย? (${lockedCount} locked จะอยู่กับ sale เดิม)`,
                    )
                  ) {
                    runReshuffle()
                  }
                }}
                className="btn-primary text-sm whitespace-nowrap"
              >
                <Shuffle className="w-4 h-4" />
                {distributed ? 'Reshuffle ใหม่' : `กระจาย ${formatNumber(callable.length)} ลูกค้า`}
              </button>
            ) : (
              <span className="chip bg-amber-100 text-amber-700">
                <AlertTriangle className="w-3 h-3" /> Admin only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Per-sale pipeline cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">
            Pipeline ของ Sale ({activeSales.length} คน)
          </h3>
          <span className="text-xs text-slate-500">คลิก card เพื่อดูรายชื่อลูกค้า</span>
        </div>

        {activeSales
          .map((sale) => ({
            sale,
            list: assignmentMap.get(sale.name) ?? [],
          }))
          .sort((a, b) => b.list.length - a.list.length)
          .map(({ sale, list }) => {
            const buckets = {
              hot: list.filter((x) => x.priority === 'hot'),
              warm: list.filter((x) => x.priority === 'warm'),
              cold: list.filter((x) => x.priority === 'cold'),
            }
            const expanded = expandedSale === sale.id
            const value = list.reduce((s, x) => s + x.customer.totalSpend, 0)
            const newCount = list.filter((x) => x.badge === 'new').length
            const lockedInSale = list.filter((x) => x.locked).length

            return (
              <div
                key={sale.id}
                className={cn(
                  'card overflow-hidden border-2 transition-all',
                  expanded ? 'border-brand-300 shadow-md' : 'border-transparent',
                )}
              >
                <button
                  onClick={() => setExpandedSale(expanded ? null : sale.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: sale.avatar }}
                    >
                      {sale.name[0]}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {sale.name}
                        {newCount > 0 && (
                          <span className="chip bg-brand-100 text-brand-700 text-[9px]">
                            🆕 {newCount} ใหม่
                          </span>
                        )}
                        {lockedInSale > 0 && (
                          <span className="chip bg-slate-200 text-slate-700 text-[9px]">
                            🔒 {lockedInSale} locked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {sale.type === 'main' ? 'Main Sale' : 'Telesale'} · {sale.channel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <PriorityChip label="Hot" count={buckets.hot.length} priority="hot" />
                    <PriorityChip label="Warm" count={buckets.warm.length} priority="warm" />
                    <PriorityChip label="Cold" count={buckets.cold.length} priority="cold" />

                    <div className="hidden md:block text-right border-l border-slate-200 pl-4">
                      <div className="text-xs text-slate-500">รวม / มูลค่า</div>
                      <div className="font-bold text-slate-900">
                        {list.length} · {formatTHB(value, { compact: true })}
                      </div>
                    </div>

                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/30 animate-fade-in">
                    {list.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-500">
                        ยังไม่มีลูกค้าที่ assigned ให้ {sale.name} · กด Reshuffle
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(['hot', 'warm', 'cold'] as CallPriority[]).map((pr) => {
                          const bucket = buckets[pr]
                          if (bucket.length === 0) return null
                          const meta = CALL_PRIORITY_META[pr]
                          return (
                            <PriorityBucket
                              key={pr}
                              meta={meta}
                              bucket={bucket}
                              priority={pr}
                              isAdmin={isAdmin}
                              saleId={sale.id}
                              saleName={sale.name}
                              onLockToggle={handleLockToggle}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const Stat = ({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) => (
  <div>
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
  </div>
)

const PriorityChip = ({
  label,
  count,
  priority,
}: {
  label: string
  count: number
  priority: CallPriority
}) => {
  const meta = CALL_PRIORITY_META[priority]
  return (
    <div
      className={cn(
        'rounded-xl px-2.5 py-1.5 border text-center min-w-[58px]',
        meta.bg,
        meta.border,
      )}
    >
      <div className={cn('text-[10px] font-bold', meta.text)}>
        {meta.emoji} {label}
      </div>
      <div className={cn('text-base font-bold', meta.text)}>{count}</div>
    </div>
  )
}

const PriorityBucket = ({
  meta,
  bucket,
  isAdmin,
  saleId,
  saleName,
  onLockToggle,
}: {
  meta: (typeof CALL_PRIORITY_META)[CallPriority]
  bucket: {
    customer: Customer
    priority: CallPriority
    locked: boolean
    badge: 'new' | 'kept' | null
  }[]
  priority: CallPriority
  isAdmin: boolean
  saleId: string
  saleName: string
  onLockToggle: (id: string, saleId: string, saleName: string) => void
}) => {
  const navigate = useNavigate()
  return (
    <div className={cn('rounded-2xl border-2 p-3', meta.bg, meta.border)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn('text-sm font-bold', meta.text)}>
          {meta.emoji} {meta.label} ({bucket.length})
        </div>
        <div className={cn('text-[11px]', meta.text)}>SLA: {meta.sla}</div>
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {bucket.slice(0, 30).map(({ customer: c, locked, badge }) => (
          <div
            key={c.id}
            className="bg-white/70 hover:bg-white rounded-xl px-3 py-2 flex items-center justify-between gap-2 transition-colors"
          >
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => navigate(`/customers/${encodeURIComponent(c.id)}`)}
            >
              <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                {c.name}
                {badge === 'new' && (
                  <span className="chip bg-brand-100 text-brand-700 text-[9px]">🆕 ใหม่</span>
                )}
                {badge === 'kept' && (
                  <span className="chip bg-emerald-100 text-emerald-700 text-[9px]">
                    ↻ เก่า
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                {c.phone} · {c.province} · {c.orders} ออเดอร์
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-900">
                {formatTHB(c.totalSpend, { compact: true })}
              </div>
              <div className="text-[10px] text-slate-500">LTV</div>
            </div>
            {isAdmin && (
              <button
                onClick={() => onLockToggle(c.id, saleId, saleName)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors shrink-0',
                  locked
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                )}
                title={locked ? 'Unlock — ให้สลับได้' : 'Lock — ไม่ให้สลับ'}
              >
                {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        ))}
        {bucket.length > 30 && (
          <div className="text-center text-[11px] text-slate-500 py-2">
            + อีก {bucket.length - 30} ราย · ดูทั้งหมดในหน้าลูกค้า
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
//  CONFIG TAB
// ============================================================

const ConfigTab = ({
  sales,
  kpi,
  isAdmin,
  user,
  setShowAddSale,
  setEditing,
  saveKpi,
  removeSale,
}: {
  sales: Sale[]
  kpi: KpiConfig
  isAdmin: boolean
  user: { name: string }
  setShowAddSale: (b: boolean) => void
  setEditing: (s: Sale) => void
  saveKpi: (k: KpiConfig) => void
  removeSale: (id: string) => void
}) => (
  <>
    <div className="card tone-revenue p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-600" />
          <div className="font-semibold text-slate-900">เป้า KPI ของทีม</div>
          <RoleHint role="admin" />
        </div>
        {kpi.updatedAt && (
          <div className="text-xs text-slate-500">
            อัปเดตล่าสุดโดย <strong>{kpi.updatedBy}</strong> · {relativeTime(kpi.updatedAt)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiInput
          label="Revenue / เดือน"
          prefix="฿"
          value={kpi.monthlyRevenueTarget}
          disabled={!isAdmin}
          onChange={(v) =>
            saveKpi({
              ...kpi,
              monthlyRevenueTarget: v,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            })
          }
        />
        <KpiInput
          label="Orders / เดือน"
          value={kpi.monthlyOrdersTarget}
          disabled={!isAdmin}
          onChange={(v) =>
            saveKpi({
              ...kpi,
              monthlyOrdersTarget: v,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            })
          }
        />
        <KpiInput
          label="Enrollment / sale / เดือน"
          value={kpi.enrollmentTargetPerSale}
          disabled={!isAdmin}
          onChange={(v) =>
            saveKpi({
              ...kpi,
              enrollmentTargetPerSale: v,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            })
          }
        />
        <KpiInput
          label="Return Rate Max"
          suffix="%"
          value={kpi.returnRateMax}
          disabled={!isAdmin}
          onChange={(v) =>
            saveKpi({
              ...kpi,
              returnRateMax: v,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            })
          }
        />
      </div>
    </div>

    <div className="card tone-customer overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-emerald-100/40">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <div className="font-semibold">รายชื่อ Sale ({sales.length} คน)</div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddSale(true)} className="btn-primary text-xs">
            <Plus className="w-3 h-3" /> เพิ่ม Telesale
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/40 text-xs text-slate-600">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">ชื่อ</th>
              <th className="text-left px-3 py-2 font-semibold">ประเภท</th>
              <th className="text-right px-3 py-2 font-semibold">KPI เดือน</th>
              <th className="text-right px-3 py-2 font-semibold">ลูกค้า</th>
              <th className="text-right px-3 py-2 font-semibold">Enrolled</th>
              <th className="text-right px-3 py-2 font-semibold">Return %</th>
              <th className="text-center px-3 py-2 font-semibold">สถานะ</th>
              {isAdmin && <th className="text-right px-3 py-2 font-semibold"></th>}
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-emerald-100/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'chip',
                      s.type === 'main'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {s.type === 'main' ? 'Main Sale' : 'Telesale'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  {formatTHB(s.kpiMonthly, { compact: true })}
                </td>
                <td className="px-3 py-3 text-right">{s.customersAssigned}</td>
                <td className="px-3 py-3 text-right text-emerald-700 font-semibold">
                  {s.customersEnrolled}
                </td>
                <td className="px-3 py-3 text-right">{s.returnRate}%</td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={cn(
                      'chip',
                      s.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {s.active ? 'ทำงานอยู่' : 'พัก'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => setEditing(s)}
                      className="text-slate-400 hover:text-brand-600 mr-2"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`ลบ ${s.name}?`)) removeSale(s.id)
                      }}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
)

const EnrolledFlat = ({
  ws,
  sales,
  navigate,
}: {
  ws: { id: string }
  sales: Sale[]
  navigate: (path: string) => void
}) => {
  const [search, setSearch] = useState('')
  const [saleFilter, setSaleFilter] = useState('')

  const enrolledCustomers = useMemo(() => {
    return dataset
      .customersWithOverlay(ws.id)
      .filter((c) => c.enrolled)
      .filter((c) => (saleFilter ? c.assignedSale === saleFilter : true))
      .filter((c) =>
        search
          ? c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
          : true,
      )
  }, [ws, saleFilter, search])

  return (
    <div className="space-y-3">
      <div className="card tone-customer p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <div>
          <div className="font-semibold text-emerald-800">
            ลูกค้า Enrolled · {enrolledCustomers.length} ราย
          </div>
          <div className="text-xs text-emerald-700">
            ลูกค้าที่ถูกจัดให้ sale ดูแล (flat view)
          </div>
        </div>
        <button className="ml-auto btn-ghost text-xs border-emerald-200">
          <Download className="w-3.5 h-3.5" /> ส่งออก
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="ค้นหาชื่อลูกค้า เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={saleFilter}
          onChange={(e) => setSaleFilter(e.target.value)}
        >
          <option value="">ทุก sale</option>
          {sales.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">ลูกค้า</th>
              <th className="text-left px-3 py-2.5 font-medium">ผู้ดูแล</th>
              <th className="text-left px-3 py-2.5 font-medium">Enrolled โดย</th>
              <th className="text-left px-3 py-2.5 font-medium">วันที่</th>
              <th className="text-right px-3 py-2.5 font-medium">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {enrolledCustomers.slice(0, 80).map((c) => (
              <tr
                key={c.id}
                className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/customers/${encodeURIComponent(c.id)}`)}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.phone}</div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="chip bg-emerald-100 text-emerald-700">
                    {c.assignedSale}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{c.enrolledBy}</td>
                <td className="px-3 py-2.5 text-slate-600">
                  {c.enrolledAt && relativeTime(c.enrolledAt)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold">
                  {formatTHB(c.totalSpend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const KpiInput = ({
  label,
  value,
  prefix,
  suffix,
  disabled,
  onChange,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  disabled?: boolean
  onChange: (v: number) => void
}) => (
  <div>
    <label className="text-xs text-slate-500">{label}</label>
    <div className="relative mt-1">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {prefix}
        </span>
      )}
      <input
        type="number"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={cn(
          'input',
          prefix && 'pl-7',
          suffix && 'pr-7',
          disabled && 'bg-slate-50',
        )}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {suffix}
        </span>
      )}
    </div>
  </div>
)

const SaleEditor = ({
  initial,
  onClose,
  onSave,
}: {
  initial: Sale
  onClose: () => void
  onSave: (s: Sale) => void
}) => {
  const [s, setS] = useState<Sale>(initial)
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-fade-in">
      <div className="card max-w-md w-full p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">
            {initial.name ? 'แก้ไข Sale' : 'เพิ่ม Sale ใหม่'}
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">ชื่อ</label>
            <input
              className="input mt-1"
              value={s.name}
              onChange={(e) => setS({ ...s, name: e.target.value })}
              placeholder="เช่น คุณนุ่น"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">ประเภท</label>
            <select
              className="input mt-1"
              value={s.type}
              onChange={(e) =>
                setS({ ...s, type: e.target.value as 'main' | 'telesale' })
              }
            >
              <option value="telesale">Telesale</option>
              <option value="main">Main Sale Channel</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">KPI (THB)</label>
              <input
                type="number"
                className="input mt-1"
                value={s.kpiMonthly}
                onChange={(e) =>
                  setS({ ...s, kpiMonthly: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Return %</label>
              <input
                type="number"
                className="input mt-1"
                value={s.returnRate}
                onChange={(e) =>
                  setS({ ...s, returnRate: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.active}
              onChange={(e) => setS({ ...s, active: e.target.checked })}
            />
            ทำงานอยู่
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">
            ยกเลิก
          </button>
          <button
            onClick={() => s.name.trim() && onSave(s)}
            disabled={!s.name.trim()}
            className="btn-primary flex-1 justify-center"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
