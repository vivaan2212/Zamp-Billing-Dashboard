import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { action, reviewed_by } = await req.json()
    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    // Update status
    const updated = await query(`
      UPDATE billing_change_requests
      SET status = $1, reviewed_at = now(), reviewed_by = $2
      WHERE id = $3 RETURNING *
    `, [action, reviewed_by || 'admin', params.id])

    if (updated.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const cr = updated.rows[0]

    // If approved, apply the change to billing_config
    if (action === 'approved') {
      if (cr.field_name === 'rate_per_run') {
        // Deactivate current config
        await query(`UPDATE billing_config SET is_active = false WHERE client_id = $1 AND is_active = true`, [cr.client_id])
        // Insert new config row
        await query(`
          INSERT INTO billing_config (client_id, rate_per_run, minimum_fee, effective_from, is_active)
          SELECT $1, $2, minimum_fee, now(), true
          FROM billing_config WHERE client_id = $1 ORDER BY effective_from DESC LIMIT 1
        `, [cr.client_id, parseFloat(cr.new_value)])
      } else if (cr.field_name === 'minimum_fee') {
        await query(`UPDATE billing_config SET is_active = false WHERE client_id = $1 AND is_active = true`, [cr.client_id])
        await query(`
          INSERT INTO billing_config (client_id, rate_per_run, minimum_fee, effective_from, is_active)
          SELECT $1, rate_per_run, $2, now(), true
          FROM billing_config WHERE client_id = $1 ORDER BY effective_from DESC LIMIT 1
        `, [cr.client_id, parseFloat(cr.new_value)])
      }
    }

    return NextResponse.json({ ok: true, row: cr })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
