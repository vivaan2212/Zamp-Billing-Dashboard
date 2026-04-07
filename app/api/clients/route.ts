import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT c.id, c.name, c.slug, c.status,
             bc.rate_per_run, bc.minimum_commitment AS minimum_fee, bc.effective_from
      FROM billing_clients c
      LEFT JOIN billing_config bc ON bc.client_id = c.id AND bc.status = 'active'
      ORDER BY c.name
    `)
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
