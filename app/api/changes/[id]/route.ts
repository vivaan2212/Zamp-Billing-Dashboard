import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { action, reviewed_by } = await req.json()
    const id = Number(params.id)

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await query(`
      UPDATE billing_change_requests
      SET status = $1, reviewed_by = $2, updated_at = NOW()
      WHERE id = $3
    `, [action, reviewed_by || 'dashboard', id])

    if (action === 'approved') {
      const cr = await query(`
        SELECT client_id, field_name, new_value FROM billing_change_requests WHERE id = $1
      `, [id])

      if (cr.rows.length > 0) {
        const { client_id, field_name, new_value } = cr.rows[0]

        await query(`
          UPDATE billing_config SET status = 'superseded' WHERE client_id = $1 AND status = 'active'
        `, [client_id])

        const current = await query(`
          SELECT rate_per_run, minimum_commitment FROM billing_config
          WHERE client_id = $1 AND status = 'superseded'
          ORDER BY updated_at DESC LIMIT 1
        `, [client_id])

        const cur = current.rows[0] || { rate_per_run: null, minimum_commitment: null }
        const newRate = field_name === 'rate_per_run' ? new_value : cur.rate_per_run
        const newMin = field_name === 'minimum_fee' ? new_value : cur.minimum_commitment

        await query(`
          INSERT INTO billing_config (client_id, rate_per_run, minimum_commitment, status, effective_from)
          VALUES ($1, $2, $3, 'active', NOW())
        `, [client_id, newRate, newMin])
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
