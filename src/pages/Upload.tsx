import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileWarning,
  History,
  Trash2,
  Upload as UploadIcon,
} from 'lucide-react'
import { RoleGuard } from '@/components/RoleGuard'
import { useAuth } from '@/lib/auth'
import { workspaces } from '@/lib/workspaces'
import { storage } from '@/lib/storage'
import { cn, formatNumber, relativeTime } from '@/lib/utils'

/* Canonical columns mirrored from the eiz-brain project — the
 * mockup matches against the same role set so the UX is faithful to
 * what the real upload flow uploads to ClickHouse. */
const CANONICAL_COLUMNS = [
  { key: 'transaction_date', label: 'วันที่สั่งซื้อ',  required: true,  hints: ['date', 'order date', 'วันที่'] },
  { key: 'order_id',         label: 'เลขที่คำสั่งซื้อ', required: true,  hints: ['order', 'order no', 'เลขที่'] },
  { key: 'customer_id',      label: 'หมายเลขลูกค้า',    required: true,  hints: ['customer', 'cust', 'รหัสลูกค้า'] },
  { key: 'customer_name',    label: 'ชื่อลูกค้า',       required: false, hints: ['name', 'ลูกค้า', 'ชื่อ'] },
  { key: 'phone',            label: 'เบอร์โทรศัพท์',   required: false, hints: ['phone', 'mobile', 'เบอร์'] },
  { key: 'email',            label: 'อีเมล',           required: false, hints: ['email', 'mail'] },
  { key: 'amount',           label: 'รวมทั้งสิ้น',     required: true,  hints: ['total', 'amount', 'รวม', 'ยอด'] },
  { key: 'channel',          label: 'ช่องทางการขาย',  required: false, hints: ['channel', 'source', 'ช่อง'] },
  { key: 'product_name',     label: 'ชื่อสินค้า',      required: false, hints: ['product', 'item', 'สินค้า'] },
  { key: 'quantity',         label: 'จำนวน',            required: false, hints: ['qty', 'quantity', 'จำนวน'] },
  { key: 'salesperson',      label: 'พนักงานขาย',     required: false, hints: ['sale', 'salesperson', 'พนักงาน'] },
  { key: 'order_status',     label: 'สถานะคำสั่งซื้อ', required: false, hints: ['status', 'สถานะ'] },
] as const

type Mapping = Record<string, string>      // canonical → source header

interface UploadRecord {
  id:         string
  workspace:  string
  filename:   string
  rowCount:   number
  matchPct:   number
  uploadedBy: string
  uploadedAt: string
  missing:    string[]
}

const HISTORY_KEY = (wsId: string) => `mockup.uploads.${wsId}`

export const Upload = () => {
  return (
    <RoleGuard required="edit">
      <UploadInner />
    </RoleGuard>
  )
}

const UploadInner = () => {
  const { user } = useAuth()
  const ws = workspaces.current()
  if (!ws) return null

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<string[][]>([])
  const [rowCount, setRowCount] = useState(0)
  const [mapping, setMapping] = useState<Mapping>({})
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)

  const [history, setHistory] = useState<UploadRecord[]>(
    () => storage.get<UploadRecord[]>(HISTORY_KEY(ws.id), []),
  )

  useEffect(() => {
    storage.set(HISTORY_KEY(ws.id), history)
  }, [history, ws.id])

  const reset = () => {
    setStep(1)
    setFile(null)
    setHeaders([])
    setSampleRows([])
    setRowCount(0)
    setMapping({})
    setParseError(null)
  }

  const handleFile = async (f: File) => {
    setParsing(true)
    setParseError(null)
    setFile(f)
    try {
      const text = await f.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length === 0) throw new Error('ไฟล์ว่าง')
      /* Very light CSV split — only handles the simple case, which
       *  is fine for a mockup. Real eiz-brain uses papaparse. */
      const hdr = splitCsv(lines[0])
      const rows = lines.slice(1, 6).map(splitCsv)
      setHeaders(hdr)
      setSampleRows(rows)
      setRowCount(lines.length - 1)
      setMapping(autoMatch(hdr))
      setStep(2)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err))
    } finally {
      setParsing(false)
    }
  }

  const matchedRequired = CANONICAL_COLUMNS.filter(
    (c) => c.required && mapping[c.key],
  ).length
  const totalRequired = CANONICAL_COLUMNS.filter((c) => c.required).length
  const matchedTotal = Object.values(mapping).filter(Boolean).length
  const matchPct = Math.round((matchedTotal / CANONICAL_COLUMNS.length) * 100)
  const missingRequired = CANONICAL_COLUMNS
    .filter((c) => c.required && !mapping[c.key])
    .map((c) => c.label)

  const commit = () => {
    setCommitting(true)
    /* Pretend to upload — fake 1.2s delay so the button feel real. */
    setTimeout(() => {
      const rec: UploadRecord = {
        id:         `up-${Date.now().toString(36)}`,
        workspace:  ws.id,
        filename:   file?.name ?? 'untitled.csv',
        rowCount,
        matchPct,
        uploadedBy: user?.name ?? 'unknown',
        uploadedAt: new Date().toISOString(),
        missing:    CANONICAL_COLUMNS
                      .filter((c) => !mapping[c.key])
                      .map((c) => c.label),
      }
      setHistory((h) => [rec, ...h].slice(0, 30))
      setCommitting(false)
      setStep(3)
    }, 1200)
  }

  const deleteUpload = (id: string) => {
    if (!confirm('ลบ record การ upload นี้?')) return
    setHistory((h) => h.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 text-white flex items-center justify-center shadow-sm">
            <UploadIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">นำเข้าข้อมูลยอดขาย</h1>
            <p className="text-xs text-slate-500">
              อัปโหลด CSV / Excel — ระบบจะ match column ให้อัตโนมัติ และเก็บใน
              workspace <strong>{ws.nameTh}</strong>
            </p>
          </div>
        </div>
      </div>

      <Stepper step={step} />

      {step === 1 && (
        <Dropzone
          file={file}
          parsing={parsing}
          error={parseError}
          onPick={handleFile}
        />
      )}

      {step === 2 && file && (
        <MapPreview
          file={file}
          headers={headers}
          sampleRows={sampleRows}
          rowCount={rowCount}
          mapping={mapping}
          setMapping={setMapping}
          matchedRequired={matchedRequired}
          totalRequired={totalRequired}
          matchPct={matchPct}
          missingRequired={missingRequired}
          onBack={reset}
          onCommit={commit}
          committing={committing}
        />
      )}

      {step === 3 && file && (
        <SuccessCard
          filename={file.name}
          rowCount={rowCount}
          matchPct={matchPct}
          onAnother={reset}
        />
      )}

      <HistoryList history={history} onDelete={deleteUpload} />
    </div>
  )
}

