// POST /api/update-team -> Super Admin only (Tarun Kushwaha) can edit and manage team records
const getDb = require('../lib/db');
const { json, readJson } = require('../lib/http');
const { requireSuperAdmin } = require('../lib/auth');
const { FIELDS, brief } = require('../lib/team');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const auth = requireSuperAdmin(req, res);
  if (!auth) return;

  try {
    const body = await readJson(req);
    const code = String(body.code || '').trim().toUpperCase();
    const m = code.match(/HE26-[A-Z0-9]{6}/);
    if (!m) return json(res, 400, { error: 'Invalid registration code.' });

    const db = getDb();
    const { data: existing, error: e1 } = await db.from('registrations').select(FIELDS).eq('reg_code', m[0]).maybeSingle();
    if (e1) throw e1;
    if (!existing) return json(res, 404, { error: 'Team not found.' });

    const updates = {};
    if (body.teamName) {
      updates.team_name = String(body.teamName).trim();
      updates.team_name_key = updates.team_name.toLowerCase();
    }
    if (body.track) updates.track = String(body.track).trim();
    if (body.ideaTitle !== undefined) updates.idea_title = String(body.ideaTitle).trim();
    if (body.college) updates.college = String(body.college).trim();
    if (body.city !== undefined) updates.city = String(body.city).trim();
    if (body.unstopTeamId !== undefined) updates.unstop_team_id = String(body.unstopTeamId).trim();
    if (body.leaderPhone) updates.leader_phone = String(body.leaderPhone).trim();
    if (body.leaderEmail) updates.leader_email = String(body.leaderEmail).trim().toLowerCase();
    if (body.emergencyName !== undefined) updates.emergency_name = String(body.emergencyName).trim();
    if (body.emergencyRelation !== undefined) updates.emergency_relation = String(body.emergencyRelation).trim();
    if (body.emergencyPhone !== undefined) updates.emergency_phone = String(body.emergencyPhone).trim();

    if (body.needStay !== undefined) {
      updates.need_stay = Boolean(body.needStay);
      if (body.stayCount !== undefined) updates.stay_count = Number(body.stayCount) || 0;
    }

    if (Array.isArray(body.members) && body.members.length > 0) {
      updates.members = body.members.map((mem) => ({
        name: String(mem.name || '').trim(),
        email: String(mem.email || '').trim().toLowerCase(),
        gender: String(mem.gender || 'student').trim(),
        phone: String(mem.phone || '').trim(),
        rollNumber: String(mem.rollNumber || '').trim(),
      }));
    }

    const { data: updated, error: e2 } = await db
      .from('registrations')
      .update(updates)
      .eq('id', existing.id)
      .select(FIELDS)
      .maybeSingle();

    if (e2) throw e2;
    console.log(`[SUPER ADMIN] Record ${code} updated by ${auth.name}`);
    return json(res, 200, { ok: true, team: brief(updated) });
  } catch (err) {
    console.error('update-team failed:', err);
    return json(res, 500, { error: 'Failed to update record.' });
  }
};

