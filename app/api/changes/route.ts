import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT cr.id, c.name AS client_name, cr.change_type, cr.field_name,
             cr.old_value, cr.new_value, cr.change_note AS reason,
             cr.requested_by, cr.status, cr.reviewed_by,
             cr.created_at AS requested_at
      FROM billing_change_requests cr
      JOIN billing_clients c ON c.id = cr.client_id
      ORDER BY cr.created_at DESC
      LIMIT 50
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
        (client_id, change_type, field_name, old_value, new_value, change_note, requested_by, status)
      VALUES ($1, 'rate_update', $2, $3, $4, $5, 'dashboard', 'pending')
      RETURNING id
    `, [client_id, field_name, old_value, new_value, reason || ''])

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
