import { useEffect, useState } from 'react'
import { Bell, Globe, Save } from 'lucide-react'
import { storage } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface Prefs {
  emailDailyDigest:    boolean
  emailWeeklyDigest:   boolean
  emailRiskAlerts:     boolean
  emailReturnSpike:    boolean
  inAppEnabled:        boolean
  locale:              'th' | 'en'
  returnRateAlertPct:  number
  riskCustomerAlerts:  number
}

const DEFAULTS: Prefs = {
  emailDailyDigest:   false,
  emailWeeklyDigest:  true,
  emailRiskAlerts:    true,
  emailReturnSpike:   true,
  inAppEnabled:       true,
  locale:             'th',
  returnRateAlertPct: 3,
  riskCustomerAlerts: 100,
}

const KEY = 'settings.notifications'

export const Notifications = () => {
  const [prefs, setPrefs] = useState<Prefs>(() => storage.get<Prefs>(KEY, DEFAULTS))
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSaved(false) }, [prefs])

  const handleSave = () => {
    storage.set(KEY, prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">การแจ้งเตือนทาง Email</h2>
        </div>
        <div className="space-y-2">
          <Toggle
            label="Daily digest"
            sub="สรุปยอดขาย / ลูกค้าใหม่ / risk รายวัน (07:00 ทุกวัน)"
            value={prefs.emailDailyDigest}
            onChange={(v) => setPrefs({ ...prefs, emailDailyDigest: v })}
          />
          <Toggle
            label="Weekly digest"
            sub="รายงานวีคลี่ + เทียบสัปดาห์ก่อนหน้า (จันทร์ 08:00)"
            value={prefs.emailWeeklyDigest}
            onChange={(v) => setPrefs({ ...prefs, emailWeeklyDigest: v })}
          />
          <Toggle
            label="Risk customer alerts"
            sub="แจ้งเมื่อมีลูกค้ากลุ่ม VIP/Cant-lose กำลังจะหลุดเกินจำนวนที่ตั้ง"
            value={prefs.emailRiskAlerts}
            onChange={(v) => setPrefs({ ...prefs, emailRiskAlerts: v })}
          />
          <Toggle
            label="Return rate spike"
            sub="แจ้งเมื่อ return rate วันใดเกิน threshold ที่ตั้ง"
            value={prefs.emailReturnSpike}
            onChange={(v) => setPrefs({ ...prefs, emailReturnSpike: v })}
          />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">In-app notifications</h2>
        <Toggle
          label="เปิดการแจ้งเตือนภายในแอป"
          sub="ระฆัง 🔔 มุมขวาบน + popup แบบสั้น ๆ"
          value={prefs.inAppEnabled}
          onChange={(v) => setPrefs({ ...prefs, inAppEnabled: v })}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Threshold การเตือน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberPref
            label="Return rate alert (%)"
            value={prefs.returnRateAlertPct}
            onChange={(v) => setPrefs({ ...prefs, returnRateAlertPct: v })}
            step={0.5}
            sub={`เตือนเมื่อ return rate รายวันเกิน ${prefs.returnRateAlertPct}%`}
          />
          <NumberPref
            label="Risk customer alert (คน)"
            value={prefs.riskCustomerAlerts}
            onChange={(v) => setPrefs({ ...prefs, riskCustomerAlerts: v })}
            step={10}
            sub={`เตือนเมื่อจำนวนลูกค้ากลุ่มเสี่ยงเกิน ${prefs.riskCustomerAlerts} คน`}
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">ภาษา</h2>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 p-1">
          <LocaleBtn
            label="ไทย"
            active={prefs.locale === 'th'}
            onClick={() => setPrefs({ ...prefs, locale: 'th' })}
          />
          <LocaleBtn
            label="English"
            active={prefs.locale === 'en'}
            onClick={() => setPrefs({ ...prefs, locale: 'en' })}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          ⓘ การเปลี่ยนภาษาใน mockup ยังไม่ถูกนำไปใช้กับเนื้อหา (เนื้อหาเป็นไทยทั้งหมด)
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
        >
          <Save className="w-4 h-4" /> บันทึก
        </button>
        {saved && <span className="text-xs text-emerald-600 font-semibold">✓ บันทึกแล้ว</span>}
      </div>
    </div>
  )
}

const Toggle = ({
  label,
  sub,
  value,
  onChange,
}: {
  label: string
  sub: string
  value: boolean
  onChange: (v: boolean) => void
}) => (
  <div className="flex items-center justify-between py-2 px-1">
    <div>
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        value ? 'bg-brand-500' : 'bg-slate-300',
      )}
      aria-pressed={value}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
          value ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  </div>
)

const NumberPref = ({
  label,
  value,
  onChange,
  step,
  sub,
}: {
  label:    string
  value:    number
  onChange: (n: number) => void
  step:     number
  sub:      string
}) => (
  <div>
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      step={step}
      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 text-sm tabular-nums"
    />
    <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
  </div>
)

const LocaleBtn = ({
  label,
  active,
  onClick,
}: {
  label:   string
  active:  boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
      active ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50',
    )}
  >
    {label}
  </button>
)
