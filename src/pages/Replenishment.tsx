import { useEffect, useMemo, useState } from 'react'
import {
  Package,
  Save,
  RotateCw,
  Bell,
  AlertCircle,
  Sparkles,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { useAuth, can } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import {
  dataset,
  replenishmentStore,
  type ReplenishmentConfig,
} from '@/lib/mock-data'
import { RoleGuard } from '@/components/RoleGuard'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

export const Replenishment = () => (
  <RoleGuard
    required="edit"
    fallback={
      <div className="card p-6 text-center text-slate-600">
        ฟีเจอร์นี้สำหรับ Editor ขึ้นไป — สามารถ <strong>view</strong> ได้แต่แก้ไขไม่ได้
        <ReplenishmentInner readOnly />
      </div>
    }
  >
    <ReplenishmentInner />
  </RoleGuard>
)

const ReplenishmentInner = ({ readOnly }: { readOnly?: boolean } = {}) => {
  const { user } = useAuth()
  const ws = workspaces.current()
  const [version, setVersion] = useState(0)
  const isAdmin = can(user?.role, 'admin')
  const isEditor = can(user?.role, 'edit')

  // Seed defaults on first mount
  useEffect(() => {
    if (ws) {
      const products = dataset.products(ws.id)
      replenishmentStore.seedDefaults(ws.id, products)
      setVersion((v) => v + 1)
    }
  }, [ws?.id])

  if (!ws || !user) return null

  const products = dataset.products(ws.id)
  const configs = useMemo(() => replenishmentStore.get(ws.id), [ws.id, version])
  const customers = dataset.customersWithOverlay(ws.id)

  const saveConfig = (productId: string, productName: string, partial: Partial<ReplenishmentConfig>) => {
    if (!isEditor) return
    const current =
      configs[productId] ?? {
        productId,
        productName,
        cycleDays: 45,
        reminderBefore: 7,
        enabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name,
      }
    replenishmentStore.set(ws.id, productId, {
      ...current,
      ...partial,
      productName,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    })
    setVersion((v) => v + 1)
  }

  // Mock "customers due for replenishment"
  const dueCustomers = useMemo(() => {
    const configured = Object.values(configs).filter((c) => c.enabled)
    if (configured.length === 0) return []
    return customers
      .filter((c) => c.orders >= 2 && c.status !== 'lost' && c.status !== 'ghost')
      .slice(0, 12)
      .map((c, i) => {
        const cfg = configured[i % configured.length]
        const daysAfterLast = Math.floor(
          (Date.now() - new Date(c.lastBuy).getTime()) / 86400_000,
        )
        const daysToReorder = cfg.cycleDays - daysAfterLast
        return {
          customer: c,
          config: cfg,
          daysAfterLast,
          daysToReorder,
          urgency:
            daysToReorder <= 0
              ? 'overdue'
              : daysToReorder <= cfg.reminderBefore
                ? 'due-soon'
                : 'on-track',
        }
      })
      .sort((a, b) => a.daysToReorder - b.daysToReorder)
  }, [customers, configs])

  const configuredCount = Object.values(configs).filter((c) => c.enabled).length
  const dueSoonCount = dueCustomers.filter((d) => d.urgency === 'due-soon').length
  const overdueCount = dueCustomers.filter((d) => d.urgency === 'overdue').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-600" />
            Product Follow-up & Replenishment
            {readOnly && (
              <span className="chip bg-amber-100 text-amber-700 text-[10px]">read-only</span>
            )}
          </h1>
          <p className="muted">
            ตั้งรอบการเติมสินค้าของแต่ละ SKU — ระบบจะใช้ส่งโปรกระตุ้นเมื่อลูกค้าใกล้ครบรอบ
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          tone="tone-product"
          label="Configured SKU"
          value={String(configuredCount)}
          sub={`จาก ${products.length} ตัว`}
        />
        <StatCard
          icon={Bell}
          tone="tone-risk"
          label="ใกล้ครบรอบ"
          value={String(dueSoonCount)}
          sub="ส่งโปรได้เลย"
        />
        <StatCard
          icon={AlertCircle}
          tone="tone-retention"
          label="เลยรอบแล้ว"
          value={String(overdueCount)}
          sub="ลูกค้าอาจไปแล้ว"
        />
        <StatCard
          icon={Sparkles}
          tone="tone-customer"
          label="AI ใช้ข้อมูลนี้"
          value="✓"
          sub="ใน Intelligence Brief"
        />
      </div>

      {/* Replenishment config table */}
      <section className="story-section">
        <div className="story-header">
          <Calendar className="w-5 h-5 text-violet-600" />
          <h2 className="story-title">ตั้งรอบการเติมสินค้าต่อ SKU</h2>
          <span className="story-sub">
            {isEditor ? 'แก้ไขได้' : 'Admin/Editor เท่านั้นแก้ไขได้'} · ค่าถูกบันทึกอัตโนมัติ
          </span>
        </div>

        <div className="card tone-product overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-50/40 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">สินค้า</th>
                  <th className="text-right px-3 py-2.5 font-semibold">รายได้</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-32">รอบซื้อใหม่ (วัน)</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-32">เตือนก่อน (วัน)</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-24">เปิด</th>
                  <th className="text-left px-3 py-2.5 font-semibold">อัปเดต</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 15).map((p) => {
                  const cfg = configs[p.id]
                  const enabled = cfg?.enabled ?? false
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-t border-violet-100/30',
                        enabled ? 'bg-white' : 'bg-slate-50/30 opacity-70',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 max-w-xs truncate">
                          {p.name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-brand-700">
                        {formatTHB(p.revenue, { compact: true })}
                      </td>
                      <td className="px-3 py-3 text-right">{formatNumber(p.customers)}</td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={cfg?.cycleDays ?? 45}
                          disabled={!isEditor}
                          onChange={(e) =>
                            saveConfig(p.id, p.name, {
                              cycleDays: Math.max(1, Number(e.target.value) || 0),
                            })
                          }
                          className="w-20 px-2 py-1 rounded-lg border border-violet-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={cfg?.reminderBefore ?? 7}
                          disabled={!isEditor}
                          onChange={(e) =>
                            saveConfig(p.id, p.name, {
                              reminderBefore: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-20 px-2 py-1 rounded-lg border border-violet-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={!isEditor}
                            onChange={(e) =>
                              saveConfig(p.id, p.name, { enabled: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div
                            className={cn(
                              'w-10 h-5 rounded-full transition-colors relative',
                              enabled ? 'bg-emerald-500' : 'bg-slate-300',
                              !isEditor && 'opacity-50 cursor-not-allowed',
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                                enabled ? 'translate-x-5' : 'translate-x-0.5',
                              )}
                            />
                          </div>
                        </label>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-slate-500">
                        {cfg ? (
                          <>
                            โดย {cfg.updatedBy}
                            <br />
                            {new Date(cfg.updatedAt).toLocaleDateString('th-TH')}
                          </>
                        ) : (
                          <span className="italic text-slate-400">ยังไม่ตั้ง</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI Recommendations — customers due for replenishment */}
      <section className="story-section">
        <div className="story-header">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="story-title">ลูกค้าที่ AI แนะนำให้ส่งโปร replenishment</h2>
          <span className="story-sub">
            อิงจากรอบสินค้าที่ตั้งไว้ × ประวัติการซื้อของลูกค้า
          </span>
        </div>

        {dueCustomers.length === 0 ? (
          <div className="card tone-neutral p-8 text-center text-slate-500">
            ยังไม่มีลูกค้าใกล้ครบรอบ — ตั้ง config ด้านบนก่อน
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dueCustomers.map(({ customer, config, daysAfterLast, daysToReorder, urgency }) => (
              <div
                key={customer.id}
                className={cn(
                  'card p-4 border-2',
                  urgency === 'overdue'
                    ? 'border-rose-200 bg-rose-50/40'
                    : urgency === 'due-soon'
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{customer.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {customer.phone} · {customer.orders} ออเดอร์
                    </div>
                  </div>
                  <div
                    className={cn(
                      'chip text-[10px] font-bold',
                      urgency === 'overdue'
                        ? 'bg-rose-100 text-rose-700'
                        : urgency === 'due-soon'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {urgency === 'overdue'
                      ? `⚠️ เลย ${-daysToReorder} วัน`
                      : urgency === 'due-soon'
                        ? `⏰ อีก ${daysToReorder} วัน`
                        : `✓ ปกติ`}
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-2.5 mt-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">สินค้า:</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px]">
                      {config.productName}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">ซื้อล่าสุด:</span>
                    <span className="font-medium">{daysAfterLast} วันที่แล้ว</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">รอบปกติ:</span>
                    <span className="font-medium">{config.cycleDays} วัน</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="btn-soft text-[11px] justify-center flex-1">
                    <TrendingUp className="w-3 h-3" /> ส่งโปร
                  </button>
                  <button className="btn-ghost text-[11px] justify-center flex-1">
                    <RotateCw className="w-3 h-3" /> เตือน sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Help card */}
      <div className="card tone-customer p-5">
        <div className="flex items-start gap-3">
          <Save className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <div className="font-semibold text-emerald-800 mb-1">
              💡 ระบบใช้ข้อมูลนี้อย่างไร?
            </div>
            <ul className="space-y-1 list-disc pl-5">
              <li>AI ใน Intelligence Brief จะคำนวณว่าลูกค้าคนไหน "ใกล้ครบรอบ" และเสนอ action ทันที</li>
              <li>หน้า Customer Detail จะแสดงรอบของแต่ละสินค้าที่ลูกค้าเคยซื้อ + ทำนายวันที่ควรซื้อใหม่</li>
              <li>Telesale pipeline จะ priority ลูกค้าที่ใกล้ครบรอบขึ้นมาเป็น Hot lead อัตโนมัติ</li>
              <li>AI สามารถใช้ข้อมูลนี้แนะนำ bundle / cross-sell ตอนลูกค้าใกล้สั่งซ้ำ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: any
  tone: string
  label: string
  value: string
  sub: string
}) => (
  <div className={`card p-4 ${tone}`}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
        <div className="text-[11px] text-slate-500">{sub}</div>
      </div>
    </div>
  </div>
)
