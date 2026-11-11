// GET ?q=... -> up to 20 paid teams matching any detail (name, code, idea, college, city, unstop ID, roll number, phone, email)
const getDb = require('../lib/db');
const { json } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { FIELDS, brief } = require('../lib/team');

module.exports = async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const url = new URL(req.url, 'http://localhost');
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    if (q.length < 2) return json(res, 200, { results: [] });

    const { data, error } = await getDb().from('registrations').select(FIELDS).eq('status', 'paid');
    if (error) throw error;

    const hit = (data || []).filter((r) => {
      const memberTokens = (r.members || []).flatMap((m) => [m.name, m.email, m.phone, m.rollNumber]);
      const teamIdStr = r.team_id || (r.team_number ? String(r.team_number).padStart(3, '0') : '');
      const hay = [
        teamIdStr,
        teamIdStr ? `team ${teamIdStr}` : '',
        teamIdStr ? `team #${teamIdStr}` : '',
        r.team_name,
        r.reg_code,
        r.track,
        r.idea_title,
        r.college,
        r.city,
        r.unstop_team_id,
        r.leader_name,
        r.leader_email,
        r.leader_phone,
        r.emergency_name,
        r.emergency_phone,
        r.razorpay_payment_id,
        ...memberTokens,
      ].filter(Boolean).join(' ').toLowerCase();

      return hay.includes(q);
    }).slice(0, 25);

    return json(res, 200, { results: hit.map(brief) });
  } catch (err) {
    console.error('search failed', err);
    return json(res, 500, { error: 'Search failed. Try again.' });
  }
};
