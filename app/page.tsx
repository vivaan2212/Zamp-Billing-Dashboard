'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Metric {
  client_name: string
  slug: string
  done_runs: number
  void_runs: number
  total_runs: number
  gross_revenue: number
  llm_cost: number
  gross_margin: number
  gm_pct: number
}

interface Client {
  id: number
  name: string
  slug: string
  status: string
  rate_per_run: number
  minimum_fee: number
}

interface ChangeRequest {
  id: number
  client_name: string
  field_name: string
  old_value: string
  new_value: string
  reason: string
  status: string
  requested_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = {
  usd: (v: number) => '$' + (v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  pct: (v: number) => (v ?? 0).toFixed(1) + '%',
  num: (v: number) => (v ?? 0).toLocaleString(),
}

function gmColor(pct: number) {
  if (pct >= 50) return 'text-emerald-400'
  if (pct >= 30) return 'text-yellow-400'
  return 'text-red-400'
}

function gmBadge(pct: number) {
  if (pct >= 50) return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
  if (pct >= 30) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
  return 'bg-red-900/40 text-red-300 border border-red-700'
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}


// ── Client Metrics Table ───────────────────────────────────────────────────
function MetricsTable({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
            <th className="text-left py-3 pr-4">Client</th>
            <th className="text-right py-3 px-4">Done Runs</th>
            <th className="text-right py-3 px-4">Void Runs</th>
            <th className="text-right py-3 px-4">Revenue</th>
            <th className="text-right py-3 px-4">LLM Cost</th>
            <th className="text-right py-3 px-4">Gross Margin</th>
            <th className="text-right py-3 pl-4">GM %</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.slug} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
              <td className="py-4 pr-4">
                <span className="font-medium text-white">{m.client_name}</span>
              </td>
              <td className="text-right py-4 px-4 text-zinc-300">{fmt.num(m.done_runs)}</td>
              <td className="text-right py-4 px-4 text-zinc-500">{fmt.num(m.void_runs)}</td>
              <td className="text-right py-4 px-4 text-white font-medium">{fmt.usd(m.gross_revenue)}</td>
              <td className="text-right py-4 px-4 text-zinc-400">{fmt.usd(m.llm_cost)}</td>
              <td className="text-right py-4 px-4 font-medium text-white">{fmt.usd(m.gross_margin)}</td>
              <td className="text-right py-4 pl-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${gmBadge(m.gm_pct)}`}>
                  {fmt.pct(m.gm_pct)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Rate Config Panel ──────────────────────────────────────────────────────
function ConfigPanel({
  clients,
  onSubmitChange,
}: {
  clients: Client[]
  onSubmitChange: (cr: { client_id: number; field_name: string; old_value: string; new_value: string; reason: string }) => Promise<void>
}) {
  const [selected, setSelected] = useState<Client | null>(null)
  const [field, setField] = useState<'rate_per_run' | 'minimum_fee'>('rate_per_run')
  const [newVal, setNewVal] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!selected || !newVal) return
    setSubmitting(true)
    await onSubmitChange({
      client_id: selected.id,
      field_name: field,
      old_value: String(field === 'rate_per_run' ? selected.rate_per_run : selected.minimum_fee),
      new_value: newVal,
      reason,
    })
    setSubmitting(false)
    setDone(true)
    setNewVal('')
    setReason('')
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Request Rate Change</h2>
      <div className="space-y-3">
        <select
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
          onChange={(e) => {
            const c = clients.find((x) => x.id === Number(e.target.value))
            setSelected(c || null)
          }}
          value={selected?.id || ''}
        >
          <option value="">Select client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
          value={field}
          onChange={(e) => setField(e.target.value as 'rate_per_run' | 'minimum_fee')}
        >
          <option value="rate_per_run">Rate per Run ($)</option>
          <option value="minimum_fee">Minimum Fee ($)</option>
        </select>

        {selected && (
          <p className="text-xs text-zinc-500">
            Current {field === 'rate_per_run' ? 'rate' : 'minimum'}:{' '}
            <span className="text-zinc-300">{fmt.usd(field === 'rate_per_run' ? selected.rate_per_run : selected.minimum_fee)}</span>
          </p>
        )}

        <input
          type="number"
          step="0.01"
          placeholder="New value"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />

        <textarea
          placeholder="Reason for change…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!selected || !newVal || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2 transition-colors"
        >
          {submitting ? 'Submitting…' : done ? '✓ Submitted' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  )
}


// ── Pending Changes Panel ──────────────────────────────────────────────────
function ChangesPanel({
  changes,
  onAction,
}: {
  changes: ChangeRequest[]
  onAction: (id: number, action: 'approved' | 'rejected') => Promise<void>
}) {
  const pending = changes.filter((c) => c.status === 'pending')
  const history = changes.filter((c) => c.status !== 'pending')

  function statusBadge(s: string) {
    if (s === 'approved') return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
    if (s === 'rejected') return 'bg-red-900/40 text-red-300 border border-red-700'
    return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
  }

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">No pending changes</p>
      ) : (
        <div className="space-y-3">
          {pending.map((cr) => (
            <div key={cr.id} className="bg-zinc-900 border border-yellow-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">{cr.client_name}</span>
                <span className="text-xs text-zinc-400">{new Date(cr.requested_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-400">
                <span className="text-zinc-300">{cr.field_name}</span>: ${cr.old_value} → ${cr.new_value}
              </p>
              {cr.reason && <p className="text-xs text-zinc-500 italic">{cr.reason}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onAction(cr.id, 'approved')}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => onAction(cr.id, 'rejected')}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">History</p>
          {history.slice(0, 5).map((cr) => (
            <div key={cr.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400">{cr.client_name} — {cr.field_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(cr.status)}`}>{cr.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [month, setMonth] = useState('2026-03')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'changes'>('overview')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, c, ch] = await Promise.all([
        fetch(`/api/metrics?month=${month}`).then((r) => r.json()),
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/changes').then((r) => r.json()),
      ])
      setMetrics(Array.isArray(m) ? m : [])
      setClients(Array.isArray(c) ? c : [])
      setChanges(Array.isArray(ch) ? ch : [])
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Aggregates
  const totalRevenue = metrics.reduce((s, m) => s + Number(m.gross_revenue), 0)
  const totalCost = metrics.reduce((s, m) => s + Number(m.llm_cost), 0)
  const totalGM = metrics.reduce((s, m) => s + Number(m.gross_margin), 0)
  const totalGMPct = totalRevenue > 0 ? (totalGM / totalRevenue) * 100 : 0
  const totalDoneRuns = metrics.reduce((s, m) => s + Number(m.done_runs), 0)
  const pendingCount = changes.filter((c) => c.status === 'pending').length

  async function handleSubmitChange(cr: { client_id: number; field_name: string; old_value: string; new_value: string; reason: string }) {
    await fetch('/api/changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cr),
    })
    await fetchAll()
  }

  async function handleChangeAction(id: number, action: 'approved' | 'rejected') {
    await fetch(`/api/changes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewed_by: 'vivaan' }),
    })
    await fetchAll()
  }

  const monthDisplay = new Date(month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">Z</div>
          <span className="font-semibold text-sm tracking-tight">Zamp Billing</span>
          <span className="text-zinc-600 text-sm">/</span>
          <span className="text-zinc-400 text-sm">{monthDisplay}</span>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={() => setTab('changes')}
              className="flex items-center gap-1.5 text-xs bg-yellow-900/40 border border-yellow-700 text-yellow-300 px-3 py-1 rounded-full"
            >
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {pendingCount} pending
            </button>
          )}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Total Revenue" value={fmt.usd(totalRevenue)} />
          <KpiCard label="LLM Cost" value={fmt.usd(totalCost)} />
          <KpiCard label="Gross Margin" value={fmt.usd(totalGM)} />
          <KpiCard label="GM %" value={fmt.pct(totalGMPct)} color={gmColor(totalGMPct)} />
          <KpiCard label="Done Runs" value={fmt.num(totalDoneRuns)} sub="billable" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          {(['overview', 'changes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t === 'changes' ? `Changes${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'Overview'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client table — spans 2 cols */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">Client Breakdown</h2>
              {metrics.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No data for {monthDisplay}</p>
              ) : (
                <MetricsTable metrics={metrics} />
              )}
            </div>
            {/* Rate config — 1 col */}
            <div>
              <ConfigPanel clients={clients} onSubmitChange={handleSubmitChange} />
            </div>
          </div>
        ) : (
          <div className="max-w-xl">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">Approval Queue</h2>
              <ChangesPanel changes={changes} onAction={handleChangeAction} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Pending Changes Panel ──────────────────────────────────────────────────
function ChangesPanel({
  changes,
  onAction,
}: {
  changes: ChangeRequest[]
  onAction: (id: number, action: 'approved' | 'rejected') => Promise<void>
}) {
  const pending = changes.filter((c) => c.status === 'pending')
  const history = changes.filter((c) => c.status !== 'pending')

  function statusBadge(s: string) {
    if (s === 'approved') return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
    if (s === 'rejected') return 'bg-red-900/40 text-red-300 border border-red-700'
    return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
  }

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">No pending changes</p>
      ) : (
        <div className="space-y-3">
          {pending.map((cr) => (
            <div key={cr.id} className="bg-zinc-900 border border-yellow-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">{cr.client_name}</span>
                <span className="text-xs text-zinc-400">{new Date(cr.requested_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-400">
                <span className="text-zinc-300">{cr.field_name}</span>: ${cr.old_value} → ${cr.new_value}
              </p>
              {cr.reason && <p className="text-xs text-zinc-500 italic">{cr.reason}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onAction(cr.id, 'approved')}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => onAction(cr.id, 'rejected')}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">History</p>
          {history.slice(0, 5).map((cr) => (
            <div key={cr.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400">{cr.client_name} — {cr.field_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(cr.status)}`}>{cr.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
