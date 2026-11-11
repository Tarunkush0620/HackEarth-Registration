// POST {payload} (scanned QR text) or {code} (typed / picked from search)
// -> { status: ok | already | invalid | notfound | unpaid, ...team }
const getDb = require('../lib/db');
const { json, readJson } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { parsePayload } = require('../lib/qr');
const { FIELDS, brief } = require('../lib/team');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await readJson(req);
    let code;
    if (body.payload) {
      const p = parsePayload(body.payload);
      if (!p) return json(res, 200, { status: 'invalid', note: 'QR signature does not match. Possible forged or expired QR pass.' });
      code = p.code;
    } else {
      const clean = String(body.code || '').trim().toUpperCase();
      const m = clean.match(/HE26-[A-Z0-9]{6}/);
      if (!m) return json(res, 200, { status: 'invalid', note: 'Invalid registration code format (expected HE26-XXXXXX).' });
      code = m[0];
    }

    const db = getDb();
    const { data: reg, error } = await db.from('registrations').select(FIELDS).eq('reg_code', code).maybeSingle();
    if (error) throw error;
    if (!reg) return json(res, 200, { status: 'notfound', code });
    if (reg.status !== 'paid') return json(res, 200, { status: 'unpaid', ...brief(reg) });

    // Atomic: only one scan can flip checked_in from false to true
    const { data: claimed, error: e2 } = await db
      .from('registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: auth.name,
      })
      .eq('id', reg.id)
      .eq('checked_in', false)
      .select(FIELDS)
      .maybeSingle();
    if (e2) throw e2;

    if (claimed) return json(res, 200, { status: 'ok', ...brief(claimed) });

    const { data: again } = await db.from('registrations').select(FIELDS).eq('id', reg.id).maybeSingle();
    return json(res, 200, { status: 'already', ...brief(again || reg) });
  } catch (err) {
    console.error('scan failed', err);
    return json(res, 500, { error: 'Could not reach the database. Try again.' });
  }
};
