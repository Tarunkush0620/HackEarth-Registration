// Safety net: confirms the registration even if the participant closes the tab after paying.
// Dashboard > Settings > Webhooks > URL: https://<your-site>/api/razorpay-webhook
// Events: payment.captured, order.paid   Secret: RAZORPAY_WEBHOOK_SECRET
const crypto = require('crypto');
const { json, readRaw } = require('../lib/http');
const { markPaidAndNotify } = require('../lib/finalize');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const raw = await readRaw(req);
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(sig || ''));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 400, { error: 'Bad signature' });

    const event = JSON.parse(raw.toString('utf8'));
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const p = event.payload?.payment?.entity;
      if (p?.order_id && p?.id) {
        try {
          await markPaidAndNotify({ orderId: p.order_id, paymentId: p.id });
        } catch (e) {
          // Order not in our DB (e.g. another product on the same Razorpay account): ignore with 200
          console.error('webhook finalize skipped:', e.message);
        }
      }
    }
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error('webhook failed', err);
    return json(res, 500, { error: 'Webhook error' }); // Razorpay will retry
  }
};
// We need the untouched body to verify the signature
module.exports.config = { api: { bodyParser: false } };
