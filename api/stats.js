const getDb = require('../lib/db');
const { json } = require('../lib/http');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  try {
    const db = getDb();
    const { data, error } = await db.from('registrations').select('checked_in, is_all_female, need_stay, stay_count, status');
    if (error) {
      console.error('Supabase stats error:', error);
      return json(res, 200, {
        paid: 0,
        checkedIn: 0,
        pending: 0,
        allFemale: 0,
        stayTeams: 0,
        error: error.message,
        errorCode: error.code,
        currentOrganiser: auth.name,
      });
    }
    const list = (data || []).filter((r) => r.status === 'paid');
    const paid = list.length;
    const checkedIn = list.filter((r) => r.checked_in).length;
    const allFemale = list.filter((r) => r.is_all_female).length;
    const stayTeams = list.filter((r) => r.need_stay).length;

    return json(res, 200, {
      paid,
      checkedIn,
      pending: paid - checkedIn,
      allFemale,
      stayTeams,
      currentOrganiser: auth.name,
    });
  } catch (err) {
    console.error('stats failed', err);
    return json(res, 500, { error: 'Could not load counts: ' + err.message });
  }
};

