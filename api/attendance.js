// POST /api/attendance -> Organisers update individual member presence (Present / Absent)
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
    if (!m) return json(res, 400, { error: 'Invalid registration code.' });

    const db = getDb();
    const { data: reg, error: e1 } = await db.from('registrations').select(FIELDS).eq('reg_code', m[0]).maybeSingle();
    if (e1) throw e1;
    if (!reg) return json(res, 404, { error: 'Team not found.' });

    const members = reg.members || [];
    const attendanceList = body.attendance; // array of booleans [true, false, true] OR objects

    if (Array.isArray(attendanceList)) {
      members.forEach((mem, idx) => {
        if (typeof attendanceList[idx] === 'boolean') {
          mem.present = attendanceList[idx];
        } else if (typeof attendanceList[idx] === 'object' && attendanceList[idx] !== null) {
          mem.present = attendanceList[idx].present !== false;
        }
      });
    }

    const { data: updated, error: e2 } = await db
      .from('registrations')
      .update({ members, checked_in_by: auth.name })
      .eq('id', reg.id)
      .select(FIELDS)
      .maybeSingle();

    if (e2) throw e2;
    console.log(`[ATTENDANCE] Team ${code} attendance updated by ${auth.name}`);
    return json(res, 200, { ok: true, team: brief(updated) });
  } catch (err) {
    console.error('attendance update failed:', err);
    return json(res, 500, { error: 'Failed to update attendance.' });
  }
};

