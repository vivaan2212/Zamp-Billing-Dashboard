import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || '2026-03'
  const [year, mon] = month.split('-').map(Number)

  try {
    const result = await query(`
      SELECT 
        c.name AS client_name,
        c.schema_name AS slug,
        m.period_year,
        m.period_month,
        m.done_runs,
        m.void_runs,
        m.total_runs,
        m.gross_revenue,
        m.llm_cost,
        m.gross_margin,
        m.gm_pct,
        m.computed_at
      FROM billing_monthly_metrics m
      JOIN billing_clients c ON c.id = m.client_id
      WHERE m.period_year = $1 AND m.period_month = $2
      ORDER BY c.name
    `, [year, mon])
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
