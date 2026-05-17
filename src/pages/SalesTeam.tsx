import { useMemo, useState } from 'react'
import {
  Trophy,
  Phone,
  TrendingUp,
  Target,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { workspaces } from '@/lib/workspaces'
import { kpiStore, salesStore } from '@/lib/mock-data'
import { cn, formatNumber, formatPct, formatTHB } from '@/lib/utils'
import type { Sale } from '@/types'
import { RoleGuard } from '@/components/RoleGuard'
import { analyzeSaleKpi } from '@/lib/ai-mock'
import { AIInsightModal } from '@/components/AIInsightModal'

export const SalesTeam = () => (
  <RoleGuard required="admin">
    <SalesTeamInner />
  </RoleGuard>
)

const SalesTeamInner = () => {
  const ws = workspaces.current()
  const [type, setType] = useState<'main' | 'telesale'>('telesale')
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTarget, setAiTarget] = useState<Sale | null>(null)

  if (!ws) return null
  const sales = salesStore.get(ws.id)
  const kpi = kpiStore.get(ws.id)

  const filtered = sales.filter((s) => s.type === type)
  const totalRevenue = filtered.reduce((s, x) => s + x.achievedMonthly, 0)
  const totalTarget = filtered.reduce((s, x) => s + x.kpiMonthly, 0)
  const totalAchievement = (totalRevenue / Math.max(1, totalTarget)) * 100
  const topPerformer = [...filtered].sort((a, b) => b.achievedMonthly - a.achievedMonthly)[0]

  const ranked = useMemo(
    () =>
      [...filtered]
        .map((s) => ({
          ...s,
          pct: (s.achievedMonthly / Math.max(1, s.kpiMonthly)) * 100,
        }))
        .sort((a, b) => b.achievedMonthly - a.achievedMonthly),
    [filtered],
  )

  const aiInsight = aiTarget
    ? (() => {
        const analysis = analyzeSaleKpi(aiTarget, aiTarget.kpiMonthly)
        return {
          summary: `${aiTarget.name} ทำได้ ${formatTHB(aiTarget.achievedMonthly, { compact: true })} จาก ${formatTHB(aiTarget.kpiMonthly, { compact: true })} (${analysis.pct}%)`,
          blocks: [
            {
              title: 'สถานะ KPI',
              bullets: [
                `ทำได้ ${analysis.pct}% ของเป้า`,
                `เหลือ ${formatTHB(analysis.remaining, { compact: true })} ใน ${analysis.daysLeft} วัน`,
                `ต้องการเฉลี่ย ${formatTHB(analysis.dailyNeed, { compact: true })} / วัน`,
                `ลูกค้าที่ดูแล ${aiTarget.customersAssigned} คน · Enrolled ${aiTarget.customersEnrolled} คน`,
              ],
            },
            {
              title: 'ข้อสังเกต',
              bullets: analysis.insights,
            },
          ],
          recommendation:
            analysis.pct >= 100
              ? 'พิจารณาขยับเป้า + ให้รางวัล + ใช้เป็น case study'
              : analysis.pct >= 70
                ? 'เร่ง 30% สุดท้าย — โฟกัสกลุ่ม at_risk + cross-sell ลูกค้า champion'
                : analysis.pct >= 40
                  ? 'Re-align lead quality + เพิ่ม touchpoint LINE/SMS + flash sale'
                  : 'Coaching 1:1 + ตรวจคุณภาพ COD + re-assign customers',
          callScript:
            'เริ่มจากลูกค้า hot 10 คนแรกของวัน — ใช้ template ที่ทีมส่งให้ทาง LINE OA ภายในเวลา 11:00 เพื่อทันรอบ check-out 14:00',
          promotion: [
            { name: 'Bundle ผงผัก + แก้วเชค', detail: 'ลด 12% เมื่อสั่ง 2 กระปุก' },
            { name: 'Trial Pack B9', detail: 'ราคา 290฿ ส่งฟรี — ใช้สำหรับ at-risk customers' },
          ],
        }
      })()
    : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Sales Team Performance
          <span className="chip bg-brand-100 text-brand-700 text-[10px]">Admin only</span>
        </h1>
        <p className="muted">ดู performance รายคน + AI วิเคราะห์ KPI</p>
      </div>

      <div className="card p-1 inline-flex gap-1">
        <button
          onClick={() => setType('main')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-medium transition-colors',
            type === 'main'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50',
          )}
        >
          Main Sale Channels
        </button>
        <button
          onClick={() => setType('telesale')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-medium transition-colors',
            type === 'telesale'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50',
          )}
        >
          Telesale Team
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Users}
          label="ทีม"
          value={`${filtered.length} คน`}
          hint={`Active ${filtered.filter((s) => s.active).length} คน`}
        />
        <SummaryCard
          icon={TrendingUp}
          label="ยอดรวม MTD"
          value={formatTHB(totalRevenue, { compact: true })}
          hint={`เป้า ${formatTHB(totalTarget, { compact: true })}`}
        />
        <SummaryCard
          icon={Target}
          label="Achievement"
          value={formatPct(totalAchievement, 1)}
          hint="vs เป้ารวม"
          tone={
            totalAchievement >= 100
              ? 'success'
              : totalAchievement >= 70
                ? 'brand'
                : totalAchievement >= 40
                  ? 'warning'
                  : 'danger'
          }
        />
        <SummaryCard
          icon={Trophy}
          label="Top Performer"
          value={topPerformer?.name ?? '—'}
          hint={topPerformer ? formatTHB(topPerformer.achievedMonthly, { compact: true }) : '—'}
        />
      </div>

      {/* Ranking bars */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-slate-900">Achievement Ranking</div>
            <div className="muted">
              เป้ารวมทีม {formatTHB(kpi.monthlyRevenueTarget, { compact: true })} / เดือน
            </div>
          </div>
          <span className="text-xs text-slate-500">เปรียบเทียบ % vs KPI</span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(180, ranked.length * 32)}>
          <BarChart data={ranked} layout="vertical" margin={{ top: 4, right: 30, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: '#475569' }}
              width={120}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
              {ranked.map((s) => (
                <Cell
                  key={s.id}
                  fill={
                    s.pct >= 100
                      ? '#10b981'
                      : s.pct >= 70
                        ? '#6366f1'
                        : s.pct >= 40
                          ? '#f59e0b'
                          : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table with AI per-row */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-500" />
          Performance รายคน
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Sale</th>
                <th className="text-right px-3 py-2 font-medium">KPI</th>
                <th className="text-right px-3 py-2 font-medium">Achieved</th>
                <th className="text-right px-3 py-2 font-medium">%</th>
                <th className="text-right px-3 py-2 font-medium">ลูกค้า</th>
                <th className="text-right px-3 py-2 font-medium">Enrolled</th>
                <th className="text-right px-3 py-2 font-medium">Return %</th>
                <th className="text-right px-3 py-2 font-medium">AI</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <span className="text-slate-400 text-xs">#{i + 1}</span>
                      {s.name}
                      {s.pct >= 100 && (
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {s.channel} · {new Date(s.joinedAt).getFullYear()} —
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{formatTHB(s.kpiMonthly, { compact: true })}</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatTHB(s.achievedMonthly, { compact: true })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={cn(
                        'chip',
                        s.pct >= 100
                          ? 'bg-emerald-100 text-emerald-700'
                          : s.pct >= 70
                            ? 'bg-brand-100 text-brand-700'
                            : s.pct >= 40
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {s.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">{s.customersAssigned}</td>
                  <td className="px-3 py-3 text-right text-emerald-700 font-semibold">
                    {s.customersEnrolled}
                  </td>
                  <td className="px-3 py-3 text-right">{s.returnRate}%</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => {
                        setAiTarget(s)
                        setAiOpen(true)
                      }}
                      className="btn-soft text-xs"
                    >
                      <Sparkles className="w-3 h-3" /> วิเคราะห์
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIInsightModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        insight={aiInsight}
        title={aiTarget?.name ?? ''}
        subtitle={aiTarget ? `${aiTarget.type === 'main' ? 'Main Sale' : 'Telesale'} · ${aiTarget.channel}` : undefined}
      />
    </div>
  )
}

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: any
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
}) => {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-100 text-brand-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tones[tone])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-bold text-slate-900 text-lg truncate">{value}</div>
        {hint && <div className="text-[11px] text-slate-500 truncate">{hint}</div>}
      </div>
    </div>
  )
}