/* ── helpers ──────────────────────────────────────────────────────── */

function splitCsv(line: string): string[] {
  /* Minimal — supports quoted commas, no escapes-within-quotes. */
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === ',' && !inQ) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function autoMatch(headers: string[]): Mapping {
  const m: Mapping = {}
  for (const col of CANONICAL_COLUMNS) {
    const hit = headers.find((h) => {
      const lower = h.toLowerCase()
      return (
        lower === col.key ||
        lower === col.label.toLowerCase() ||
        col.hints.some((hint) => lower.includes(hint.toLowerCase()))
      )
    })
    if (hit) m[col.key] = hit
  }
  return m
}

/* ── sub-components ──────────────────────────────────────────────── */

const Stepper = ({ step }: { step: 1 | 2 | 3 }) => {
  const items = [
    { n: 1, label: 'เลือกไฟล์' },
    { n: 2, label: 'Map column' },
    { n: 3, label: 'ยืนยัน' },
  ]
  return (
    <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
      {items.map((it, i) => {
        const active = step === it.n
        const done = step > it.n
        return (
          <div key={it.n} className="flex items-center flex-1">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1',
                active && 'bg-brand-50 text-brand-700',
                done && 'text-emerald-600',
                !active && !done && 'text-slate-400',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  active && 'bg-brand-600 text-white',
                  done && 'bg-emerald-500 text-white',
                  !active && !done && 'bg-slate-200 text-slate-500',
                )}
              >
                {done ? '✓' : it.n}
              </div>
              <span className="text-sm font-medium">{it.label}</span>
            </div>
            {i < items.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

const Dropzone = ({
  file,
  parsing,
  error,
  onPick,
}: {
  file:    File | null
  parsing: boolean
  error:   string | null
  onPick:  (f: File) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onPick(f)
      }}
      className={cn(
        'card p-10 text-center border-2 border-dashed transition-colors',
        dragging
          ? 'border-brand-400 bg-brand-50'
          : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-3">
        <UploadIcon className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-slate-900 mb-1">ลากไฟล์มาวางที่นี่</h3>
      <p className="text-xs text-slate-500 mb-4">
        รองรับ CSV / TXT — รูปแบบ comma-separated, header เป็นแถวแรก (Excel: export เป็น .csv ก่อน)
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
      >
        เลือกไฟล์จากเครื่อง
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
      {parsing && <p className="mt-4 text-sm text-slate-500">กำลังอ่านไฟล์…</p>}
      {error && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
          <FileWarning className="w-4 h-4" /> {error}
        </p>
      )}
      {file && !parsing && !error && (
        <p className="mt-4 text-xs text-slate-500">เลือก: <strong>{file.name}</strong></p>
      )}
    </div>
  )
}

const MapPreview = ({
  file,
  headers,
  sampleRows,
  rowCount,
  mapping,
  setMapping,
  matchedRequired,
  totalRequired,
  matchPct,
  missingRequired,
  onBack,
  onCommit,
  committing,
}: {
  file:            File
  headers:         string[]
  sampleRows:      string[][]
  rowCount:        number
  mapping:         Mapping
  setMapping:      (m: Mapping) => void
  matchedRequired: number
  totalRequired:   number
  matchPct:        number
  missingRequired: string[]
  onBack:          () => void
  onCommit:        () => void
  committing:      boolean
}) => {
  const canCommit = matchedRequired === totalRequired && !committing
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{file.name}</div>
              <div className="text-xs text-slate-500">
                {formatNumber(rowCount)} แถว · {headers.length} columns
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-2xl font-bold',
                matchPct >= 80
                  ? 'text-emerald-600'
                  : matchPct >= 50
                    ? 'text-amber-600'
                    : 'text-rose-600',
              )}
            >
              {matchPct}%
            </div>
            <div className="text-[11px] text-slate-500">column match</div>
          </div>
        </div>

        {missingRequired.length > 0 && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            ❌ ยังขาด required column: <strong>{missingRequired.join(', ')}</strong>
          </div>
        )}

        <div className="space-y-2">
          {CANONICAL_COLUMNS.map((col) => {
            const matched = !!mapping[col.key]
            return (
              <div
                key={col.key}
                className="flex flex-wrap items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50"
              >
                <div className="w-48 shrink-0">
                  <div className="text-sm font-medium text-slate-900">
                    {col.label}
                    {col.required && <span className="text-rose-500 ml-1">*</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{col.key}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                <select
                  value={mapping[col.key] ?? ''}
                  onChange={(e) =>
                    setMapping({ ...mapping, [col.key]: e.target.value })
                  }
                  className={cn(
                    'flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border text-sm bg-white',
                    matched
                      ? 'border-emerald-200 text-slate-900'
                      : col.required
                        ? 'border-rose-200 text-rose-700 bg-rose-50/40'
                        : 'border-slate-200 text-slate-500',
                  )}
                >
                  <option value="">— ไม่ match —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {matched && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Preview (5 แถวแรก)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleRows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                      {c || <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          ← เปลี่ยนไฟล์
        </button>
        <button
          onClick={onCommit}
          disabled={!canCommit}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ml-auto',
            canCommit
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
          )}
        >
          {committing ? 'กำลังนำเข้า…' : '⬆ ยืนยันและนำเข้า'}
        </button>
      </div>
    </div>
  )
}

const SuccessCard = ({
  filename,
  rowCount,
  matchPct,
  onAnother,
}: {
  filename:  string
  rowCount:  number
  matchPct:  number
  onAnother: () => void
}) => (
  <div className="card p-8 text-center">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
      <CheckCircle2 className="w-8 h-8" />
    </div>
    <h2 className="text-lg font-bold text-slate-900">นำเข้าสำเร็จ</h2>
    <p className="text-sm text-slate-500 mt-1">
      <strong>{filename}</strong> · {formatNumber(rowCount)} แถว · match {matchPct}%
    </p>
    <p className="text-[11px] text-slate-400 mt-2">
      ⓘ ใน mockup นี้ข้อมูลถูกบันทึก mock ใน localStorage — production จะส่งเข้า ClickHouse จริง
    </p>
    <button
      onClick={onAnother}
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
    >
      อัปโหลดอีกไฟล์
    </button>
  </div>
)

const HistoryList = ({
  history,
  onDelete,
}: {
  history:  UploadRecord[]
  onDelete: (id: string) => void
}) => {
  if (history.length === 0) {
    return (
      <div className="card p-6 text-center">
        <History className="w-5 h-5 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">ยังไม่มีประวัติการ upload ใน workspace นี้</p>
      </div>
    )
  }
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">ประวัติการ Upload ({history.length})</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
          <tr>
            <th className="text-left px-5 py-2 font-semibold">ไฟล์</th>
            <th className="text-right px-5 py-2 font-semibold">แถว</th>
            <th className="text-right px-5 py-2 font-semibold">Match</th>
            <th className="text-left px-5 py-2 font-semibold">โดย</th>
            <th className="text-left px-5 py-2 font-semibold">เมื่อ</th>
            <th className="px-5 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <div className="font-semibold text-slate-900 truncate">{r.filename}</div>
                {r.missing.length > 0 && (
                  <div className="text-[10px] text-amber-600 mt-0.5 truncate">
                    ขาด: {r.missing.join(', ')}
                  </div>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.rowCount)}</td>
              <td className="px-5 py-3 text-right">
                <span
                  className={cn(
                    'text-xs font-semibold',
                    r.matchPct >= 80
                      ? 'text-emerald-600'
                      : r.matchPct >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600',
                  )}
                >
                  {r.matchPct}%
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-slate-600">{r.uploadedBy}</td>
              <td className="px-5 py-3 text-xs text-slate-500">{relativeTime(r.uploadedAt)}</td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => onDelete(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

