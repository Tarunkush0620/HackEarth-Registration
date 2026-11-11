const crypto = require('crypto');
const getDb = require('../lib/db');
const razorpay = require('../lib/razorpay');
const { json, readJson } = require('../lib/http');
const { markPaidAndNotify } = require('../lib/finalize');

function validSignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = await readJson(req);
    if (!orderId || !paymentId || !sig) return json(res, 400, { error: 'Missing payment details.' });
    if (!validSignature(orderId, paymentId, sig)) return json(res, 400, { error: 'Payment signature could not be verified.' });

    const { data: reg, error } = await getDb().from('registrations').select('*').eq('razorpay_order_id', orderId).maybeSingle();
    if (error) throw error;
    if (!reg) return json(res, 404, { error: 'Registration not found for this payment.' });

    // Double-check with Razorpay: right order, right amount, captured
    let payment = await razorpay().payments.fetch(paymentId);
    if (payment.order_id !== orderId || payment.amount !== reg.amount_paise) {
      return json(res, 400, { error: 'Payment details do not match the registration.' });
    }
    if (payment.status === 'authorized') {
      payment = await razorpay().payments.capture(paymentId, reg.amount_paise, 'INR');
    }
    if (payment.status !== 'captured') {
      return json(res, 402, { error: `Payment is ${payment.status}. If money was deducted it will be confirmed by email shortly.` });
    }

    const { reg: paid, png, pdf, emailed } = await markPaidAndNotify({ orderId, paymentId });
    const teamId = paid.team_id || (paid.team_number ? String(paid.team_number).padStart(3, '0') : '001');
    return json(res, 200, {
      ok: true,
      teamId,
      teamNumber: paid.team_number || 1,
      regCode: paid.reg_code,
      teamName: paid.team_name,
      isAllFemale: paid.is_all_female,
      needStay: paid.need_stay,
      stayCount: paid.stay_count,
      fee: Math.round(paid.amount_paise / 100),
      emails: paid.members.map((m) => m.email),
      emailed,
      qr: `data:image/png;base64,${png.toString('base64')}`,
      invoicePdf: `data:application/pdf;base64,${pdf.toString('base64')}`,
    });
  } catch (err) {
    console.error('verify-payment failed', err);
    return json(res, 500, {
      error: 'We could not confirm your registration just now. If money was deducted, your confirmation email will arrive within a few minutes.',
    });
  }
};
