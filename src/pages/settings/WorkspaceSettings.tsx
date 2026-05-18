import { useEffect, useState } from 'react'
import { Save, TrendingUp } from 'lucide-react'
import { useAuth, can } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import { kpiStore } from '@/lib/mock-data'
import { cn, formatNumber, formatTHB } from '@/lib/utils'

const ICON_OPTIONS = ['🌿', '💄', '🐾', '🎮', '🛒', '☕', '📚', '👟', '🏠', '🎨']

export const WorkspaceSettings = () => {
  const { user } = useAuth()
  const ws = workspaces.current()
  const canEdit = can(user?.role, 'admin')

  if (!ws) return null

  /* Workspace name/icon are sourced from a const list — we only persist
   *  the user's KPI targets, which is what really moves the dashboard. */
  const initial = kpiStore.get(ws.id)
  const [monthlyRevenue, setMonthlyRevenue]   = useState(initial.monthlyRevenueTarget)
  const [monthlyOrders, setMonthlyOrders]     = useState(initial.monthlyOrdersTarget)
  const [enrollPerSale, setEnrollPerSale]     = useState(initial.enrollmentTargetPerSale)
  const [returnRateMax, setReturnRateMax]     = useState(initial.returnRateMax)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
  }, [monthlyRevenue, monthlyOrders, enrollPerSale, returnRateMax])

  const handleSave = () => {
    kpiStore.set(ws.id, {
      workspaceId:             ws.id,
      monthlyRevenueTarget:    monthlyRevenue,
      monthlyOrdersTarget:     monthlyOrders,
      enrollmentTargetPerSale: enrollPerSale,
      returnRateMax,
      updatedBy:               user?.name ?? 'system',
      updatedAt:               new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">ข้อมูล Workspace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="md:col-span-1 flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-5xl">{ws.icon}</div>
            <div className="text-center">
              <div className="font-bold text-slate-900">{ws.nameTh}</div>
              <div className="text-xs text-slate-500">{ws.name}</div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {ws.members} สมาชิก
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-3 text-sm">
            <Field label="อุตสาหกรรม" value={ws.industry} />
            <Field label="แหล่งข้อมูล" value={ws.dataSource} />
            <Field label="คำอธิบาย"  value={ws.description} fullWidth />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-4">
          ⓘ ในเวอร์ชันจริงจะแก้ชื่อ / icon / industry ได้จากตรงนี้ — ใน mockup สามตัวข้างต้นเป็น demo workspaces ที่ตายตัว
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">เป้าหมาย KPI</h2>
          <span className="text-[11px] text-slate-400">
            {canEdit ? '(บันทึกใน localStorage)' : '(view-only — admin เท่านั้นแก้ได้)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField
            label="ยอดขาย/เดือน (target)"
            value={monthlyRevenue}
            onChange={setMonthlyRevenue}
            hint={`= ${formatTHB(monthlyRevenue, { compact: true })}`}
            step={100_000}
            disabled={!canEdit}
          />
          <NumField
            label="ออร์เดอร์/เดือน (target)"
            value={monthlyOrders}
            onChange={setMonthlyOrders}
            hint={`= ${formatNumber(monthlyOrders)} orders`}
            step={500}
            disabled={!canEdit}
          />
          <NumField
            label="Enrollment/Sale (target)"
            value={enrollPerSale}
            onChange={setEnrollPerSale}
            hint={`${enrollPerSale} ลูกค้า / sale / เดือน`}
            step={5}
            disabled={!canEdit}
          />
          <NumField
            label="Return rate สูงสุด (%)"
            value={returnRateMax}
            onChange={setReturnRateMax}
            hint={`เตือนเมื่อเกิน ${returnRateMax}%`}
            step={0.5}
            disabled={!canEdit}
          />
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
            >
              <Save className="w-4 h-4" /> บันทึก
            </button>
            {saved && (
              <span className="text-xs text-emerald-600 font-semibold">✓ บันทึกแล้ว</span>
            )}
            <p className="ml-auto text-[11px] text-slate-400">
              ปรับครั้งล่าสุดโดย <strong className="text-slate-600">{initial.updatedBy}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="card p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Icon set (preview)</h3>
        <p className="text-xs text-slate-500 mb-3">ตัวเลือก icon สำหรับ workspace ในเวอร์ชันจริง</p>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((ic) => (
            <div
              key={ic}
              className={cn(
                'w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-xl',
                ic === ws.icon ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200',
              )}
            >
              {ic}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
    <p className="text-sm text-slate-900 mt-0.5">{value}</p>
  </div>
)

const NumField = ({
  label,
  value,
  onChange,
  hint,
  step,
  disabled,
}: {
  label:    string
  value:    number
  onChange: (n: number) => void
  hint:     string
  step:     number
  disabled?: boolean
}) => (
  <div>
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      step={step}
      disabled={disabled}
      className={cn(
        'w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums',
        disabled
          ? 'bg-slate-50 text-slate-500 cursor-not-allowed'
          : 'focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200',
      )}
    />
    <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
  </div>
)
