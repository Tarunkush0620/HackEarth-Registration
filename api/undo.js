// POST {code} -> reverses a check-in made by mistake
const getDb = require('../lib/db');
const { json, readJson } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { FIELDS, brief } = require('../lib/team');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await readJson(req);
    const code = String(body.code || '').trim().toUpperCase();
    const m = code.match(/HE26-[A-Z0-9]{6}/);
    if (!m) return json(res, 400, { error: 'Bad registration code format.' });

    const { data, error } = await getDb()
      .from('registrations')
      .update({
        checked_in: false,
        checked_in_at: null,
        checked_in_by: null,
      })
      .eq('reg_code', m[0])
      .eq('status', 'paid')
      .select(FIELDS)
      .maybeSingle();

    if (error) throw error;
    if (!data) return json(res, 404, { error: 'No paid team found with that code.' });

    return json(res, 200, { ok: true, ...brief(data) });
  } catch (err) {
    console.error('undo failed', err);
    return json(res, 500, { error: 'Could not undo check-in. Try again.' });
  }
};
