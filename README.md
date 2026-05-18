# EizBrain — Customer Intelligence Mock-up

Mock-up ของ web-app แดชบอร์ดวิเคราะห์ลูกค้า / segmentation / telesale enrollment / AI insights

สร้างด้วย **React + Vite + TypeScript + Tailwind CSS + Recharts**

## 🚀 วิธีรันใน local

ต้องการ **Node.js 18+** และ **npm** (หรือ pnpm/yarn ก็ได้)

```bash
# 1. clone repo
git clone <repo-url>
cd "Mock-up Eiz brain"

# 2. ติดตั้ง dependencies
npm install

# 3. รัน dev server
npm run dev
```

เปิด browser ไปที่ **http://localhost:5173**

### Demo accounts (รหัสผ่านอะไรก็ได้)
- `admin@eizbrain.io` — Admin (เห็นทุกหน้า + แก้ KPI/Sales/Replenishment ได้)
- `editor@eizbrain.io` — Editor (เห็นทุกหน้ายกเว้น Sales Team)
- `viewer@eizbrain.io` — Viewer (view อย่างเดียว)

### Optional — Custom mascot image
หน้า login และ floating AI button ใช้ mascot icon ถ้าต้องการใช้รูป 3D มาสคอตของคุณ:
- save ไฟล์เป็น `public/mascot.png`
- ระบบจะใช้รูปนั้นแทน SVG fallback อัตโนมัติ

## 📁 โครงสร้าง

```
src/
├── pages/                    # Pages
│   ├── IntelligenceBrief.tsx # 🌟 หน้าแรก — AI summary + action cards
│   ├── Login.tsx             # Login + เลือก role
│   ├── Workspaces.tsx        # เลือก workspace (3 ตัวอย่าง)
│   ├── dashboard/            # 5 sub-pages
│   │   ├── SalePerformance.tsx
│   │   ├── Growth.tsx
│   │   ├── Geography.tsx     # Thailand map
│   │   ├── Products.tsx      # Top 20 + Co-purchase matrix
│   │   └── Retention.tsx     # Cohort heatmap
│   ├── segments/             # 4 sub-pages (Marketing / Telesale / Ads / RFM)
│   ├── Customers.tsx         # ลูกค้าทั้งหมด + AI per-customer
│   ├── CustomerDetail.tsx
│   ├── Enrollment.tsx        # 🔀 Reshuffle + Lock
│   ├── Replenishment.tsx     # 📦 ตั้งรอบสินค้า
│   └── SalesTeam.tsx         # Admin only
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx, Topbar.tsx
│   ├── AIPanels.tsx          # Floating AI Summary + Chat
│   ├── Mascot.tsx
│   ├── ThailandMap.tsx
│   └── ...
└── lib/                      # Mock data + helpers
    ├── mock-data.ts          # Customers / sales / products generators
    ├── auth.ts, storage.ts
    ├── workspaces.ts         # 3 demo workspaces
    ├── page-summary.ts       # AI scope-aware summaries
    ├── dashboard-filter.ts   # Cross-filter logic
    ├── segment-strategies.ts # Marketing strategies per segment
    ├── ai-mock.ts            # Per-customer AI insight
    └── brief-insights.ts     # Intelligence Brief data builders
```

## ✨ Features

### หน้าหลัก
- **Intelligence Brief** (สรุปอัจฉริยะ) — AI executive summary + 8 action cards
- **Dashboard** (5 sub-pages): Sale Performance / Growth / Geography / Products / Retention
- **Customer Segments** (4 sub-pages): Marketing / Telesale / Ads / RFM Analysis
- **Customers** — รายชื่อ + AI per-customer
- **Enrollment** — Pipeline by Sale + 🔀 Reshuffle + 🔒 Lock
- **Replenishment** — Admin ตั้งรอบเติมสินค้า (Editor+)
- **Sales Team** — Performance + AI KPI analysis (Admin only)

### Cross-cutting
- 🌐 **Cross-filtering** — คลิก chart ใดก็ filter ทั้งหน้า (Dashboard pages)
- ⚖️ **Compare mode** — split screen 2 ฝั่ง filter อิสระ
- 🛡️ **Role-based access** — Admin / Editor / Viewer
- 🏢 **Multi-workspace** — แต่ละ workspace ใช้ data source ต่างกัน
- 🤖 **Floating AI panels** (ทุกหน้ายกเว้น /brief)
  - Mascot button ขวาบน → Executive Summary (resizable, fullscreen, reset)
  - Chat button ขวาล่าง → Chat with AI (persistent, ถาม Thai)

### State persistence
ทุกอย่างเก็บใน LocalStorage prefix `eiz-brain:`
- login user · current workspace
- KPI config per workspace
- Sales team list per workspace
- Customer enrollment overlay (assignment + lock + call priority)
- Replenishment config per product

ล้าง state: DevTools → Application → Local Storage → กดลบ keys

## 🛠 Scripts

```bash
npm run dev      # dev server (HMR)
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

### Embedding under a sub-path

For embedding the built dist inside another app (e.g. iframed under `/mockup-static/`), set `VITE_BASE_PATH` at build time:

```bash
VITE_BASE_PATH=/mockup-static/ npm run build
# → dist/index.html now references /mockup-static/assets/*
```

On Windows Git Bash, prefix with `MSYS_NO_PATHCONV=1` to keep the leading slash intact.

## 📝 หมายเหตุ

- ทุกข้อมูลเป็น **mock** (สร้างจาก deterministic seed ตาม workspace ID)
- AI insights / chat replies ใช้ rule-based mock — ยังไม่ได้ต่อ LLM จริง
- Build warning เรื่อง bundle size > 500KB — สำหรับ production ควร code-split lazy routes

## 🎨 Tech Stack

| Layer        | Library                            |
| ------------ | ---------------------------------- |
| Framework    | React 18 + TypeScript              |
| Build tool   | Vite 5                             |
| Routing      | React Router 6                     |
| Styling      | Tailwind CSS 3 + custom tones      |
| Charts       | Recharts 2                         |
| Icons        | Lucide React                       |
| State        | useState + LocalStorage            |
| Fonts        | Prompt + IBM Plex Sans Thai (Google Fonts) |
