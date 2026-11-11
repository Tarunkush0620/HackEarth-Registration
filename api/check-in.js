// Entry Desk Scanner Route: POST /api/check-in
// Checks in teams at the event venue by scanning their RSVP QR or entering their code.
const crypto = require('crypto');
const getDb = require('../lib/db');
const { json, readJson } = require('../lib/http');
const { parsePayload } = require('../lib/qr');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Return live desk stats
    try {
      const db = getDb();
      const { data, error } = await db.from('registrations').select('id, status, checked_in, is_all_female, need_stay');
      if (error) throw error;
      const paid = data.filter((r) => r.status === 'paid');
      const checkedIn = paid.filter((r) => r.checked_in);
      return json(res, 200, {
        totalPaid: paid.length,
        checkedIn: checkedIn.length,
        pendingCheckIn: paid.length - checkedIn.length,
        allFemaleTeams: paid.filter((r) => r.is_all_female).length,
        stayTeams: paid.filter((r) => r.need_stay).length,
      });
    } catch (err) {
      console.error('check-in stats error:', err);
      return json(res, 500, { error: 'Could not fetch check-in stats' });
    }
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const { qrText, codeInput, adminKey } = body;

    // Optional admin key check if configured
    const configuredKey = process.env.ADMIN_KEY;
    if (configuredKey && configuredKey !== 'choose-a-long-random-string') {
      const providedKey = String(adminKey || req.headers['x-admin-key'] || '');
      if (providedKey !== configuredKey) {
        return json(res, 401, { error: 'Unauthorized desk key' });
      }
    }

    let regCode = null;

    // 1. Resolve code from QR payload
    if (qrText) {
      const parsed = parsePayload(qrText);
      if (!parsed) {
        return json(res, 400, { error: 'Invalid or forged QR code signature. Do not admit.' });
      }
      regCode = parsed.code;
    } else if (codeInput) {
      const clean = String(codeInput).trim().toUpperCase();
      const match = clean.match(/HE26-[A-Z0-9]{6}/);
      if (!match) {
        return json(res, 400, { error: 'Invalid registration code format (expected HE26-XXXXXX).' });
      }
      regCode = match[0];
    } else {
      return json(res, 400, { error: 'Please scan a QR or enter a registration code.' });
    }

    // 2. Fetch registration from DB
    const db = getDb();
    const { data: reg, error } = await db.from('registrations').select('*').eq('reg_code', regCode).maybeSingle();
    if (error) throw error;
    if (!reg) {
      return json(res, 404, { error: `No registration found for code ${regCode}.` });
    }

    if (reg.status !== 'paid') {
      return json(res, 402, {
        error: `Team "${reg.team_name}" has not completed payment (status: ${reg.status}).`,
        team: {
          teamId: reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001'),
          regCode: reg.reg_code,
          teamName: reg.team_name,
          status: reg.status,
        },
      });
    }

    // 3. Check if already checked in
    if (reg.checked_in) {
      return json(res, 200, {
        ok: true,
        alreadyCheckedIn: true,
        checkedInAt: reg.checked_in_at,
        team: {
          teamId: reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001'),
          regCode: reg.reg_code,
          teamName: reg.team_name,
          track: reg.track,
          college: reg.college,
          isAllFemale: reg.is_all_female,
          needStay: reg.need_stay,
          stayCount: reg.stay_count,
          leaderName: reg.leader_name,
          leaderPhone: reg.leader_phone,
          emergencyName: reg.emergency_name,
          emergencyRelation: reg.emergency_relation,
          emergencyPhone: reg.emergency_phone,
          members: reg.members,
        },
      });
    }

    // 4. Mark checked in
    const now = new Date().toISOString();
    const { error: updErr } = await db.from('registrations').update({ checked_in: true, checked_in_at: now }).eq('id', reg.id);
    if (updErr) throw updErr;

    return json(res, 200, {
      ok: true,
      alreadyCheckedIn: false,
      checkedInAt: now,
      team: {
        regCode: reg.reg_code,
        teamName: reg.team_name,
        track: reg.track,
        college: reg.college,
        isAllFemale: reg.is_all_female,
        needStay: reg.need_stay,
        stayCount: reg.stay_count,
        leaderName: reg.leader_name,
        leaderPhone: reg.leader_phone,
        emergencyName: reg.emergency_name,
        emergencyRelation: reg.emergency_relation,
        emergencyPhone: reg.emergency_phone,
        members: reg.members,
      },
    });
  } catch (err) {
    console.error('check-in processing failed:', err);
    return json(res, 500, { error: 'Check-in server error' });
  }
};

