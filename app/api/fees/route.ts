import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || '2026-03'
  const [year, mon] = month.split('-').map(Number)

  try {
    const result = await query(`
      SELECT f.id, c.name AS client_name, c.slug,
             f.period_year, f.period_month,
             f.platform_fee, f.support_fee, f.other_fee, f.notes
      FROM billing_fees f
      JOIN billing_clients c ON c.id = f.client_id
      WHERE f.period_year = $1 AND f.period_month = $2
      ORDER BY c.name
    `, [year, mon])
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
