import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || '2026-03'
  const billingMonth = `${month}-01`

  try {
    const result = await query(`
      SELECT
        c.name AS client_name,
        c.schema_name AS slug,
        TO_CHAR(m.billing_month, 'YYYY-MM') AS period,
        m.done_count,
        m.void_count,
        m.needs_attention_count,
        m.needs_review_count,
        m.total_runs,
        m.llm_cost,
        m.cost_per_done_run,
        m.rate_applied,
        m.raw_revenue,
        m.billed_revenue,
        m.additional_fees_total,
        m.total_billed,
        m.gross_margin_dollars,
        m.gross_margin_pct,
        m.computed_at
      FROM billing_monthly_metrics m
      JOIN billing_clients c ON c.id = m.client_id
      WHERE m.billing_month = $1
      ORDER BY c.name
    `, [billingMonth])
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
