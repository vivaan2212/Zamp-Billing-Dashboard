import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT cr.id, c.name AS client_name, cr.field_name,
             cr.old_value, cr.new_value, cr.reason,
             cr.status, cr.requested_at, cr.reviewed_at, cr.reviewed_by
      FROM billing_change_requests cr
      JOIN billing_clients c ON c.id = cr.client_id
      ORDER BY cr.requested_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { client_id, field_name, old_value, new_value, reason } = body
    const result = await query(`
      INSERT INTO billing_change_requests 
        (client_id, field_name, old_value, new_value, reason, status, requested_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', now())
      RETURNING *
    `, [client_id, field_name, String(old_value), String(new_value), reason])
    return NextResponse.json(result.rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
