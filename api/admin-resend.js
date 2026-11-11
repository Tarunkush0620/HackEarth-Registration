// Re-send the confirmation email: POST /api/admin-resend  header x-admin-key: <ADMIN_KEY>  body {"regCode":"HE26-XXXXXX"}
const crypto = require('crypto');
const getDb = require('../lib/db');
const { json, readJson } = require('../lib/http');
const { buildCard } = require('../lib/qr');
const { buildInvoicePdf } = require('../lib/invoice');
const { sendConfirmation } = require('../lib/mailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const key = String(req.headers['x-admin-key'] || '');
  const want = String(process.env.ADMIN_KEY || '');
  const ok = want && key.length === want.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(want));
  if (!ok) return json(res, 401, { error: 'Unauthorized' });
  try {
    const { regCode } = await readJson(req);
    const db = getDb();
    const { data: reg, error } = await db.from('registrations').select('*').eq('reg_code', regCode).eq('status', 'paid').maybeSingle();
    if (error) throw error;
    if (!reg) return json(res, 404, { error: 'No paid registration with that code.' });
    const [png, pdf] = await Promise.all([
      buildCard({
        teamName: reg.team_name,
        regCode: reg.reg_code,
        trackId: reg.track,
        isAllFemale: reg.is_all_female,
        needStay: reg.need_stay,
        stayCount: reg.stay_count,
      }),
      buildInvoicePdf(reg),
    ]);
    await sendConfirmation(reg, png, pdf);
    await db.from('registrations').update({ email_sent_at: new Date().toISOString() }).eq('id', reg.id);
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error('admin-resend failed', err);
    return json(res, 500, { error: 'Resend failed' });
  }
};
