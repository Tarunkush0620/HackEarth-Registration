const getDb = require('../lib/db');
const { json } = require('../lib/http');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  try {
    const { data, error } = await getDb().from('registrations').select('checked_in, is_all_female, need_stay, stay_count').eq('status', 'paid');
    if (error) throw error;
    const list = data || [];
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
    return json(res, 500, { error: 'Could not load counts.' });
  }
};

