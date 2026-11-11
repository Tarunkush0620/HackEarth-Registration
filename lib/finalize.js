const getDb = require('./db');
const { buildCard } = require('./qr');
const { buildInvoicePdf } = require('./invoice');
const { sendConfirmation } = require('./mailer');

/* Called from /api/verify-payment AND the Razorpay webhook.
   Safe to run twice: only the call that flips pending -> paid sends the email. */
async function markPaidAndNotify({ orderId, paymentId }) {
  const db = getDb();
  const { data: claimed, error } = await db
    .from('registrations')
    .update({ status: 'paid', razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('razorpay_order_id', orderId)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (error) throw error;

  let reg = claimed;
  if (!reg) {
    const { data, error: e2 } = await db.from('registrations').select('*').eq('razorpay_order_id', orderId).maybeSingle();
    if (e2) throw e2;
    if (!data || data.status !== 'paid') throw new Error(`No paid registration for order ${orderId}`);
    reg = data;
  }

  const teamId = reg.team_id || (reg.team_number ? String(reg.team_number).padStart(3, '0') : '001');
  const [png, pdf] = await Promise.all([
    buildCard({
      teamName: reg.team_name,
      regCode: reg.reg_code,
      trackId: reg.track,
      isAllFemale: reg.is_all_female,
      needStay: reg.need_stay,
      stayCount: reg.stay_count,
      teamId,
    }),
    buildInvoicePdf(reg),
  ]);

  let emailed = !!reg.email_sent_at;
  if (claimed) {
    try {
      await sendConfirmation(reg, png, pdf);
      await db.from('registrations').update({ email_sent_at: new Date().toISOString() }).eq('id', reg.id);
      emailed = true;
    } catch (err) {
      // Payment is safe in the DB; use /api/admin-resend to retry the email.
      console.error('Email failed for', reg.reg_code, err);
    }
  }
  return { reg, png, pdf, emailed };
}

module.exports = { markPaidAndNotify };
