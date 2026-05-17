import { useState } from 'react'
import { formatTHB } from '@/lib/utils'

interface ProvincePoint {
  name: string
  region: 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south'
  x: number
  y: number
  revenue: number
  orders: number
  customers: number
}

interface Props {
  data: { province: string; revenue: number; orders: number; customers: number }[]
}

// Approximate map coordinates (x,y) on the SVG canvas for each major province.
// The canvas is 320x460; coordinates are roughly proportional to Thailand's geography.
const COORDS: Record<string, { region: ProvincePoint['region']; x: number; y: number }> = {
  เชียงใหม่: { region: 'north', x: 110, y: 70 },
  เชียงราย: { region: 'north', x: 140, y: 40 },
  ขอนแก่น: { region: 'northeast', x: 200, y: 140 },
  นครราชสีมา: { region: 'northeast', x: 190, y: 195 },
  อุดรธานี: { region: 'northeast', x: 200, y: 100 },
  กรุงเทพมหานคร: { region: 'central', x: 165, y: 230 },
  นนทบุรี: { region: 'central', x: 158, y: 222 },
  ปทุมธานี: { region: 'central', x: 168, y: 215 },
  สมุทรปราการ: { region: 'central', x: 172, y: 240 },
  นครปฐม: { region: 'central', x: 148, y: 232 },
  ชลบุรี: { region: 'east', x: 195, y: 248 },
  ระยอง: { region: 'east', x: 210, y: 258 },
  ภูเก็ต: { region: 'south', x: 130, y: 380 },
  สงขลา: { region: 'south', x: 170, y: 430 },
}

const REGION_LABELS: Record<ProvincePoint['region'], string> = {
  north: 'ภาคเหนือ',
  northeast: 'ภาคอีสาน',
  central: 'ภาคกลาง',
  east: 'ภาคตะวันออก',
  west: 'ภาคตะวันตก',
  south: 'ภาคใต้',
}

export const ThailandMap = ({ data }: Props) => {
  const [hover, setHover] = useState<ProvincePoint | null>(null)

  const points: ProvincePoint[] = data
    .filter((d) => COORDS[d.province])
    .map((d) => ({
      name: d.province,
      ...COORDS[d.province],
      revenue: d.revenue,
      orders: d.orders,
      customers: d.customers,
    }))

  const maxRev = Math.max(...points.map((p) => p.revenue), 1)
  const radius = (rev: number) => 6 + (rev / maxRev) * 22
  const color = (rev: number) => {
    const t = rev / maxRev
    if (t > 0.7) return '#ff5722'
    if (t > 0.4) return '#ff7a00'
    if (t > 0.2) return '#ffb366'
    return '#ffd9b3'
  }

  return (
    <div className="relative">
      <svg
        viewBox="0 0 320 480"
        className="w-full h-auto max-h-[460px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1f5f9" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Stylised Thailand outline — geometric approximation */}
        <path
          d="
            M 105 30
            Q 130 20 165 30
            Q 190 35 210 55
            Q 230 75 235 100
            Q 240 130 220 145
            Q 215 165 230 185
            Q 250 200 245 220
            Q 235 245 215 255
            Q 200 275 195 295
            Q 185 320 170 345
            Q 158 370 145 390
            Q 135 415 145 440
            Q 155 455 170 460
            Q 178 462 175 450
            Q 168 430 162 410
            Q 156 385 158 360
            Q 145 340 135 320
            Q 120 295 110 270
            Q 100 245 95 220
            Q 80 200 75 175
            Q 70 150 80 125
            Q 88 100 95 75
            Q 100 50 105 30
            Z
          "
          fill="url(#land)"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Region labels (subtle) */}
        <g fill="#94a3b8" fontSize="9" fontFamily="Prompt, sans-serif">
          <text x="115" y="60" fontWeight="600">เหนือ</text>
          <text x="195" y="118" fontWeight="600">อีสาน</text>
          <text x="138" y="220" fontWeight="600">กลาง</text>
          <text x="216" y="262" fontWeight="600">ตอ.</text>
          <text x="152" y="395" fontWeight="600">ใต้</text>
        </g>

        {/* Province bubbles */}
        {points.map((p) => (
          <g key={p.name} className="cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r={radius(p.revenue) + 3}
              fill={color(p.revenue)}
              opacity={0.2}
              filter="url(#soft)"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={radius(p.revenue)}
              fill={color(p.revenue)}
              opacity={0.85}
              stroke="white"
              strokeWidth="2"
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            />
            <text
              x={p.x}
              y={p.y - radius(p.revenue) - 5}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#0f172a"
              fontFamily="Prompt, sans-serif"
              className="pointer-events-none"
            >
              {p.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
        <span className="text-[10px] text-slate-500">ยอดขาย</span>
        <span className="w-3 h-3 rounded-full" style={{ background: '#ffd9b3' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#ffb366' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff7a00' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5722' }} />
        <span className="text-[10px] text-slate-500">น้อย → มาก</span>
      </div>

      {/* Hover info */}
      {hover && (
        <div className="absolute top-2 right-2 bg-white shadow-md rounded-2xl p-3 border border-slate-100 text-xs animate-fade-in min-w-[160px]">
          <div className="font-bold text-slate-900 mb-1">{hover.name}</div>
          <div className="text-[10px] uppercase text-slate-400">
            {REGION_LABELS[hover.region]}
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">รายได้</span>
              <span className="font-semibold">{formatTHB(hover.revenue, { compact: true })}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">ออเดอร์</span>
              <span className="font-semibold">{hover.orders.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">ลูกค้า</span>
              <span className="font-semibold">{hover.customers.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
