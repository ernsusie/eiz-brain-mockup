import { MapPin, TrendingUp, Users, ShoppingBag, Trophy } from 'lucide-react'
import { ThailandMap } from '@/components/ThailandMap'
import { workspaces } from '@/lib/workspaces'
import { dataset } from '@/lib/mock-data'
import { formatNumber, formatTHB } from '@/lib/utils'

export const Geography = () => {
  const ws = workspaces.current()
  if (!ws) return null
  const provinces = dataset.provinces(ws.id)
  const totalRevenue = provinces.reduce((s, p) => s + p.revenue, 0)
  const totalCustomers = provinces.reduce((s, p) => s + p.customers, 0)
  const top3 = provinces.slice(0, 3)
  const top3Share = (top3.reduce((s, p) => s + p.revenue, 0) / totalRevenue) * 100

  return (
    <div className="space-y-6">
      {/* Story header */}
      <div className="story-section">
        <div className="story-header">
          <MapPin className="w-5 h-5 text-cyan-600" />
          <h2 className="story-title">พื้นที่ขาย — Geography</h2>
          <span className="story-sub">ลูกค้าอยู่ที่ไหน · ยอดขายกระจุกอยู่จังหวัดไหน</span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={MapPin}
            label="จังหวัดที่ขาย"
            value="262"
            sub="จากทั้งหมด 77 จังหวัด"
          />
          <StatCard
            icon={Users}
            label="ลูกค้าทั้งหมด"
            value={formatNumber(totalCustomers, { compact: true })}
            sub="คนที่ซื้อซ้ำกระจาย"
          />
          <StatCard
            icon={TrendingUp}
            label="ยอดขายรวม"
            value={formatTHB(totalRevenue, { compact: true })}
            sub="จากทุกจังหวัด"
          />
          <StatCard
            icon={Trophy}
            label="Top 3 ครองส่วนแบ่ง"
            value={`${top3Share.toFixed(0)}%`}
            sub={top3.map((t) => t.province).join(' · ')}
            highlight
          />
        </div>
      </div>

      {/* Map + Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card tone-geo p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-slate-900">แผนที่ประเทศไทย</div>
              <div className="muted">วงกลม = ขนาดยอดขาย · hover ดูรายละเอียด</div>
            </div>
            <span className="chip bg-cyan-100 text-cyan-700">มุมมองแผนที่</span>
          </div>
          <ThailandMap data={provinces} />
        </div>

        <div className="card tone-revenue p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-900">Top 10 จังหวัดยอดขายสูงสุด</div>
            <span className="chip bg-brand-100 text-brand-700">เรียงตามยอด</span>
          </div>
          <div className="space-y-2.5">
            {provinces.map((p, i) => (
              <div key={p.province} className="group">
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i < 3
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-semibold">{p.province}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">
                      {formatTHB(p.revenue, { compact: true })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatNumber(p.orders)} ออเดอร์
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-coral-500 transition-all group-hover:from-brand-500 group-hover:to-coral-600"
                    style={{ width: `${(p.revenue / provinces[0].revenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story: insight box */}
      <div className="card tone-customer p-5">
        <div className="flex items-start gap-3">
          <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-800 mb-1">
              💡 ข้อสังเกตจากพื้นที่ขาย
            </div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>
                <span className="font-semibold">{top3[0].province}</span> ครองยอดขายสูงสุด ที่{' '}
                {formatTHB(top3[0].revenue, { compact: true })} (
                {((top3[0].revenue / totalRevenue) * 100).toFixed(1)}% ของทั้งหมด)
              </li>
              <li>
                Top 3 จังหวัดรวมกัน {top3Share.toFixed(0)}% — กระจุกอยู่{' '}
                <strong>ภาคกลาง</strong> ส่วนใหญ่ ถ้าจะกระจายเสี่ยงควรเพิ่ม ads ในภาคอื่น
              </li>
              <li>
                จังหวัดท่องเที่ยว (<strong>ภูเก็ต / เชียงใหม่</strong>) ยังมีศักยภาพ — ลูกค้า
                spending power สูงแต่ frequency ต่ำ เหมาะกับโปร trial pack
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: any
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) => (
  <div className={`card p-4 ${highlight ? 'tone-revenue' : 'tone-geo'}`}>
    <div className="flex items-start gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          highlight ? 'bg-brand-100 text-brand-700' : 'bg-cyan-100 text-cyan-700'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 font-medium">{label}</div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
        {sub && <div className="text-[11px] text-slate-500 truncate">{sub}</div>}
      </div>
    </div>
  </div>
)
